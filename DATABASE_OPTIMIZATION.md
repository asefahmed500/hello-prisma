# Prisma Database Optimization Guide

## Connection Pooling Strategies

### Serverless / Edge Functions (Vercel, Netlify, AWS Lambda)

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: process.env.DIRECT_URL }, // Direct URL for serverless
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Long-Running Servers (Node.js, Express)

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }, // Pooled URL
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
```

---

## Index Optimization

### Add Indexes in Schema

```prisma
model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  username String @unique

  // Index frequently queried fields
  @@index([email])
  @@index([username])
  @@index([createdAt])
}
```

### Composite Indexes for Multi-Column Queries

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  published Boolean
  authorId  Int
  createdAt DateTime @default(now())

  // Optimize queries like: WHERE authorId = ? AND published = ?
  @@index([authorId, published])

  // Optimize sorting: WHERE published = ? ORDER BY createdAt DESC
  @@index([published, createdAt(sort: Desc)])
}
```

### Full-Text Search Index

```prisma
model Post {
  id      Int    @id @default(autoincrement())
  title   String
  content String

  @@index([title, content], type: FullText)
}
```

---

## Query Optimization

### Select Only Needed Fields

```typescript
// ❌ Bad - Fetches all columns
const users = await prisma.user.findMany();

// ✅ Good - Fetches only needed columns
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

### Pagination

```typescript
// ❌ Bad - Fetches all records
const users = await prisma.user.findMany();

// ✅ Good - Offset pagination
const users = await prisma.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

// ✅ Better - Cursor pagination (for large datasets)
const users = await prisma.user.findMany({
  take: pageSize,
  cursor: { id: lastId },
  orderBy: { id: 'asc' },
});
```

### Efficient Relations

```typescript
// ❌ Bad - N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } });
}

// ✅ Good - Single query with include
const users = await prisma.user.findMany({
  include: { posts: true },
});
```

---

## Caching Strategies

### Redis Cache

```typescript
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const redis = new Redis(process.env.REDIS_URL);
const prisma = new PrismaClient();

async function getUser(id: number) {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await prisma.user.findUnique({ where: { id } });
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  return user;
}
```

### Stale-While-Revalidate

```typescript
async function getUserWithCache(id: number) {
  const cached = await redis.get(`user:${id}`);
  if (cached) {
    // Revalidate in background
    prisma.user.findUnique({ where: { id } }).then(user => {
      redis.setex(`user:${id}`, 3600, JSON.stringify(user));
    });
    return JSON.parse(cached);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  return user;
}
```

---

## Read Replicas

```typescript
import { PrismaClient } from '@prisma/client';

const readPrisma = new PrismaClient({
  datasources: { db: { url: process.env.READ_REPLICA_URL } },
});

const writePrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

export const db = {
  read: readPrisma,
  write: writePrisma,
};

// Usage
const users = await db.read.user.findMany(); // Read from replica
await db.write.user.create({ data: {...} }); // Write to primary
```

---

## Transaction Optimization

### Batch Operations

```typescript
// ❌ Bad - Multiple round trips
await prisma.user.create({ data: { email: 'user1@example.com' } });
await prisma.user.create({ data: { email: 'user2@example.com' } });
await prisma.user.create({ data: { email: 'user3@example.com' } });

// ✅ Good - Single transaction
await prisma.$transaction([
  prisma.user.create({ data: { email: 'user1@example.com' } }),
  prisma.user.create({ data: { email: 'user2@example.com' } }),
  prisma.user.create({ data: { email: 'user3@example.com' } }),
]);
```

### createMany for Bulk Inserts

```typescript
// ✅ Best for bulk inserts
await prisma.user.createMany({
  data: [
    { email: 'user1@example.com' },
    { email: 'user2@example.com' },
    { email: 'user3@example.com' },
  ],
  skipDuplicates: true, // Ignore unique constraint violations
});
```

---

## Performance Monitoring

### Query Logging

```typescript
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

### Metrics Collection

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);

  // Send to monitoring service (Datadog, New Relic, etc.)
  // metrics.track('prisma.query', { duration: after - before, model: params.model });

  return result;
});
```

---

## Environment Configuration

### Development

```env
# Direct connection for dev
DATABASE_URL="postgresql://user:pass@localhost:5432/devdb"
```

### Production with PgBouncer

```env
# Connection pool URL
DATABASE_URL="postgresql://user:pass@pooler.example.com:6543/db?pgbouncer=true"

# Direct URL (for migrations)
DIRECT_URL="postgresql://user:pass@db.example.com:5432/db"
```

### Prisma Accelerate

```env
# Accelerate URL (global edge caching)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```

---

## Best Practices Summary

| Practice | Description |
|----------|-------------|
| **Use indexes** | Add indexes to frequently queried columns |
| **Select specific fields** | Only fetch columns you need |
| **Use pagination** | Never fetch all records at once |
| **Avoid N+1 queries** | Use `include` or `select` for relations |
| **Batch operations** | Use `createMany` and `updateMany` |
| **Connection pooling** | Use poolers in production |
| **Cache when possible** | Redis, CDN, or edge caching |
| **Monitor queries** | Log slow queries and optimize |
| **Use transactions wisely** | Group related operations |
| **Read replicas** | Offload read queries to replicas |
