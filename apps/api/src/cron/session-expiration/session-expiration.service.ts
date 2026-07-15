import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionExpirationService {
  private readonly logger = new Logger(SessionExpirationService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSessionExpiration() {
    this.logger.log('Running daily session expiration check...');
    const now = new Date();

    const expiredWallets = await this.prisma.sessionWallet.findMany({
      where: {
        walletStatus: 'ACTIVE',
        expiredDate: { lt: now },
        remainingSession: { gt: 0 }
      }
    });

    if (expiredWallets.length === 0) {
      this.logger.log('No expired wallets found.');
      return;
    }

    for (const wallet of expiredWallets) {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updated = await tx.sessionWallet.update({
          where: { id: wallet.id },
          data: {
            walletStatus: 'EXPIRED',
            remainingSession: 0
          }
        });

        await tx.sessionTransaction.create({
          data: {
            walletId: wallet.id,
            transactionType: 'EXPIRED',
            beforeSession: wallet.remainingSession,
            changeSession: -wallet.remainingSession,
            afterSession: 0,
            remarks: 'Expired by daily cron job'
          }
        });

        // Activate next waiting wallet if any
        const nextWallet = await tx.sessionWallet.findFirst({
          where: { userId: wallet.userId, communityId: wallet.communityId, walletStatus: 'WAITING' },
          orderBy: { createdAt: 'asc' }
        });

        if (nextWallet) {
          const pkg = await tx.sessionPackage.findUnique({ where: { id: nextWallet.packageId } });
          const startDate = new Date();
          const expiredDate = new Date();
          if (pkg) expiredDate.setDate(expiredDate.getDate() + pkg.validDays);
          
          await tx.sessionWallet.update({
            where: { id: nextWallet.id },
            data: { walletStatus: 'ACTIVE', startDate, expiredDate }
          });
        }

        this.logger.log(`Wallet ${wallet.id} expired. Remaining ${wallet.remainingSession} sessions lost.`);
      });
    }
  }
}
