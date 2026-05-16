import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdraw, WithdrawStatus } from './entities/withdraw.entity';
import { WalletService } from '../wallet/wallet.service';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Percentage, PercentageType } from '../percentage/entities/percentage.entity';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { DirectWithdrawDto } from './dto/direct-withdraw.dto';

@Injectable()
export class WithdrawService {
  constructor(
    @InjectRepository(Withdraw)
    private withdrawRepository: Repository<Withdraw>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Percentage)
    private percentageRepository: Repository<Percentage>,
    private walletService: WalletService,
  ) {}

  async requestWithdrawal(userId: number, createWithdrawDto: CreateWithdrawDto) {
    const product = await this.productRepository.findOne({
      where: { id: createWithdrawDto.productId, user: { id: userId } },
      relations: ['user'],
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to you');
    }

    if (product.status !== ProductStatus.APPROVED) {
      throw new BadRequestException(`Product must be APPROVED to request withdrawal. Current status: ${product.status}`);
    }

    const existingWithdraw = await this.withdrawRepository.findOne({
      where: { product: { id: product.id }, status: WithdrawStatus.PENDING },
    });

    if (existingWithdraw) {
      throw new BadRequestException('A withdrawal request for this product is already pending');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const withdraw = this.withdrawRepository.create({
      user,
      product,
      totalAmount: product.totalAmount,
      status: WithdrawStatus.PENDING,
    });

    return await this.withdrawRepository.save(withdraw);
  }

  private async getPercentageForUser(role: UserRole): Promise<Percentage> {
    let type: PercentageType;

    switch (role) {
      case UserRole.STUDENT:
        type = PercentageType.STUDENT;
        break;
      case UserRole.AFFILIATE:
        type = PercentageType.AFFILIATE;
        break;
      default:
        type = PercentageType.PERCENTAGE; // Default fallback
        break;
    }

    const percentage = await this.percentageRepository.findOne({ where: { type } });
    if (!percentage) {
      throw new NotFoundException(`Percentage configuration for ${type} not found. Please configure it in settings.`);
    }
    return percentage;
  }

  async approveWithdrawal(withdrawId: number, percentageId?: number) {
    const withdraw = await this.withdrawRepository.findOne({
      where: { id: withdrawId },
      relations: ['user', 'product'],
    });

    if (!withdraw) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (withdraw.status !== WithdrawStatus.PENDING) {
      throw new BadRequestException(`Withdrawal request is already ${withdraw.status}`);
    }

    let percentageEntity: Percentage | null = null;
    if (percentageId) {
      percentageEntity = await this.percentageRepository.findOne({ where: { id: percentageId } });
    } else {
      percentageEntity = await this.getPercentageForUser(withdraw.user.role);
    }

    if (!percentageEntity) {
      throw new NotFoundException('Percentage configuration not found');
    }

    const percentage = Number(percentageEntity.percentage);
    const totalAmount = Number(withdraw.totalAmount);
    const adminAmount = (totalAmount * percentage) / 100;
    const studentAmount = totalAmount - adminAmount;

    const adminUser = await this.userRepository.findOne({ where: { role: UserRole.ADMIN } });
    if (!adminUser) {
      throw new BadRequestException('No admin user found to receive platform fees');
    }

    await this.walletService.addBalance(withdraw.user.id, studentAmount);
    await this.walletService.addBalance(adminUser.id, adminAmount);

    await this.productRepository.update(withdraw.product.id, { status: ProductStatus.PAID });

    withdraw.percentage = percentageEntity;
    withdraw.adminAmount = adminAmount;
    withdraw.studentAmount = studentAmount;
    withdraw.status = WithdrawStatus.APPROVED;

    return await this.withdrawRepository.save(withdraw);
  }

  async rejectWithdrawal(withdrawId: number, reason: string) {
    const withdraw = await this.withdrawRepository.findOne({ where: { id: withdrawId } });
    if (!withdraw) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (withdraw.status !== WithdrawStatus.PENDING) {
      throw new BadRequestException(`Withdrawal request is already ${withdraw.status}`);
    }

    withdraw.status = WithdrawStatus.REJECTED;
    withdraw.rejectReason = reason;

    return await this.withdrawRepository.save(withdraw);
  }

  async directWithdrawal(dto: DirectWithdrawDto) {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, user: { id: dto.studentId } },
      relations: ['user'],
    });

    if (!product) {
      throw new NotFoundException('Product not found for this student');
    }

    if (product.status !== ProductStatus.APPROVED) {
      throw new BadRequestException('Only APPROVED products can be withdrawn');
    }

    const student = await this.userRepository.findOne({ where: { id: dto.studentId } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }

    let percentageEntity: Percentage | null = null;
    if (dto.percentageId) {
      percentageEntity = await this.percentageRepository.findOne({ where: { id: dto.percentageId } });
    } else {
      percentageEntity = await this.getPercentageForUser(student.role);
    }

    if (!percentageEntity) {
      throw new NotFoundException('Percentage configuration not found');
    }
    
    const totalAmount = Number(product.totalAmount);
    const percentage = Number(percentageEntity.percentage);
    const adminAmount = (totalAmount * percentage) / 100;
    const studentAmount = totalAmount - adminAmount;

    const adminUser = await this.userRepository.findOne({ where: { role: UserRole.ADMIN } });
    if (!adminUser) {
      throw new BadRequestException('No admin user found to receive platform fees');
    }

    await this.walletService.addBalance(student.id, studentAmount);
    await this.walletService.addBalance(adminUser.id, adminAmount);

    await this.productRepository.update(product.id, { status: ProductStatus.PAID });

    const withdraw = this.withdrawRepository.create({
      user: student,
      product,
      percentage: percentageEntity,
      totalAmount,
      adminAmount,
      studentAmount,
      status: WithdrawStatus.APPROVED,
    });

    return await this.withdrawRepository.save(withdraw);
  }

  async findAll(user: User, options: { search?: string; status?: WithdrawStatus; page?: number; limit?: number } = {}) {
    const { search, status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const query = this.withdrawRepository.createQueryBuilder('withdraw')
      .leftJoinAndSelect('withdraw.user', 'user')
      .leftJoinAndSelect('withdraw.product', 'product')
      .leftJoinAndSelect('withdraw.percentage', 'percentage')
      .orderBy('withdraw.createdAt', 'DESC');

    if (user.role !== UserRole.ADMIN) {
      query.andWhere('user.id = :userId', { userId: user.id });
    }

    if (status) {
      query.andWhere('withdraw.status = :status', { status });
    }

    if (search) {
      query.andWhere('(user.name ILIKE :search OR user.email ILIKE :search OR product.botName ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [items, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOnlyMy(user: User, options: { search?: string; status?: WithdrawStatus; page?: number; limit?: number } = {}) {
    const { search, status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const query = this.withdrawRepository.createQueryBuilder('withdraw')
      .leftJoinAndSelect('withdraw.user', 'user')
      .leftJoinAndSelect('withdraw.product', 'product')
      .leftJoinAndSelect('withdraw.percentage', 'percentage')
      .where('user.id = :userId', { userId: user.id })
      .orderBy('withdraw.createdAt', 'DESC');

    if (status) {
      query.andWhere('withdraw.status = :status', { status });
    }

    if (search) {
      query.andWhere('(product.botName ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [items, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublicLive() {
    const withdraws = await this.withdrawRepository.find({
      where: { status: WithdrawStatus.APPROVED },
      relations: ['user'],
      order: { updatedAt: 'DESC' },
      take: 20,
    });

    return withdraws.map(w => ({
      userName: this.maskName(w.user.name),
      userPhoto: w.user.photo,
      amount: w.studentAmount,
      time: w.updatedAt,
    }));
  }

  private maskName(name: string): string {
    if (!name) return 'User';
    const parts = name.split(' ');
    return parts.map(part => {
      if (part.length <= 2) return part;
      return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
    }).join(' ');
  }

  async findOne(id: number) {
    return await this.withdrawRepository.findOne({
      where: { id },
      relations: ['user', 'product', 'percentage'],
    });
  }

  async remove(id: number, user: User) {
    const withdraw = await this.withdrawRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!withdraw) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (user.role !== UserRole.ADMIN) {
      if (withdraw.user.id !== user.id) {
        throw new ForbiddenException('You can only delete your own requests');
      }
      if (withdraw.status !== WithdrawStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be deleted');
      }
    }

    return await this.withdrawRepository.softRemove(withdraw);
  }
}
