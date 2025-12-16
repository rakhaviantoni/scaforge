# @scaforge/plugin-db-drizzle

Drizzle ORM plugin for Scaforge projects. Provides a lightweight, type-safe SQL ORM with excellent TypeScript support.

## Features

- 🔒 **Type-safe** - Full TypeScript support with inferred types
- 🪶 **Lightweight** - Minimal runtime overhead
- 🗄️ **Multi-database** - PostgreSQL, MySQL, SQLite support
- 🚀 **Cloud-ready** - Works with serverless and edge environments
- 🔄 **Migrations** - Schema versioning with drizzle-kit
- 🎯 **Auto-integration** - Seamlessly integrates with API plugins

## Supported Databases

- **PostgreSQL** - Traditional and cloud (Neon, Supabase, Vercel Postgres)
- **MySQL** - Traditional and cloud (PlanetScale)
- **SQLite** - Local development and edge (Turso, Cloudflare D1)

## Installation

```bash
npx scaforge add db-drizzle
```

The plugin will prompt you to select your preferred database type and provider.

## Usage

After installation, you'll have:

- Drizzle configuration (`drizzle.config.ts`)
- Database schema (`src/lib/db/schema.ts`)
- Database client setup (`src/lib/db/index.ts`)
- Example models and migrations
- Environment variables configuration

### Basic Usage

```typescript
import { db } from '@/lib/db';
import { users, posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Create a user
const newUser = await db.insert(users).values({
  name: 'John Doe',
  email: 'john@example.com',
}).returning();

// Find users
const allUsers = await db.select().from(users);

// Find user by email
const user = await db.select().from(users)
  .where(eq(users.email, 'john@example.com'));

// Join with posts
const usersWithPosts = await db.select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId));
```

### With tRPC Integration

When used with the tRPC plugin, Drizzle is automatically available in your tRPC context:

```typescript
import { router, publicProcedure } from '@/server/trpc';
import { users } from '@/lib/db/schema';

export const userRouter = router({
  getUsers: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.select().from(users);
    }),
});
```

## Environment Variables

The plugin will add the following to your `.env.example`:

```env
# Database
DATABASE_URL="your-database-connection-string"
```

## Commands

After installation, you can use these Drizzle commands:

```bash
# Generate migrations
npx drizzle-kit generate:pg # for PostgreSQL
npx drizzle-kit generate:mysql # for MySQL
npx drizzle-kit generate:sqlite # for SQLite

# Push schema changes (development)
npx drizzle-kit push:pg
npx drizzle-kit push:mysql
npx drizzle-kit push:sqlite

# Open Drizzle Studio
npx drizzle-kit studio

# Apply migrations
npm run db:migrate
```

## Database Providers

### PostgreSQL (Neon)
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

### MySQL (PlanetScale)
```env
DATABASE_URL="mysql://user:password@host:3306/database?ssl={"rejectUnauthorized":true}"
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

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Database Drivers](https://orm.drizzle.team/docs/installation-and-db-connection)