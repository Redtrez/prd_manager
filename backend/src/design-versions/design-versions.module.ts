import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DesignVersionsService } from './design-versions.service';
import { DesignVersionsController } from './design-versions.controller';
import { DesignVersion } from './entities/design-version.entity';
import { DesignsModule } from '../designs/designs.module';
import { ProductVersionsModule } from '../product-versions/product-versions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DesignVersion]),
    ConfigModule,
    DesignsModule,
    ProductVersionsModule,
  ],
  controllers: [DesignVersionsController],
  providers: [DesignVersionsService],
})
export class DesignVersionsModule {}
