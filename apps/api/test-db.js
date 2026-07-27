const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.community.findFirst();
  console.log(c.shortDescription);
  console.log(c.whatsappNumber);
  console.log(c.joinCtaLabel);
}
main().catch(console.error).finally(() => prisma.$disconnect());
