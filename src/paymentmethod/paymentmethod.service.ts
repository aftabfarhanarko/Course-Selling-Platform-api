import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { CreatePaymentmethodDto } from './dto/create-paymentmethod.dto';
import { UpdatePaymentmethodDto } from './dto/update-paymentmethod.dto';
import { PaymentMethod, PaymentMethodStatus } from './entities/paymentmethod.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class PaymentmethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(createPaymentmethodDto: CreatePaymentmethodDto, user: User) {
    // If this is the first payment method or set as default, handle isDefault
    if (createPaymentmethodDto.isDefault) {
      await this.paymentMethodRepository.update(
        { user: { id: user.id } },
        { isDefault: false },
      );
    }

    const paymentMethod = this.paymentMethodRepository.create({
      ...createPaymentmethodDto,
      user,
      status: PaymentMethodStatus.PENDING, // Ensure it's pending
    });

    return await this.paymentMethodRepository.save(paymentMethod);
  }

  async findAll(
    user: User,
    options: {
      search?: string;
      type?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { search, type, status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const query = this.paymentMethodRepository.createQueryBuilder('pm');

    // Add relations
    if (user.role === UserRole.ADMIN) {
      query.leftJoinAndSelect('pm.user', 'user');
    } else {
      query.where('pm.user.id = :userId', { userId: user.id });
    }

    // Search filter
    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('pm.accountNumber ILIKE :search', { search: `%${search}%` })
            .orWhere('pm.accountHolderName ILIKE :search', { search: `%${search}%` })
            .orWhere('pm.bankName ILIKE :search', { search: `%${search}%` });
          
          if (user.role === UserRole.ADMIN) {
            qb.orWhere('user.name ILIKE :search', { search: `%${search}%` })
              .orWhere('user.email ILIKE :search', { search: `%${search}%` });
          }
        }),
      );
    }

    // Type filter
    if (type) {
      query.andWhere('pm.type = :type', { type });
    }

    // Status filter
    if (status) {
      query.andWhere('pm.status = :status', { status });
    }

    const [items, total] = await query
      .orderBy('pm.id', 'DESC')
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

  async findOne(id: number, user: User) {
    const where: any = { id };
    if (user.role !== UserRole.ADMIN) {
      where.user = { id: user.id };
    }

    const paymentMethod = await this.paymentMethodRepository.findOne({
      where,
      relations: user.role === UserRole.ADMIN ? ['user'] : [],
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method #${id} not found`);
    }

    return paymentMethod;
  }

  async update(id: number, updatePaymentmethodDto: UpdatePaymentmethodDto, user: User) {
    const paymentMethod = await this.findOne(id, user);

    if (updatePaymentmethodDto.isDefault && !paymentMethod.isDefault) {
      await this.paymentMethodRepository.update(
        { user: { id: user.id } },
        { isDefault: false },
      );
    }

    // Reset status to pending if account info changed? 
    // Maybe only if specifically requested. For now, let's just update.
    
    Object.assign(paymentMethod, updatePaymentmethodDto);
    return await this.paymentMethodRepository.save(paymentMethod);
  }

  async remove(id: number, user: User) {
    const paymentMethod = await this.findOne(id, user);
    return await this.paymentMethodRepository.softRemove(paymentMethod);
  }

  async approve(id: number) {
    const paymentMethod = await this.paymentMethodRepository.findOne({ where: { id } });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method #${id} not found`);
    }

    paymentMethod.status = PaymentMethodStatus.APPROVED;
    paymentMethod.rejectReason = null;
    return await this.paymentMethodRepository.save(paymentMethod);
  }

  async reject(id: number, reason: string) {
    if (!reason) {
      throw new BadRequestException('Reject reason is required');
    }

    const paymentMethod = await this.paymentMethodRepository.findOne({ where: { id } });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method #${id} not found`);
    }

    paymentMethod.status = PaymentMethodStatus.REJECTED;
    paymentMethod.rejectReason = reason;
    return await this.paymentMethodRepository.save(paymentMethod);
  }
}
