import { PartialType } from '@nestjs/mapped-types';
import { CreateProductVersionDto } from './create-product-version.dto';

export class UpdateProductVersionDto extends PartialType(
  CreateProductVersionDto,
) {}
