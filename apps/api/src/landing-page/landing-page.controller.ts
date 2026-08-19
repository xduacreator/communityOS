import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LandingPageService } from './landing-page.service';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('landing-page')
export class LandingPageController {
  constructor(private readonly landingPageService: LandingPageService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createLandingPageDto: CreateLandingPageDto) {
    return this.landingPageService.create(createLandingPageDto);
  }

  // Public endpoint
  @Get()
  findAll() {
    return this.landingPageService.findAll();
  }

  // Public endpoint
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.landingPageService.findOne(idOrSlug);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLandingPageDto: UpdateLandingPageDto) {
    return this.landingPageService.update(id, updateLandingPageDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.landingPageService.remove(id);
  }
}
