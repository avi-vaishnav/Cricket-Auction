"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- Starting Database Cleanup ---');
    await prisma.transaction.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.auctionState.deleteMany();
    await prisma.player.deleteMany();
    await prisma.team.deleteMany();
    await prisma.auctionUser.deleteMany();
    await prisma.auction.deleteMany();
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
//# sourceMappingURL=reset-data.js.map