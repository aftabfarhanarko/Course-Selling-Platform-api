import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ManualShopPurchaseDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  shopId: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;
}
