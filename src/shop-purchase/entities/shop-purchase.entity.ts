import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Shop } from '../../shop/entities/shop.entity';

export enum ShopPurchaseStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

@Entity('shop_purchases')
export class ShopPurchase {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Shop)
  shop: Shop;

  @Column({
    type: 'enum',
    enum: ShopPurchaseStatus,
    default: ShopPurchaseStatus.PENDING,
  })
  status: ShopPurchaseStatus;

  @Column({ type: 'varchar', nullable: true })
  paymentMethod: string | null;

  @Column({ type: 'varchar', nullable: true })
  transactionId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'timestamp', nullable: true })
  purchasedAt: Date | null;

  @Column({ default: false })
  isManual: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
