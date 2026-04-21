const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  console.log('--- User Password Audit ---');
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, password: true }
    });

    let plainTextCount = 0;
    users.forEach(user => {
      // Bcrypt hashes are 60 chars and start with $2a$ or $2b$
      const isHashed = user.password.length === 60 && user.password.startsWith('$2');
      if (!isHashed) {
        console.warn(`[WARNING] Plain-text or invalid hash found for: ${user.email} (ID: ${user.id})`);
        console.warn(`          Password starts with: ${user.password.substring(0, 3)}...`);
        plainTextCount++;
      }
    });

    if (plainTextCount === 0) {
      console.log('[SUCCESS] All user passwords appear to be correctly hashed.');
    } else {
      console.log(`[TOTAL] Found ${plainTextCount} suspicious entries.`);
    }
  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

audit();
