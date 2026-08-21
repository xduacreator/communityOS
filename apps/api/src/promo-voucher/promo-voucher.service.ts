import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  communityId: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  discountType?: string; // 'FIXED' | 'PERCENTAGE'

  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsNumber()
  minPurchase?: number;

  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateVoucherDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  discountType?: string;

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  minPurchase?: number;

  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

@Injectable()
export class PromoVoucherService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVoucherDto) {
    const formattedCode = dto.code.trim().toUpperCase();
    
    // Check if code already exists in this community
    const existing = await this.prisma.promoVoucher.findUnique({
      where: {
        communityId_code: {
          communityId: dto.communityId,
          code: formattedCode,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Kode voucher "${formattedCode}" sudah digunakan di komunitas ini.`);
    }

    return this.prisma.promoVoucher.create({
      data: {
        communityId: dto.communityId,
        code: formattedCode,
        description: dto.description,
        discountType: dto.discountType || 'FIXED',
        discountValue: Number(dto.discountValue),
        minPurchase: dto.minPurchase ? Number(dto.minPurchase) : null,
        maxDiscount: dto.maxDiscount ? Number(dto.maxDiscount) : null,
        maxUses: dto.maxUses ? Number(dto.maxUses) : null,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        status: dto.status || 'ACTIVE',
      },
    });
  }

  async findByCommunity(communityId: string) {
    return this.prisma.promoVoucher.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const voucher = await this.prisma.promoVoucher.findUnique({ where: { id } });
    if (!voucher) throw new NotFoundException('Voucher tidak ditemukan');
    return voucher;
  }

  async update(id: string, dto: UpdateVoucherDto) {
    await this.findOne(id);
    return this.prisma.promoVoucher.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.discountType !== undefined && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: Number(dto.discountValue) }),
        ...(dto.minPurchase !== undefined && { minPurchase: dto.minPurchase ? Number(dto.minPurchase) : null }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount ? Number(dto.maxDiscount) : null }),
        ...(dto.maxUses !== undefined && { maxUses: dto.maxUses ? Number(dto.maxUses) : null }),
        ...(dto.validUntil !== undefined && { validUntil: dto.validUntil ? new Date(dto.validUntil) : null }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.promoVoucher.delete({ where: { id } });
  }

  async validateVoucher(communityId: string, code: string, purchaseAmount: number) {
    const formattedCode = code.trim().toUpperCase();

    const voucher = await this.prisma.promoVoucher.findUnique({
      where: {
        communityId_code: {
          communityId,
          code: formattedCode,
        },
      },
    });

    if (!voucher) {
      throw new BadRequestException(`Kode voucher "${formattedCode}" tidak ditemukan.`);
    }

    if (voucher.status !== 'ACTIVE') {
      throw new BadRequestException('Voucher ini sudah tidak aktif.');
    }

    if (voucher.validUntil && new Date(voucher.validUntil) < new Date()) {
      throw new BadRequestException('Voucher ini sudah kedaluwarsa.');
    }

    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
      throw new BadRequestException('Kuota penggunaan voucher ini sudah habis.');
    }

    if (voucher.minPurchase !== null && purchaseAmount < voucher.minPurchase) {
      throw new BadRequestException(`Minimal pembelian untuk menggunakan voucher ini adalah Rp ${voucher.minPurchase.toLocaleString('id-ID')}.`);
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (voucher.discountType === 'PERCENTAGE') {
      discountAmount = (purchaseAmount * voucher.discountValue) / 100;
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      if (voucher.discountValue > purchaseAmount) {
        throw new BadRequestException(`Nilai voucher (Rp ${voucher.discountValue.toLocaleString('id-ID')}) lebih besar dari total pembelian (Rp ${purchaseAmount.toLocaleString('id-ID')}). Voucher tidak dapat digunakan.`);
      }
      discountAmount = voucher.discountValue;
    }

    const finalPrice = Math.max(0, purchaseAmount - discountAmount);

    return {
      valid: true,
      voucherId: voucher.id,
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountAmount,
      originalPrice: purchaseAmount,
      finalPrice,
      message: `Voucher "${voucher.code}" berhasil dipasang! Hemat Rp ${discountAmount.toLocaleString('id-ID')}`,
    };
  }

  async incrementUsage(id: string) {
    return this.prisma.promoVoucher.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    });
  }
}
