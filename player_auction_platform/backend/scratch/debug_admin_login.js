const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@admin.com';
  const pass = 'admin';
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const isMatch = bcrypt.compareSync(pass, user.password);
  console.log(`Email: ${email}`);
  console.log(`Password to test: ${pass}`);
  console.log(`Hash in DB: ${user.password}`);
  console.log(`Is Match: ${isMatch}`);
}

main().finally(() => prisma.$disconnect());
