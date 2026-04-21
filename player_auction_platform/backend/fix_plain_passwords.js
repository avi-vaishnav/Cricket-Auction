const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function migrate() {
  console.log('--- Database Encryption Migration Starting ---');
  try {
    const users = await prisma.user.findMany();
    let fixedCount = 0;

    for (const user of users) {
      // Bcrypt hashes are 60 chars and start with $2a$ or $2b$
      const isHashed = user.password.length === 60 && user.password.startsWith('$2');
      
      if (!isHashed) {
        console.log(`Migrating user: ${user.email}...`);
        const newHash = bcrypt.hashSync(user.password, 10);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHash }
        });
        
        console.log(`DONE: ${user.email} is now encrypted.`);
        fixedCount++;
      }
    }

    console.log('-------------------------------------------');
    console.log(`Migration COMPLETED. Total users encrypted: ${fixedCount}`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
