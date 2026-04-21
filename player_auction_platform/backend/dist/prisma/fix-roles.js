"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Updating user roles to prepare for schema change...');
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
//# sourceMappingURL=fix-roles.js.map