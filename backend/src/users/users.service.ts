import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.find({
      order: { created_at: 'DESC' },
    });
    return users.map((u) => {
      const userWithoutPassword: any = { ...u };
      delete userWithoutPassword.password;
      return userWithoutPassword;
    });
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    const updatedUser = await this.usersRepository.save(user);
    const result: any = { ...updatedUser };
    delete result.password;
    return result as User;
  }

  async count(): Promise<number> {
    return this.usersRepository.count();
  }

  async createAdmin(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: UserRole.ADMIN, // Set as admin
    });

    return this.usersRepository.save(user);
  }

  async updatePermissions(id: string, permissions: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.permissions = permissions;
    const updatedUser = await this.usersRepository.save(user);
    const result: any = { ...updatedUser };
    delete result.password;
    return result as User;
  }

  async updateAccessibleProjects(id: string, projectIds: string[]): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // We need to load the projects first, but for now let's assume we just need IDs if we use relation builder or just load them.
    // Better to load projects to ensure they exist.
    // Since we don't have ProjectsRepository injected here, we might need to use a different approach or inject it.
    // However, circular dependency might occur if we inject ProjectsService.
    // Let's use QueryBuilder or just assign objects with IDs if TypeORM supports it (it usually does).
    user.accessibleProjects = projectIds.map(pid => ({ id: pid } as any));
    const updatedUser = await this.usersRepository.save(user);
    const result: any = { ...updatedUser };
    delete result.password;
    return result as User;
  }

  async updatePassword(id: string, password: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    const updatedUser = await this.usersRepository.save(user);
    const result: any = { ...updatedUser };
    delete result.password;
    return result as User;
  }

  async toggleEnabled(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.enabled = !user.enabled;
    const updatedUser = await this.usersRepository.save(user);
    const result: any = { ...updatedUser };
    delete result.password;
    return result as User;
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.remove(user);
  }
}
