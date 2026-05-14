import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PaymentMethodType {
  BKASH = 'bkash',
  NAGAD = 'nagad',
  VISA = 'visa',
  BANK = 'bank',
  BINANCE = 'binance',
}

export enum PaymentMethodStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
  })
  type: PaymentMethodType;

  @Column({
    type: 'enum',
    enum: PaymentMethodStatus,
    default: PaymentMethodStatus.PENDING,
  })
  status: PaymentMethodStatus;

  @Column({ type: 'text', nullable: true })
  rejectReason: string | null;

  @Column({ type: 'varchar', nullable: true })
  accountNumber: string | null; // Used for bKash, Nagad, Card Number, Bank Account Number

  @Column({ type: 'varchar', nullable: true })
  accountHolderName: string | null; // Used for Bank, Card

  @Column({ type: 'varchar', nullable: true })
  bankName: string | null;

  @Column({ type: 'varchar', nullable: true })
  branchName: string | null;

  @Column({ type: 'varchar', nullable: true })
  binanceId: string | null;

  @Column({ default: false })
  isDefault: boolean;

  @ManyToOne(() => User, (user) => user.paymentMethods)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
