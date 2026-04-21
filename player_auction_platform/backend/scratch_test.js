const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function test() {
  const email = 'admin@admin.com';
  const pass = 'admin';
  const hash = bcrypt.hashSync(pass, 10);
  console.log('Testing hashing for admin@admin.com...');
  console.log('Original Password:', pass);
  console.log('Generated Hash:', hash);

  try {
    await prisma.user.update({
      where: { email },
      data: { password: hash }
    });
    console.log('Password updated in DB.');

    const user = await prisma.user.findUnique({ where: { email } });
    console.log('User found in DB. Comparing...');

    const isMatch = bcrypt.compareSync(pass, user.password);
    console.log('Comparison result:', isMatch);
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
