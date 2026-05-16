import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PercentageService } from './percentage.service';
import { CreatePercentageDto } from './dto/create-percentage.dto';
import { UpdatePercentageDto } from './dto/update-percentage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('percentage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PercentageController {
  constructor(private readonly percentageService: PercentageService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createPercentageDto: CreatePercentageDto) {
    return this.percentageService.create(createPercentageDto);
  }

  @Get()
  findAll() {
    return this.percentageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.percentageService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updatePercentageDto: UpdatePercentageDto) {
    return this.percentageService.update(+id, updatePercentageDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.percentageService.remove(+id);
  }
}

