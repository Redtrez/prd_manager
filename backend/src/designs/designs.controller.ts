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
import { DesignsService } from './designs.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('product-versions/:versionId/designs')
@UseGuards(JwtAuthGuard)
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  @Post()
  create(
    @Param('versionId') versionId: string,
    @Body() createDesignDto: CreateDesignDto,
  ) {
    return this.designsService.create(versionId, createDesignDto);
  }

  @Get()
  findAll(@Param('versionId') versionId: string) {
    return this.designsService.findAll(versionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDesignDto: UpdateDesignDto) {
    return this.designsService.update(id, updateDesignDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designsService.remove(id);
  }
}
