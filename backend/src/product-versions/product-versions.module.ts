import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVersionsService } from './product-versions.service';
import { ProductVersionsController } from './product-versions.controller';
import { ProductVersion } from './entities/product-version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductVersion])],
  controllers: [ProductVersionsController],
  providers: [ProductVersionsService],
  exports: [ProductVersionsService],
})
export class ProductVersionsModule {}
