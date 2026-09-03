import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  log: ['info'],
});

async function main() {
  const seedPassword = process.env.SEED_SUPERADMIN_PASSWORD;
  if (!seedPassword || seedPassword.length < 8) {
    throw new Error('SEED_SUPERADMIN_PASSWORD with at least 8 characters is required to run the seed.');
  }
  const hashedPassword = await bcrypt.hash(seedPassword, 10);

  // Create a Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@communityos.com' },
    update: {
      isSuperAdmin: true,
    },
    create: {
      email: 'admin@communityos.com',
      password: hashedPassword,
      name: 'Super Admin',
      isSuperAdmin: true,
    },
  });

  // Create a Community
  const community = await prisma.community.upsert({
    where: { slug: 'jakartarunners' },
    update: {},
    create: {
      name: 'Jakarta Runners',
      slug: 'jakartarunners',
      theme: JSON.stringify({ primaryColor: '#f97316' }),
    },
  });

  console.log({ admin, community });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
