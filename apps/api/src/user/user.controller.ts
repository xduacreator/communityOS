import { Controller, Get, Patch, Param, Body, UseGuards, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { RequireSuperAdmin } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Patch(':id/role')
  setRole(@Param('id') id: string, @Body('isSuperAdmin') isSuperAdmin: boolean) {
    return this.userService.setRole(id, isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Post()
  create(@Body() data: any) {
    return this.userService.create(data);
  }
}
