import { IsNumber } from 'class-validator';

export class CreateWithdrawDto {
  @IsNumber()
  productId: number;
}
