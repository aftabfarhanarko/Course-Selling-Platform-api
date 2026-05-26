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
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApproveProductDto } from './dto/approve-product.dto';
import { ProductStatus } from './entities/product.entity';


@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
    return this.productsService.create(createProductDto, req.user);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('status') status?: ProductStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findAll(req.user, {
      search,
      status,
      page,
      limit,
    });
  }

  @Get('my')
  findMyProducts(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('status') status?: ProductStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findOnlyMy(req.user, {
      search,
      status,
      page,
      limit,
    });
  }




  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.productsService.findOne(+id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: any,
  ) {
    return this.productsService.update(+id, updateProductDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.productsService.remove(+id, req.user);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN)
  approve(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.productsService.approve(
      +id,
      { status: ProductStatus.APPROVED },
      req.user,
    );
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN)
  reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    return this.productsService.approve(
      +id,
      { status: ProductStatus.REJECTED, rejectReason: body.reason },
      req.user,
    );
  }
}




