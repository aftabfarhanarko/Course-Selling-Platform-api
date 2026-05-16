import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductStatus } from './entities/product.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ApproveProductDto } from './dto/approve-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto, user: User) {
    const product = this.productRepository.create({
      ...createProductDto,
      user,
    });
    const savedProduct = await this.productRepository.save(product);
    return await this.productRepository.findOne({
      where: { id: savedProduct.id },
      relations: ['user'],
    });
  }


  async findAll(
    user: User,
    options: {
      search?: string;
      status?: ProductStatus;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { search, status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.user', 'user')
      .leftJoinAndSelect('user.paymentMethods', 'paymentMethods')
      .orderBy('product.createdAt', 'DESC');

    if (user.role !== UserRole.ADMIN) {
      query.where('product.userId = :userId', { userId: user.id });
    }

    if (search) {
      query.andWhere('product.botName ILIKE :search', { search: `%${search}%` });
    }

    if (status) {
      query.andWhere('product.status = :status', { status });
    }

    const [items, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOnlyMy(
    user: User,
    options: {
      search?: string;
      status?: ProductStatus;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { search, status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.user', 'user')
      .where('product.userId = :userId', { userId: user.id })
      .orderBy('product.createdAt', 'DESC');

    if (search) {
      query.andWhere('product.botName ILIKE :search', { search: `%${search}%` });
    }

    if (status) {
      query.andWhere('product.status = :status', { status });
    }

    const [items, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  async findOne(id: number, user: User) {


    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (user.role !== UserRole.ADMIN && product.user.id !== user.id) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async approve(id: number, approveProductDto: ApproveProductDto, admin: User) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    product.status = approveProductDto.status;
    if (approveProductDto.status === ProductStatus.APPROVED) {
      product.approvedByName = admin.name;
      product.approvalDate = new Date();
      product.rejectReason = null;
    } else if (approveProductDto.status === ProductStatus.REJECTED) {
      product.rejectReason = approveProductDto.rejectReason || null;
      product.approvedByName = admin.name;
      product.approvalDate = new Date();
    }

    await this.productRepository.save(product);
    return await this.productRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }


  async update(id: number, updateProductDto: UpdateProductDto, user: User) {
    const product = await this.findOne(id, user);
    Object.assign(product, updateProductDto);
    await this.productRepository.save(product);
    return await this.productRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }


  async remove(id: number, user: User) {
    const product = await this.findOne(id, user);
    return await this.productRepository.softRemove(product);
  }

}
