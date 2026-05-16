import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '../entities/product.entity';

export class ApproveProductDto {
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @IsOptional()
  @IsString()
  rejectReason?: string;
}
