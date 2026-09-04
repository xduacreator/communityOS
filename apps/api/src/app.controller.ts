import { Controller, Get, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './public/uploads',
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${ALLOWED_IMAGE_TYPES[file.mimetype]}`);
      }
    }),
    fileFilter: (_req, file, cb) => {
      cb(null, Boolean(ALLOWED_IMAGE_TYPES[file.mimetype]));
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
      fields: 0,
    },
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return {
      url: `/api/uploads/${file.filename}`
    };
  }
}
