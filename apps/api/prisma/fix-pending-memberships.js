const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const wallets = await prisma.sessionWallet.findMany({
    where: {
      walletStatus: 'ACTIVE',
      userMembershipId: { not: null }
    }
  });
  
  let fixedCount = 0;
  for (const w of wallets) {
    const um = await prisma.userMembership.findUnique({
      where: { id: w.userMembershipId }
    });
    
    if (um && um.status === 'PENDING') {
      console.log(`Fixing UserMembership ${um.id} for User ${um.userId}`);
      
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 30); // Defaulting to 30 days if we don't fetch the package duration
      
      await prisma.userMembership.update({
        where: { id: um.id },
        data: { status: 'ACTIVE', startDate: start, endDate: end }
      });
      
      // Fix CommunityMember status too
      const member = await prisma.communityMember.findUnique({
        where: { userId_communityId: { userId: um.userId, communityId: um.communityId } }
      });
      if (member && member.status !== 'APPROVED') {
        await prisma.communityMember.update({
          where: { id: member.id },
          data: { status: 'APPROVED' }
        });
      }
      
      fixedCount++;
    }
  }
  console.log(`Fixed ${fixedCount} pending memberships.`);
}
fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
