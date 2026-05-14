import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentmethodDto } from './create-paymentmethod.dto';

export class UpdatePaymentmethodDto extends PartialType(CreatePaymentmethodDto) {}
