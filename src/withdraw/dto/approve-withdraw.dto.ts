import { IsNumber, IsOptional } from 'class-validator';

export class ApproveWithdrawDto {
  @IsNumber()
  @IsOptional()
  percentageId?: number;
}
