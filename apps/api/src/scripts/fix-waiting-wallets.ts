import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
  const waitingWallets = await prisma.sessionWallet.findMany({
    where: { walletStatus: 'WAITING' },
    include: { package: true }
  });

  console.log(`Found ${waitingWallets.length} WAITING wallets.`);

  for (const wallet of waitingWallets) {
    const activeWalletForPackage = await prisma.sessionWallet.findFirst({
      where: {
        userId: wallet.userId,
        communityId: wallet.communityId,
        packageId: wallet.packageId,
        walletStatus: 'ACTIVE'
      }
    });

    if (!activeWalletForPackage) {
      console.log(`Activating wallet ${wallet.id} for package ${wallet.package?.name} (no active wallet for this package)`);
      const startDate = new Date();
      const expiredDate = new Date();
      if (wallet.package?.validDays) {
        expiredDate.setDate(expiredDate.getDate() + wallet.package.validDays);
      }

      await prisma.sessionWallet.update({
        where: { id: wallet.id },
        data: {
          walletStatus: 'ACTIVE',
          startDate,
          expiredDate
        }
      });
    } else {
      console.log(`Wallet ${wallet.id} stays WAITING, already has active for package ${wallet.package?.name}`);
    }
  }

  console.log('Done!');
}

fix().catch(console.error).finally(() => prisma.$disconnect());
