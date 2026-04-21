import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Cleanup ---');

  // Deleting in reverse order of dependencies
  await prisma.transaction.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.auctionState.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.auctionUser.deleteMany();
  await prisma.auction.deleteMany();
  
  // Keep only Admin users
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: {
        not: 'ADMIN'
      }
    }
  });

  console.log(`Cleaned up ${deletedUsers.count} non-admin users.`);
  console.log('Kept Admin credentials.');
  console.log('--- Database Cleanup Complete ---');
}

main()
  .catch((e) => {
    console.error('Cleanup error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
