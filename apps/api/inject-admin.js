const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@communityos.com';
  const password = 'xdua6968';
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      isSuperAdmin: true,
    },
    create: {
      email,
      password: hashedPassword,
      name: 'Super Admin',
      isSuperAdmin: true,
    },
  });

  console.log('✅ SUKSES! Superadmin berhasil disuntikkan: ', admin.email);
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
