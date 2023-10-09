import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();


async function main() {
  console.log(`Start seeding ...`);
  await prisma.account.create({
    data: {
      user_name: 'admin',
      adminProfile: {
        create: {
          name: 'admin',
        }
      },
      password: '10a6e95e2ad365abfb42ab552f3c1b5f'
    }
  })
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
