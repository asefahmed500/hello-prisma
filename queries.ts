import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL!,
});

async function main() {
  console.log('Seeding database...');

  // Create users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@prisma.io',
      name: 'Alice',
      posts: {
        create: [
          { title: 'My first post', content: 'Hello World!', published: true },
          { title: 'Draft post', content: 'This is a draft', published: false },
        ],
      },
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@prisma.io',
      name: 'Bob',
      posts: {
        create: {
          title: "Bob's first post",
          content: 'Nice to meet you!',
          published: true,
        },
      },
    },
  });

  console.log('Created users:', { alice, bob });

  // Read all users
  const allUsers = await prisma.user.findMany({
    include: { posts: true },
  });
  console.log('All users:', allUsers);

  // Find published posts
  const publishedPosts = await prisma.post.findMany({
    where: { published: true },
    include: { author: true },
  });
  console.log('Published posts:', publishedPosts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
