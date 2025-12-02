import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVersion } from './entities/product-version.entity';
import { CreateProductVersionDto } from './dto/create-product-version.dto';
import { UpdateProductVersionDto } from './dto/update-product-version.dto';

@Injectable()
export class ProductVersionsService {
  constructor(
    @InjectRepository(ProductVersion)
    private productVersionsRepository: Repository<ProductVersion>,
  ) {}

  async create(
    productId: string,
    createProductVersionDto: CreateProductVersionDto,
  ): Promise<ProductVersion> {
    const productVersion = this.productVersionsRepository.create({
      ...createProductVersionDto,
      productId,
    });
    return this.productVersionsRepository.save(productVersion);
  }

  async findAll(productId: string): Promise<ProductVersion[]> {
    return this.productVersionsRepository.find({
      where: { productId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProductVersion> {
    const productVersion = await this.productVersionsRepository.findOne({
      where: { id },
    });
    if (!productVersion) {
      throw new NotFoundException('Product version not found');
    }
    return productVersion;
  }

  async update(
    id: string,
    updateProductVersionDto: UpdateProductVersionDto,
  ): Promise<ProductVersion> {
    const productVersion = await this.findOne(id);
    Object.assign(productVersion, updateProductVersionDto);
    return this.productVersionsRepository.save(productVersion);
  }

  async remove(id: string): Promise<void> {
    const productVersion = await this.findOne(id);
    await this.productVersionsRepository.remove(productVersion);
  }
}
