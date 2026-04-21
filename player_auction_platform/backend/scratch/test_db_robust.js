const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('--- DB_SUCCESS ---');
    
    // Check if we can run a simple query
    const userCount = await prisma.user.count();
    console.log(`Users in DB: ${userCount}`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('--- DB_FAILURE ---');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
