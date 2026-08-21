import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CustomPageService } from './custom-page.service';
import { CreateCustomPageDto } from './dto/create-custom-page.dto';
import { UpdateCustomPageDto } from './dto/update-custom-page.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Custom Pages')
@Controller('custom-page')
export class CustomPageController {
  constructor(private readonly customPageService: CustomPageService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new custom page' })
  create(@Body() createCustomPageDto: CreateCustomPageDto) {
    return this.customPageService.create(createCustomPageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all custom pages' })
  findAll() {
    return this.customPageService.findAll();
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a custom page by ID or slug' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.customPageService.findOne(idOrSlug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a custom page' })
  update(@Param('id') id: string, @Body() updateCustomPageDto: UpdateCustomPageDto) {
    return this.customPageService.update(id, updateCustomPageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a custom page' })
  remove(@Param('id') id: string) {
    return this.customPageService.remove(id);
  }
}
