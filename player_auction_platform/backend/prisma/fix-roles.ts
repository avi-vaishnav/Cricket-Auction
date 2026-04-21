import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating user roles to prepare for schema change...');
  
  // Update all VIEWER and AUCTIONEER to USER
  // We use executeRaw because the client types might already be updated or could conflict
  await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET role = 'USER'
    WHERE role IN ('VIEWER', 'AUCTIONEER')
  `);
  
  console.log('Roles updated successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
