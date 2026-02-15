# Prisma Complete Guide - All Operations Covered

## Table of Contents
1. [CRUD Operations](#crud-operations)
2. [Advanced Queries](#advanced-queries)
3. [Relations](#relations)
4. [Transactions](#transactions)
5. [Aggregation](#aggregation)
6. [Raw SQL](#raw-sql)
7. [Migrations](#migrations)

---

## CRUD Operations

### CREATE

```typescript
// Single record
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});

// Nested create (with relations)
const userWithPosts = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    posts: {
      create: [
        { title: 'First Post', content: 'Hello!' },
        { title: 'Second Post', content: 'World!' },
      ],
    },
  },
});

// Many records
const users = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user3@example.com', name: 'User 3' },
  ],
});
```

### READ

```typescript
// Find all
const allUsers = await prisma.user.findMany();

// Find unique
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

// Find first
const firstUser = await prisma.user.findFirst({
  where: { name: { startsWith: 'J' } },
});

// Find with select (specific fields)
const userWithEmail = await prisma.user.findFirst({
  select: { email: true, name: true },
});

// Find with include (relations)
const userWithPosts = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true },
});

// Pagination
const users = await prisma.user.findMany({
  skip: 10,
  take: 20,
});

// Cursor-based pagination
const users = await prisma.user.findMany({
  take: 20,
  cursor: { id: 50 },
});

// Ordering
const users = await prisma.user.findMany({
  orderBy: { createdAt: 'desc' },
});
```

### UPDATE

```typescript
// Update single
const updated = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Jane Doe' },
});

// Update many
const updatedCount = await prisma.user.updateMany({
  where: { name: { contains: 'John' } },
  data: { name: 'Jane' },
});

// Upsert (create if not exists)
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated Name' },
  create: { email: 'user@example.com', name: 'New User' },
});

// Nested update
const updated = await prisma.user.update({
  where: { id: 1 },
  data: {
    posts: {
      update: {
        where: { id: 1 },
        data: { title: 'Updated Title' },
      },
    },
  },
});
```

### DELETE

```typescript
// Delete single
await prisma.user.delete({
  where: { id: 1 },
});

// Delete many
await prisma.post.deleteMany({
  where: { published: false },
});

// Nested delete
await prisma.user.delete({
  where: { id: 1 },
  include: { posts: true }, // Deletes related posts if cascade
});
```

---

## Advanced Queries

### Where Conditions

```typescript
// Equals
await prisma.user.findMany({
  where: { name: 'John' },
});

// String filters
await prisma.user.findMany({
  where: {
    name: {
      contains: 'John',
      startsWith: 'J',
      endsWith: 'n',
      mode: 'insensitive', // Case-insensitive
    },
  },
});

// Number filters
await prisma.post.findMany({
  where: {
    id: { gt: 10, lt: 100 }, // Greater than, less than
  },
});

// Date filters
await prisma.user.findMany({
  where: {
    createdAt: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31'),
    },
  },
});

// Boolean filters
await prisma.post.findMany({
  where: { published: true },
});

// Null checks
await prisma.user.findMany({
  where: { name: null },
});

// Array/Enum filters
await prisma.post.findMany({
  where: {
    category: { in: ['tech', 'coding'] },
  },
});
```

### Logical Operators

```typescript
// AND
await prisma.user.findMany({
  where: {
    AND: [
      { name: { startsWith: 'J' } },
      { email: { endsWith: '@example.com' } },
    ],
  },
});

// OR
await prisma.post.findMany({
  where: {
    OR: [
      { title: { contains: 'Prisma' } },
      { content: { contains: 'Prisma' } },
    ],
  },
});

// NOT
await prisma.user.findMany({
  where: {
    NOT: { name: 'Admin' },
  },
});
```

---

## Relations

### One-to-Many

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id      Int  @id @default(autoincrement())
  userId  Int
  user    User @relation(fields: [userId], references: [id])
}
```

```typescript
// Create with relation
await prisma.post.create({
  data: {
    title: 'My Post',
    user: {
      connect: { id: 1 }, // Connect existing
    },
  },
});

// Query with relation
const userWithPosts = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true },
});

// Disconnect relation
await prisma.post.update({
  where: { id: 1 },
  data: { user: { disconnect: true } },
});
```

### Many-to-Many

```prisma
model Post {
  id    Int      @id @default(autoincrement())
  tags  Tag[]
}

model Tag {
  id    Int      @id @default(autoincrement())
  posts Post[]
}
```

```typescript
// Create with many-to-many
await prisma.post.create({
  data: {
    title: 'My Post',
    tags: {
      create: [{ name: 'prisma' }, { name: 'typescript' }],
    },
  },
});

// Connect existing
await prisma.post.create({
  data: {
    title: 'Another Post',
    tags: {
      connect: [{ id: 1 }, { id: 2 }],
    },
  },
});
```

---

## Transactions

```typescript
// Sequential operations
await prisma.$transaction([
  prisma.user.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } }),
  prisma.user.update({ where: { id: 2 }, data: { balance: { increment: 100 } } }),
]);

// Interactive transaction
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id: 1 } });
  if (!user) throw new Error('User not found');

  await tx.post.create({
    data: { title: 'Transactional Post', authorId: user.id },
  });
});
```

---

## Aggregation

```typescript
// Count
const count = await prisma.user.count();
const countWithFilter = await prisma.post.count({
  where: { published: true },
});

// Sum, Avg, Min, Max
const stats = await prisma.post.aggregate({
  _sum: { views: true },
  _avg: { likes: true },
  _min: { createdAt: true },
  _max: { createdAt: true },
  _count: true,
});

// Group by
const grouped = await prisma.post.groupBy({
  by: ['authorId'],
  _count: { title: true },
  _sum: { views: true },
});
```

---

## Raw SQL

```typescript
// Execute raw
await prisma.$executeRaw`
  INSERT INTO "User" (email, name) VALUES (${email}, ${name})
`;

// Query raw
const users = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE email = ${email}
`;

// Unsafe raw (use carefully)
const result = await prisma.$queryRawUnsafe(
  'SELECT * FROM "User" WHERE email = $1',
  email
);
```

---

## Migrations

```bash
# Create migration
npx prisma migrate dev --name add_user_table

# Reset database
npx prisma migrate reset

# Deploy migration (production)
npx prisma migrate deploy

# Studio
npx prisma studio
```

---

## Common Patterns

### Soft Delete

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String
  deletedAt DateTime?
}

// Query excluding deleted
await prisma.user.findMany({
  where: { deletedAt: null },
});
```

### Full Text Search

```typescript
await prisma.user.findMany({
  where: {
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
    ],
  },
});
```

### Batch Operations

```typescript
// Batch create
await prisma.user.createMany({
  data: usersData,
  skipDuplicates: true,
});

// Batch update
await prisma.user.updateMany({
  where: { verified: false },
  data: { verified: true },
});
```
