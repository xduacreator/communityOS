import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BlogPostService } from './blog-post.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { RequireSuperAdmin } from '../auth/decorators/roles.decorator';

@Controller('blog-post')
export class BlogPostController {
  constructor(private readonly blogPostService: BlogPostService) {}

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Post()
  create(@Body() createBlogPostDto: CreateBlogPostDto) {
    return this.blogPostService.create(createBlogPostDto);
  }

  // Public endpoint
  @Get()
  findAll() {
    return this.blogPostService.findAll();
  }

  // Public endpoint
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.blogPostService.findOne(idOrSlug);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBlogPostDto: UpdateBlogPostDto) {
    return this.blogPostService.update(id, updateBlogPostDto);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @RequireSuperAdmin()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogPostService.remove(id);
  }
}
