"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true, role: true, isActive: true }
    });
    console.log('--- ADMIN USERS ---');
    console.log(JSON.stringify(admins, null, 2));
}
main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=debug-users.js.map