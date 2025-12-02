import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { ProductVersionsModule } from './product-versions/product-versions.module';
import { DesignsModule } from './designs/designs.module';
import { DesignVersionsModule } from './design-versions/design-versions.module';
import { AnnouncementsModule } from './announcements/announcements.module';

import { Project } from './projects/entities/project.entity';
import { ProductVersion } from './product-versions/entities/product-version.entity';
import { Design } from './designs/entities/design.entity';
import { DesignVersion } from './design-versions/entities/design-version.entity';
import { Announcement } from './announcements/entities/announcement.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const dbType = configService.get<string>('DATABASE_TYPE') || 'postgres';
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get<string>('DATABASE_HOST') || 'localhost',
            port: parseInt(
              configService.get<string>('DATABASE_PORT') || '5432',
              10,
            ),
            username: configService.get<string>('DATABASE_USER') || 'admin',
            password:
              configService.get<string>('DATABASE_PASSWORD') || 'password',
            database:
              configService.get<string>('DATABASE_NAME') || 'prd_management',
            entities: [
              User,
              Project,
              ProductVersion,
              Design,
              DesignVersion,
              Announcement,
            ],
            synchronize: true,
          };
        }
        return {
          type: 'sqljs',
          autoSave: true,
          location: 'prd_management.sql',
          entities: [
            User,
            Project,
            ProductVersion,
            Design,
            DesignVersion,
            Announcement,
          ],
          synchronize: true,
        } as any;
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ProjectsModule,
    ProductVersionsModule,
    DesignsModule,
    DesignVersionsModule,
    AnnouncementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
