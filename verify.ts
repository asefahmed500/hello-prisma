import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient(
  process.env.DATABASE_URL
    ? { accelerateUrl: process.env.DATABASE_URL }
    : { accelerateUrl: '' }
);

async function verify() {
  console.log('=== PRISMA VERIFICATION ===\n');

  // Test connection
  console.log('1. Testing database connection...');
  try {
    await prisma.$connect();
    console.log('   ✓ Database connected successfully\n');
  } catch (e) {
    console.log('   ✗ Connection failed:', e);
    return;
  }

  // Check tables
  console.log('2. Checking tables...');
  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    console.log(`   ✓ Users: ${userCount}`);
    console.log(`   ✓ Posts: ${postCount}\n`);
  } catch (e) {
    console.log('   ✗ Failed to query:', e);
    return;
  }

  // Show all data
  console.log('3. Showing all data...');
  const users = await prisma.user.findMany({
    include: { posts: true },
  });
  for (const user of users) {
    console.log(`   User: ${user.name} (${user.email})`);
    for (const post of user.posts) {
      console.log(`     - Post: "${post.title}" (${post.published ? 'published' : 'draft'})`);
    }
  }

  console.log('\n=== ALL VERIFICATIONS PASSED ✓ ===');
  console.log('\nPrisma Studio: http://localhost:51212');
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
