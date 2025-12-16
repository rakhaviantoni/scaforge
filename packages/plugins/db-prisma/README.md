# @scaforge/plugin-db-prisma

Prisma ORM plugin for Scaforge projects. Provides type-safe database access with support for multiple database backends.

## Features

- 🔒 **Type-safe** - Full TypeScript support with generated types
- 🗄️ **Multi-database** - PostgreSQL, MySQL, SQLite, MongoDB support
- 🚀 **Cloud-ready** - Works with PlanetScale, Neon, Turso, and more
- 🔄 **Migrations** - Database schema versioning and migrations
- 🎯 **Auto-integration** - Seamlessly integrates with API plugins

## Supported Databases

- **PostgreSQL** - Traditional and cloud (Neon, Supabase)
- **MySQL** - Traditional and cloud (PlanetScale)
- **SQLite** - Local development and edge (Turso)
- **MongoDB** - Document database support

## Installation

```bash
npx scaforge add db-prisma
```

The plugin will prompt you to select your preferred database type and provider.

## Usage

After installation, you'll have:

- Prisma schema file (`prisma/schema.prisma`)
- Database client setup (`src/lib/prisma.ts`)
- Example models and migrations
- Environment variables configuration

### Basic Usage

```typescript
import { prisma } from '@/lib/prisma';

// Create a user
const user = await prisma.user.create({
  data: {
    name: 'John Doe',
    email: 'john@example.com',
  },
});

// Find users
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: '@example.com',
    },
  },
});
```

### With tRPC Integration

When used with the tRPC plugin, Prisma is automatically available in your tRPC context:

```typescript
import { router, publicProcedure } from '@/server/trpc';

export const userRouter = router({
  getUsers: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.user.findMany();
    }),
});
```

## Environment Variables

The plugin will add the following to your `.env.example`:

```env
# Database
DATABASE_URL="your-database-connection-string"
DIRECT_URL="your-direct-database-url" # For connection pooling
```

## Commands

After installation, you can use these Prisma commands:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Deploy migrations to production
npx prisma migrate deploy
```

## Database Providers

### PostgreSQL (Neon)
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

### MySQL (PlanetScale)
```env
DATABASE_URL="mysql://user:password@host:3306/database?sslaccept=strict"
```

### SQLite (Turso)
```env
DATABASE_URL="libsql://your-database.turso.io"
DATABASE_AUTH_TOKEN="your-auth-token"
```

## Integration

This plugin automatically integrates with:

- **API plugins** (tRPC, Apollo, etc.) - Adds database context
- **Auth plugins** - Provides user models and relations
- **CMS plugins** - Enables content storage and retrieval

## Learn More

- [Prisma Documentation](https://www.prisma.io/docs)
- [Database Providers](https://www.prisma.io/docs/reference/database-reference/supported-databases)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)