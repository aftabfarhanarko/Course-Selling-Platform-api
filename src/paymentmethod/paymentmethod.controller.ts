import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentmethodService } from './paymentmethod.service';
import { CreatePaymentmethodDto } from './dto/create-paymentmethod.dto';
import { UpdatePaymentmethodDto } from './dto/update-paymentmethod.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentmethodController {
  constructor(private readonly paymentmethodService: PaymentmethodService) {}

  @Post()
  create(@Body() createPaymentmethodDto: CreatePaymentmethodDto, @Request() req: any) {
    return this.paymentmethodService.create(createPaymentmethodDto, req.user);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.paymentmethodService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.paymentmethodService.findOne(+id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePaymentmethodDto: UpdatePaymentmethodDto,
    @Request() req: any,
  ) {
    return this.paymentmethodService.update(+id, updatePaymentmethodDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.paymentmethodService.remove(+id, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.paymentmethodService.approve(+id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.paymentmethodService.reject(+id, reason);
  }
}
