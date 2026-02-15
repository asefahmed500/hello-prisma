# Prisma Complete Database Guide - All Backends Covered

## Supported Databases

| Database | Provider | Connection String | Best For |
|----------|----------|-------------------|----------|
| PostgreSQL | `postgresql` | `postgresql://USER:PASSWORD@HOST:PORT/DATABASE` | Complex queries, JSON, full-text search |
| MySQL | `mysql` | `mysql://USER:PASSWORD@HOST:PORT/DATABASE` | Web apps, widespread hosting |
| SQLite | `sqlite` | `file:./dev.db` | Local dev, embedded, serverless |
| SQL Server | `sqlserver` | `sqlserver://USER:PASSWORD@HOST:PORT/DATABASE` | Enterprise, Windows ecosystems |
| MongoDB | `mongodb` | `mongodb+srv://USER:PASSWORD@HOST/DATABASE` | NoSQL, flexible schemas |
| CockroachDB | `cockroachdb` | `postgresql://USER:PASSWORD@HOST:PORT/DATABASE` | Distributed, cloud-native |

---

## 1. PostgreSQL (Recommended)

### Schema Setup

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  jsonField Json?                    // PostgreSQL JSON/JSONB
  createdAt DateTime @default(now())
}

model Post {
  id          Int      @id @default(autoincrement())
  title       String   @db.VarChar(255)  // Custom column type
  content     String?  @db.Text
  published   Boolean  @default(false)
  createdAt   DateTime @default(now()) @db.Timestamptz
}
```

### Environment Variables

```env
# Local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/mydb?schema=public"

# Supabase
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Neon (Serverless PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.aws.neon.tech/neondb?sslmode=require"

# Railway
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"

# Prisma Postgres
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```

### Optimization for PostgreSQL

```typescript
// Connection pooling (PgBouncer)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Index optimization in schema
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String @indexed  // Add index for frequently queried fields

  @@index([email, name])  // Composite index
  @@map("users")          // Custom table name
}

// Full-text search
const results = await prisma.$queryRaw`
  SELECT * FROM "Post"
  WHERE to_tsvector('english', title || ' ' || content)
  @@ to_tsquery('english', ${searchTerm})
`;
```

---

## 2. MySQL

### Schema Setup

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique @db.VarChar(255)
  name      String?  @db.VarChar(100)
  createdAt DateTime @default(now()) @db.Timestamp(0)
}
```

### Environment Variables

```env
# Local MySQL
DATABASE_URL="mysql://root:password@localhost:3306/mydb"

# PlanetScale
DATABASE_URL="mysql://xxx:pscale_pw_xxx@aws.connect.psdb.cloud/mydb?sslaccept=strict"

# AWS RDS MySQL
DATABASE_URL="mysql://user:password@mydb.xxx.us-east-1.rds.amazonaws.com:3306/mydb"

# Xata (MySQL compatible)
DATABASE_URL="mysql://xxx:x.x@xxx.x.x.x.us-east-1.xata.sh:3309/mydb"
```

### Optimization for MySQL

```typescript
// Engine-specific settings
model User {
  id    Int    @id @default(autoincrement())
  email String @unique

  @@index([email])
  @@engine([InnoDB])  // Specify storage engine
}

// Connection limits
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```

---

## 3. SQLite

### Schema Setup

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
}
```

### Environment Variables

```env
# File-based SQLite
DATABASE_URL="file:./dev.db"

# In-memory SQLite (testing)
DATABASE_URL="file::memory:"

# Shared mode (for multiple connections)
DATABASE_URL="file:./dev.db?connection_limit=1"
```

### Optimization for SQLite

```typescript
// WAL mode for better concurrency
await prisma.$executeRaw`PRAGMA journal_mode = WAL;`;
await prisma.$executeRaw`PRAGMA synchronous = NORMAL;`;

// Connection limits (SQLite needs single connection)
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

// Foreign key enforcement
await prisma.$executeRaw`PRAGMA foreign_keys = ON;`;
```

---

## 4. SQL Server (MSSQL)

### Schema Setup

```prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String   @db.NVarChar(255)
  content   String?  @db.NVarChar(max)
  published Boolean  @default(false)
}
```

### Environment Variables

```env
# Local SQL Server
DATABASE_URL="sqlserver://localhost:1433;database=mydb;user=sa;password=password;trustservercertificate=true"

# Azure SQL Database
DATABASE_URL="sqlserver://user:password@xxx.database.windows.net:1433;database=mydb;encrypt=true"

# AWS RDS SQL Server
DATABASE_URL="sqlserver://admin:password@xxx.xxx.us-east-1.rds.amazonaws.com:1433;database=mydb"
```

---

## 5. MongoDB

### Schema Setup

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String   @db.ObjectId
}
```

### Environment Variables

```env
# Local MongoDB
DATABASE_URL="mongodb://localhost:27017/mydb"

# MongoDB Atlas
DATABASE_URL="mongodb+srv://user:password@cluster0.xxx.mongodb.net/mydb?retryWrites=true&w=majority"

# AWS DocumentDB
DATABASE_URL="mongodb://user:password@docdb-xxx.xxx.us-east-1.docdb.amazonaws.com:27017/?ssl=true"
```

### Optimization for MongoDB

```typescript
// Compound indexes
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  email String @unique
  name  String

  @@index([email, name])  // Compound index
}

// Aggregation pipeline
const result = await prisma.user.aggregateRaw({
  pipeline: [
    { $match: { name: 'John' } },
    { $group: { _id: '$name', count: { $sum: 1 } } },
  ],
});
```

---

## 6. CockroachDB

### Schema Setup

```prisma
datasource db {
  provider = "cockroachdb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

### Environment Variables

```env
# Local CockroachDB
DATABASE_URL="postgresql://root@localhost:26257/mydb?sslmode=disable"

# CockroachDB Serverless
DATABASE_URL="postgresql://user:password@xxx.xxx.gcp-us-east1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"

# CockroachDB Dedicated
DATABASE_URL="postgresql://user:password@xxx.xxx.us-east-1.aws.cockroachlabs.cloud:26257/mydb?sslmode=verify-full"
```

---

## Connection Pooling & Performance

### Universal Connection Options

```env
# Connection pool configuration
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20&connect_timeout=10"
```

### Prisma Client with Connection Pooling

```typescript
// Direct connection (for serverless/edge)
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL }, // Bypass connection pooler
  },
});

// Connection pooling (for long-running servers)
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }, // Use pooled connection
  },
});
```

### PgBouncer / RDS Proxy Configuration

```env
# Transaction pooling (recommended for serverless)
DATABASE_URL="postgresql://user:pass@pooler.example.com:6543/db?pgbouncer=true"

# Session pooling (for traditional servers)
DATABASE_URL="postgresql://user:pass@pooler.example.com:5432/db?pgbouncer=true"
```

---

## Schema Design Best Practices

### Indexes

```prisma
model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  username String @unique

  @@index([email])              // Single column
  @@index([username, email])     // Composite index
  @@index([email(sort: Desc)])   // Descending index
}
```

### Relations

```prisma
// One-to-One
model User {
  id   Int    @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id    Int  @id @default(autoincrement())
  user  User @relation(fields: [userId], references: [id])
  userId Int  @unique
}

// One-to-Many
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id      Int  @id @default(autoincrement())
  userId  Int
  user    User @relation(fields: [userId], references: [id])
}

// Many-to-Many
model Post {
  id   Int    @id @default(autoincrement())
  tags Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  posts Post[]
}
```

---

## Database-Specific Features

### PostgreSQL - Full Text Search

```prisma
model Post {
  id      Int    @id @default(autoincrement())
  title   String
  content String

  @@index([title, content], type: FullText)
}
```

### PostgreSQL - Array Types

```prisma
model User {
  id    Int     @id @default(autoincrement())
  tags String[]
}
```

### PostgreSQL - JSON/JSONB

```prisma
model User {
  id    Int   @id @default(autoincrement())
  metadata Json?
}
```

### MySQL - ENUM

```prisma
enum Status {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Post {
  id     Int    @id @default(autoincrement())
  status Status @default(DRAFT)
}
```

### MongoDB - Embedded Documents

```typescript
// MongoDB naturally supports nested structures
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    profile: {
      bio: 'Developer',
      website: 'https://example.com',
    },
  },
});
```

---

## Migration Commands (All Databases)

```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Generate client
npx prisma generate

# Studio (visual editor)
npx prisma studio
```

---

## Quick Database Setup Services

| Service | Database | Free Tier | Setup Command |
|---------|----------|-----------|---------------|
| [Prisma Postgres](https://www.prisma.io/data-platform/postgres) | PostgreSQL | Yes | Dashboard |
| [Neon](https://neon.tech) | PostgreSQL | Yes | `npx neonctl` |
| [Supabase](https://supabase.com) | PostgreSQL | Yes | Dashboard |
| [PlanetScale](https://planetscale.com) | MySQL | Yes | `pscale` CLI |
| [Turso](https://turso.tech) | SQLite | Yes | `turso` CLI |
| [MongoDB Atlas](https://mongodb.com/atlas) | MongoDB | Yes | Dashboard |
| [Railway](https://railway.app) | All | $5 credit | `railway up` |
| [Xata](https://xata.io) | PostgreSQL | Yes | `xata` CLI |
