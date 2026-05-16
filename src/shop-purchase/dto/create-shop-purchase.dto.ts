import { IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateShopPurchaseDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  shopId: number;

  @IsNumber()
  @IsOptional()
  amount?: number;
}
