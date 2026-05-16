import { IsNumber, IsOptional } from 'class-validator';

export class DirectWithdrawDto {
  @IsNumber()
  studentId: number;

  @IsNumber()
  productId: number;

  @IsNumber()
  @IsOptional()
  percentageId?: number;
}
