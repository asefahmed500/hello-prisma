import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL!,
});

async function main() {
  console.log('=== PRISMA QUERY EXAMPLES ===\n');

  // ============================================
  // CREATE - Add new data
  // ============================================
  console.log('1. CREATE - Adding new user and post...');

  const newUser = await prisma.user.create({
    data: {
      email: 'charlie@prisma.io',
      name: 'Charlie',
      posts: {
        create: {
          title: 'Charlie introduction',
          content: 'Hi everyone!',
          published: true,
        },
      },
    },
  });
  console.log('   Created:', newUser);

  // ============================================
  // READ - Find data
  // ============================================
  console.log('\n2. READ - Finding users...');

  // Find all users
  const allUsers = await prisma.user.findMany();
  console.log('   All users:', allUsers);

  // Find one user by email
  const specificUser = await prisma.user.findUnique({
    where: { email: 'alice@prisma.io' },
    include: { posts: true },
  });
  console.log('   Alice with posts:', specificUser);

  // Find with conditions
  const publishedPosts = await prisma.post.findMany({
    where: { published: true },
    include: { author: true },
  });
  console.log('   Published posts:', publishedPosts);

  // ============================================
  // UPDATE - Modify data
  // ============================================
  console.log('\n3. UPDATE - Updating user...');

  const updatedUser = await prisma.user.update({
    where: { email: 'charlie@prisma.io' },
    data: { name: 'Charles' },
  });
  console.log('   Updated:', updatedUser);

  // ============================================
  // DELETE - Remove data
  // ============================================
  console.log('\n4. DELETE - Removing user...');

  await prisma.user.delete({
    where: { email: 'charlie@prisma.io' },
  });
  console.log('   Deleted user successfully');

  // ============================================
  // AGGREGATION - Count and stats
  // ============================================
  console.log('\n5. AGGREGATION - Statistics...');

  const userCount = await prisma.user.count();
  const postCount = await prisma.post.count();
  const publishedCount = await prisma.post.count({ where: { published: true } });

  console.log(`   Users: ${userCount}`);
  console.log(`   Posts: ${postCount}`);
  console.log(`   Published: ${publishedCount}`);

  console.log('\n=== ALL EXAMPLES COMPLETE ===');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
