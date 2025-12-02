import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementsRepository: Repository<Announcement>,
  ) {}

  create(createAnnouncementDto: CreateAnnouncementDto) {
    const announcement = this.announcementsRepository.create(
      createAnnouncementDto,
    );
    return this.announcementsRepository.save(announcement);
  }

  findAll() {
    return this.announcementsRepository.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async remove(id: string) {
    const result = await this.announcementsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }
  }
}
