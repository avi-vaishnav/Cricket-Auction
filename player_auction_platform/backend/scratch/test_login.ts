import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin() {
  const email = 'admin@admin.com';
  const pass = 'admin';
  
  console.log(`Testing login for: ${email}`);
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.warn('User not found in DB');
    return;
  }
  
  console.log('User found in DB');
  console.log('Stored Hash:', user.password);
  
  try {
    const isMatch = bcrypt.compareSync(pass, user.password);
    console.log('Result of bcrypt.compareSync:', isMatch);
    
    // Also try checking if the hash itself is valid
    const isValidHash = user.password.length === 60 && user.password.startsWith('$2');
    console.log('Is valid bcrypt hash format:', isValidHash);
    
  } catch (err) {
    console.error('Bcrypt error:', err);
  }
}

testLogin()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
