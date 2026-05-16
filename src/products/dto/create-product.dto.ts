import { IsString, IsArray, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  botName: string;

  @IsArray()
  @IsString({ each: true })
  countryCodes: string[];

  @IsNumber()
  totalAmount: number;
}

