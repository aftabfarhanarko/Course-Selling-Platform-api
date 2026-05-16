import { IsEnum, IsNumber, Min, Max } from 'class-validator';
import { PercentageType } from '../entities/percentage.entity';

export class CreatePercentageDto {
  @IsEnum(PercentageType)
  type: PercentageType;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}

