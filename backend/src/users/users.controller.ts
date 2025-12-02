import { Controller, Get, Patch, Param, Body, UseGuards, Post, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(id, updateUserRoleDto.role);
  }

  @Patch(':id/permissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updatePermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[],
  ) {
    return this.usersService.updatePermissions(id, permissions);
  }

  @Patch(':id/projects')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateAccessibleProjects(
    @Param('id') id: string,
    @Body('projectIds') projectIds: string[],
  ) {
    return this.usersService.updateAccessibleProjects(id, projectIds);
  }

  @Patch(':id/password')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updatePassword(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    return this.usersService.updatePassword(id, password);
  }

  @Patch(':id/toggle-enabled')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  toggleEnabled(@Param('id') id: string) {
    return this.usersService.toggleEnabled(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
