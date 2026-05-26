import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  discountPrice?: number;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsString()
  @IsOptional()
  courseUrl?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  instructorId?: number;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsOptional()
  metadata?: any;
}
