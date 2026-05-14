import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findAll(user: User) {
    if (user.role === UserRole.ADMIN) {
      return await this.paymentMethodRepository.find({
        relations: ['user'],
      });
    }
    return await this.paymentMethodRepository.find({
      where: { user: { id: user.id } },
    });
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
