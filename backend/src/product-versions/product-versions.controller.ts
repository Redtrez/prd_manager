import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductVersionsService } from './product-versions.service';
import { CreateProductVersionDto } from './dto/create-product-version.dto';
import { UpdateProductVersionDto } from './dto/update-product-version.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products/:productId/versions')
@UseGuards(JwtAuthGuard)
export class ProductVersionsController {
  constructor(
    private readonly productVersionsService: ProductVersionsService,
  ) {}

  @Post()
  create(
    @Param('productId') productId: string,
    @Body() createProductVersionDto: CreateProductVersionDto,
  ) {
    return this.productVersionsService.create(
      productId,
      createProductVersionDto,
    );
  }

  @Get()
  findAll(@Param('productId') productId: string) {
    return this.productVersionsService.findAll(productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productVersionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductVersionDto: UpdateProductVersionDto,
  ) {
    return this.productVersionsService.update(id, updateProductVersionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productVersionsService.remove(id);
  }
}
