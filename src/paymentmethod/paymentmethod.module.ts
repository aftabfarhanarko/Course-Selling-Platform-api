import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentmethodService } from './paymentmethod.service';
import { PaymentmethodController } from './paymentmethod.controller';
import { PaymentMethod } from './entities/paymentmethod.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethod])],
  controllers: [PaymentmethodController],
  providers: [PaymentmethodService],
})
export class PaymentmethodModule {}
