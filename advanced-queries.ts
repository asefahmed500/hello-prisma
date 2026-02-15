import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL!,
});

async function runAllExamples() {
  console.log('=== PRISMA ADVANCED EXAMPLES ===\n');

  // ============================================
  // 1. ADVANCED WHERE CLAUSES
  // ============================================
  console.log('1. ADVANCED WHERE CLAUSES');
  console.log('--------------------------');

  // String filters
  const usersStartingWithA = await prisma.user.findMany({
    where: {
      name: {
        startsWith: 'A',
        mode: 'insensitive',
      },
    },
  });
  console.log('   Users starting with A:', usersStartingWithA);

  // OR conditions
  const postsWithPrisma = await prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: 'post', mode: 'insensitive' } },
        { content: { contains: 'post', mode: 'insensitive' } },
      ],
    },
  });
  console.log('   Posts mentioning "post":', postsWithPrisma.length);

  // AND conditions
  const publishedPostsByUser = await prisma.post.findMany({
    where: {
      AND: [
        { published: true },
        { author: { email: 'alice@prisma.io' } },
      ],
    },
  });
  console.log('   Published posts by Alice:', publishedPostsByUser.length);

  // ============================================
  // 2. PAGINATION
  // ============================================
  console.log('\n2. PAGINATION');
  console.log('--------------');

  // Offset-based pagination
  const firstPage = await prisma.post.findMany({
    skip: 0,
    take: 2,
    orderBy: { createdAt: 'desc' },
  });
  console.log('   First page (2 items):', firstPage.length);

  // Cursor-based pagination (for large datasets)
  const cursorPage = await prisma.post.findMany({
    take: 2,
    cursor: firstPage.length > 0 ? { id: firstPage[0].id } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  console.log('   Cursor page:', cursorPage.length);

  // ============================================
  // 3. SELECT SPECIFIC FIELDS
  // ============================================
  console.log('\n3. SELECT SPECIFIC FIELDS');
  console.log('-------------------------');

  const userNamesOnly = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      posts: {
        select: { title: true },
      },
    },
  });
  console.log('   User names with post titles:', userNamesOnly);

  // ============================================
  // 4. RELATIONS
  // ============================================
  console.log('\n4. RELATIONS');
  console.log('-------------');

  // Nested include
  const usersWithAllPosts = await prisma.user.findMany({
    include: {
      posts: {
        where: { published: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  console.log('   Users with published posts:');
  usersWithAllPosts.forEach((user) => {
    console.log(`     ${user.name}: ${user.posts.length} published posts`);
  });

  // ============================================
  // 5. AGGREGATION
  // ============================================
  console.log('\n5. AGGREGATION');
  console.log('--------------');

  // Count
  const totalUsers = await prisma.user.count();
  const totalPosts = await prisma.post.count();
  const publishedPostsCount = await prisma.post.count({
    where: { published: true },
  });
  console.log(`   Users: ${totalUsers}, Posts: ${totalPosts}, Published: ${publishedPostsCount}`);

  // Count by relation
  const usersWithPostCounts = await prisma.user.findMany({
    include: { _count: { select: { posts: true } } },
  });
  console.log('   Post counts per user:');
  usersWithPostCounts.forEach((user: any) => {
    console.log(`     ${user.name}: ${user._count.posts} posts`);
  });

  // ============================================
  // 6. UPSERT
  // ============================================
  console.log('\n6. UPSERT');
  console.log('---------');

  const upsertedUser = await prisma.user.upsert({
    where: { email: 'upsert@example.com' },
    update: { name: 'Updated Upsert User' },
    create: { email: 'upsert@example.com', name: 'New Upsert User' },
  });
  console.log('   Upserted user:', upsertedUser.name);

  // ============================================
  // 7. UPDATE MANY
  // ============================================
  console.log('\n7. UPDATE MANY');
  console.log('-------------');

  const updateResult = await prisma.post.updateMany({
    where: { published: false },
    data: { published: true },
  });
  console.log(`   Published ${updateResult.count} draft posts`);

  // ============================================
  // 8. TRANSACTION
  // ============================================
  console.log('\n8. TRANSACTION');
  console.log('-------------');

  await prisma.$transaction([
    prisma.user.update({
      where: { email: 'alice@prisma.io' },
      data: { name: 'Alice Updated' },
    }),
    prisma.post.create({
      data: {
        title: 'Transaction Post',
        content: 'Created in transaction',
        published: true,
        authorId: 1,
      },
    }),
  ]);
  console.log('   Transaction completed: User updated + Post created');

  // ============================================
  // 9. DATES & COMPARISONS
  // ============================================
  console.log('\n9. DATES & COMPARISONS');
  console.log('---------------------');

  const recentPosts = await prisma.post.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });
  console.log(`   Posts from last 24h: ${recentPosts.length}`);

  // ============================================
  // 10. GROUP BY
  // ============================================
  console.log('\n10. GROUP BY');
  console.log('-----------');

  const postsPerUser = await prisma.post.groupBy({
    by: ['authorId'],
    _count: { id: true },
  });
  console.log('   Posts per user:');
  postsPerUser.forEach((group) => {
    console.log(`     Author ${group.authorId}: ${group._count.id} posts`);
  });

  console.log('\n=== ALL EXAMPLES COMPLETE ===');
}

runAllExamples()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
