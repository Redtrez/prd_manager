import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Design } from './entities/design.entity';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';

@Injectable()
export class DesignsService {
  constructor(
    @InjectRepository(Design)
    private designsRepository: Repository<Design>,
  ) {}

  async create(
    productVersionId: string,
    createDesignDto: CreateDesignDto,
  ): Promise<Design> {
    const design = this.designsRepository.create({
      ...createDesignDto,
      productVersionId,
    });
    return this.designsRepository.save(design);
  }

  async findAll(productVersionId: string): Promise<Design[]> {
    return this.designsRepository.find({
      where: { productVersionId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Design> {
    const design = await this.designsRepository.findOne({ where: { id } });
    if (!design) {
      throw new NotFoundException('Design not found');
    }
    return design;
  }

  async update(id: string, updateDesignDto: UpdateDesignDto): Promise<Design> {
    const design = await this.findOne(id);
    Object.assign(design, updateDesignDto);
    return this.designsRepository.save(design);
  }

  async remove(id: string): Promise<void> {
    const design = await this.findOne(id);
    await this.designsRepository.remove(design);
  }
}
