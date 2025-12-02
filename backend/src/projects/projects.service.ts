import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) { }

  async create(
    createProjectDto: CreateProjectDto,
    user: User,
  ): Promise<Project> {
    const project = this.projectsRepository.create({
      ...createProjectDto,
      creatorId: user.id,
    });
    return this.projectsRepository.save(project);
  }

  async findAll(user: User): Promise<Project[]> {
    if (user.role === UserRole.ADMIN) {
      return this.projectsRepository.find({
        order: { created_at: 'DESC' },
        relations: ['productVersions', 'productVersions.designs', 'productVersions.designs.versions'],
      });
    }

    // For non-admin users, check if they have 'project:view' permission
    if (!user.permissions?.includes('project:view')) {
      return [];
    }

    // If they have permission, return only accessible projects
    // This assumes a ManyToMany relationship between Project and User,
    // where 'accessibleBy' is the inverse side on the Project entity.
    return this.projectsRepository.createQueryBuilder('project')
      .leftJoinAndSelect('project.productVersions', 'productVersions')
      .leftJoinAndSelect('productVersions.designs', 'designs')
      .leftJoinAndSelect('designs.versions', 'versions')
      .innerJoin('project.accessibleBy', 'accessibleUser', 'accessibleUser.id = :userId', { userId: user.id })
      .orderBy('project.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, updateProjectDto);
    return this.projectsRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
  }
}
