# How to Add New Models to Prisma

## Step 1: Define Your Model in `schema.prisma`

Edit `prisma/schema.prisma` and add your new model:

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Float
  inStock     Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

## Step 2: Run Migration

```bash
npx prisma migrate dev --name add_product
```

This will create the table in your database.

## Step 3: Generate Prisma Client (if needed)

```bash
npx prisma generate
```

## Step 4: Add Query Code to `queries.ts`

```typescript
import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL!,
});

async function main() {
  // CREATE - Add a new product
  const product = await prisma.product.create({
    data: {
      name: 'Laptop',
      description: 'High-performance laptop',
      price: 999.99,
      inStock: true,
    },
  });
  console.log('Created:', product);

  // READ - Find all products
  const allProducts = await prisma.product.findMany();
  console.log('All products:', allProducts);

  // UPDATE - Update a product
  const updated = await prisma.product.update({
    where: { id: 1 },
    data: { price: 899.99 },
  });
  console.log('Updated:', updated);

  // DELETE - Remove a product
  await prisma.product.delete({
    where: { id: 1 },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Step 5: Run Your Queries

```bash
npx tsx queries.ts
```

---

## Common Model Examples

### Category Model (One-to-Many)

```prisma
model Category {
  id       Int      @id @default(autoincrement())
  name     String
  products Product[]
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  categoryId  Int
  category    Category @relation(fields: [categoryId], references: [id])
}
```

### Tag Model (Many-to-Many)

```prisma
model Post {
  id    Int      @id @default(autoincrement())
  title String
  tags  Tag[]
}

model Tag {
  id    Int      @id @default(autoincrement())
  name  String   @unique
  posts Post[]
}
```

---

## Quick Reference Commands

| Command | Description |
|---------|-------------|
| `npx prisma migrate dev --name <name>` | Create & apply migration |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma studio` | Open visual database editor |
| `npx tsx queries.ts` | Run query script |
