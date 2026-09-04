import { BadRequestException, Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    this.assertValidPassword(data.password);
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      const isPasswordValid = await bcrypt.compare(data.password, existingUser.password);
      if (isPasswordValid) {
        return this.generateToken(existingUser);
      }
      throw new ConflictException('Email ini sudah terdaftar di ekosistem kami. Silakan masuk (Login) menggunakan kata sandi Anda.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });

    return this.generateToken(user);
  }

  async login(data: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  private generateToken(user: any) {
    const payload = { email: user.email, sub: user.id, isSuperAdmin: user.isSuperAdmin };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        isSuperAdmin: true, 
        createdAt: true,
        memberships: {
          select: {
            role: true,
            status: true,
            community: {
              select: {
                slug: true
              }
            }
          }
        }
      }
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: any) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.password) {
      this.assertValidPassword(data.password);
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true }
    });
  }

  private assertValidPassword(password: unknown) {
    if (typeof password !== 'string' || password.length < 8) {
      throw new BadRequestException('Password must contain at least 8 characters');
    }
  }
}
