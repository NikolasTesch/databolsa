import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

if (process.env.NODE_ENV !== 'development') {
  console.error('Seed only runs in development environment');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'dev@databolsa.com' },
    update: {},
    create: {
      email: 'dev@databolsa.com',
      password_hash: passwordHash,
    },
  });

  console.log('Seed completed:', { userId: user.id, email: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
