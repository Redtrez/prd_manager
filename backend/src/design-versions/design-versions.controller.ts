import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DesignVersionsService } from './design-versions.service';
import { CreateDesignVersionDto } from './dto/create-design-version.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('designs/:designId/versions')
@UseGuards(JwtAuthGuard)
export class DesignVersionsController {
  constructor(private readonly designVersionsService: DesignVersionsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Param('designId') designId: string,
    @Body() createDesignVersionDto: CreateDesignVersionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.designVersionsService.create(
      designId,
      createDesignVersionDto,
      file,
    );
  }

  @Get()
  findAll(@Param('designId') designId: string) {
    return this.designVersionsService.findAll(designId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designVersionsService.remove(id);
  }
}
