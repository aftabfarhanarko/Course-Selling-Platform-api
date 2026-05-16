import { PartialType } from '@nestjs/mapped-types';
import { CreatePercentageDto } from './create-percentage.dto';

export class UpdatePercentageDto extends PartialType(CreatePercentageDto) {}
