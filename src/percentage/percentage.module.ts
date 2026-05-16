import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PercentageService } from './percentage.service';
import { PercentageController } from './percentage.controller';
import { Percentage } from './entities/percentage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Percentage])],
  controllers: [PercentageController],
  providers: [PercentageService],
})
export class PercentageModule {}

