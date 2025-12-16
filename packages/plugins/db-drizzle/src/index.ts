/**
 * Drizzle ORM Plugin for Scaforge
 * Lightweight, type-safe SQL ORM with excellent TypeScript support
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const dbDrizzlePlugin = definePlugin({
  name: 'db-drizzle',
  displayName: 'Drizzle ORM',
  category: 'database',
  description: 'Lightweight, type-safe SQL ORM with excellent TypeScript support',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'drizzle-orm': '^0.29.0',
    },
    devDependencies: {
      'drizzle-kit': '^0.20.0',
    },
  },
  
  configSchema: z.object({
    provider: z.enum(['postgresql', 'mysql', 'sqlite']).default('postgresql'),
    cloudProvider: z.enum(['neon', 'planetscale', 'turso', 'vercel', 'd1', 'none']).default('none'),
    enableLogging: z.boolean().default(false),
    enableMigrations: z.boolean().default(true),
  }),
  
  envVars: [
    {
      name: 'DATABASE_URL',
      description: 'Database connection string',
      required: true,
      secret: true,
    },
  ],
  
  files: [
    // Drizzle configuration
    {
      path: 'drizzle.config.ts',
      template: `import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  {{#if (eq options.provider 'postgresql')}}
  driver: 'pg',
  {{/if}}
  {{#if (eq options.provider 'mysql')}}
  driver: 'mysql2',
  {{/if}}
  {{#if (eq options.provider 'sqlite')}}
  driver: 'better-sqlite',
  {{/if}}
  dbCredentials: {
    {{#if (eq options.provider 'postgresql')}}
    connectionString: process.env.DATABASE_URL!,
    {{/if}}
    {{#if (eq options.provider 'mysql')}}
    connectionString: process.env.DATABASE_URL!,
    {{/if}}
    {{#if (eq options.provider 'sqlite')}}
    url: process.env.DATABASE_URL!,
    {{/if}}
  },
  {{#if options.enableLogging}}
  verbose: true,
  {{/if}}
  strict: true,
} satisfies Config;
`,
      overwrite: false,
    },
    
    // Database schema
    {
      path: 'src/lib/db/schema.ts',
      template: `{{#if (eq options.provider 'postgresql')}}
import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
{{/if}}
{{#if (eq options.provider 'mysql')}}
import { mysqlTable, text, timestamp, boolean, varchar } from 'drizzle-orm/mysql-core';
{{/if}}
{{#if (eq options.provider 'sqlite')}}
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
{{/if}}
import { relations } from 'drizzle-orm';

// Users table
{{#if (eq options.provider 'postgresql')}}
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
{{/if}}
{{#if (eq options.provider 'mysql')}}
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
{{/if}}
{{#if (eq options.provider 'sqlite')}}
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
{{/if}}

// Profiles table
{{#if (eq options.provider 'postgresql')}}
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  bio: text('bio'),
  avatar: text('avatar'),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});
{{/if}}
{{#if (eq options.provider 'mysql')}}
export const profiles = mysqlTable('profiles', {
  id: varchar('id', { length: 36 }).primaryKey(),
  bio: text('bio'),
  avatar: text('avatar'),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
});
{{/if}}
{{#if (eq options.provider 'sqlite')}}
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  bio: text('bio'),
  avatar: text('avatar'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});
{{/if}}

// Posts table
{{#if (eq options.provider 'postgresql')}}
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});
{{/if}}
{{#if (eq options.provider 'mysql')}}
export const posts = mysqlTable('posts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  authorId: varchar('author_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
});
{{/if}}
{{#if (eq options.provider 'sqlite')}}
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  published: integer('published', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});
{{/if}}

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  posts: many(posts),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
`,
      overwrite: false,
    },
    
    // Database client setup
    {
      path: 'src/lib/db/index.ts',
      template: `{{#if (eq options.provider 'postgresql')}}
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
{{/if}}
{{#if (eq options.provider 'mysql')}}
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
{{/if}}
{{#if (eq options.provider 'sqlite')}}
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
{{/if}}
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

{{#if (eq options.provider 'postgresql')}}
// Create the connection
const client = postgres(process.env.DATABASE_URL);

// Create the database instance
export const db = drizzle(client, { 
  schema,
  {{#if options.enableLogging}}
  logger: true,
  {{/if}}
});
{{/if}}

{{#if (eq options.provider 'mysql')}}
// Create the connection
const connection = mysql.createConnection(process.env.DATABASE_URL);

// Create the database instance
export const db = drizzle(connection, { 
  schema,
  {{#if options.enableLogging}}
  logger: true,
  {{/if}}
  mode: 'default',
});
{{/if}}

{{#if (eq options.provider 'sqlite')}}
// Create the connection
const sqlite = new Database(process.env.DATABASE_URL);

// Create the database instance
export const db = drizzle(sqlite, { 
  schema,
  {{#if options.enableLogging}}
  logger: true,
  {{/if}}
});
{{/if}}

// Export schema for use in other files
export * from './schema';

// Helper functions
export async function connectDB() {
  try {
    // Test the connection
    {{#if (eq options.provider 'postgresql')}}
    await client\`SELECT 1\`;
    {{/if}}
    {{#if (eq options.provider 'mysql')}}
    await connection.execute('SELECT 1');
    {{/if}}
    {{#if (eq options.provider 'sqlite')}}
    sqlite.prepare('SELECT 1').get();
    {{/if}}
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDB() {
  {{#if (eq options.provider 'postgresql')}}
  await client.end();
  {{/if}}
  {{#if (eq options.provider 'mysql')}}
  await connection.end();
  {{/if}}
  {{#if (eq options.provider 'sqlite')}}
  sqlite.close();
  {{/if}}
}

// Health check
export async function checkDBHealth() {
  try {
    {{#if (eq options.provider 'postgresql')}}
    await client\`SELECT 1\`;
    {{/if}}
    {{#if (eq options.provider 'mysql')}}
    await connection.execute('SELECT 1');
    {{/if}}
    {{#if (eq options.provider 'sqlite')}}
    sqlite.prepare('SELECT 1').get();
    {{/if}}
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
}
`,
      overwrite: false,
    },
    
    // Database utilities
    {
      path: 'src/lib/db/utils.ts',
      template: `import { db, users, profiles, posts, type NewUser, type NewPost } from './index';
import { eq, sql } from 'drizzle-orm';
{{#if (eq options.provider 'sqlite')}}
import { randomUUID } from 'crypto';
{{/if}}

/**
 * Seed database with example data
 */
export async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  try {
    // Create example users
    const userData: NewUser[] = [
      {
        {{#if (eq options.provider 'sqlite')}}
        id: randomUUID(),
        {{/if}}
        email: 'alice@example.com',
        name: 'Alice Johnson',
        {{#if (eq options.provider 'sqlite')}}
        createdAt: new Date(),
        updatedAt: new Date(),
        {{/if}}
      },
      {
        {{#if (eq options.provider 'sqlite')}}
        id: randomUUID(),
        {{/if}}
        email: 'bob@example.com',
        name: 'Bob Smith',
        {{#if (eq options.provider 'sqlite')}}
        createdAt: new Date(),
        updatedAt: new Date(),
        {{/if}}
      },
    ];
    
    const createdUsers = await db.insert(users).values(userData).returning();
    
    // Create profiles for users
    const profileData = [
      {
        {{#if (eq options.provider 'sqlite')}}
        id: randomUUID(),
        {{/if}}
        bio: 'Software developer and tech enthusiast',
        userId: createdUsers[0].id,
      },
      {
        {{#if (eq options.provider 'sqlite')}}
        id: randomUUID(),
        {{/if}}
        bio: 'Full-stack developer and open source contributor',
        userId: createdUsers[1].id,
      },
    ];
    
    await db.insert(profiles).values(profileData);
    
    // Create example posts
    const postData: NewPost[] = [
      {
        {{#if (eq options.provider 'sqlite')}}
        id: randomUUID(),
        {{/if}}
        title: 'Getting Started with Drizzle ORM',
        content: 'Drizzle ORM is a lightweight and performant TypeScript ORM...',
        published: true,
        authorId: createdUsers[0].id,
        {{#if (eq options.provider 'sqlite')}}
        createdAt: new Date(),
        updatedAt: new Date(),
        {{/if}}
      },
      {
        {{#if (eq options.provider 'sqlite')}}
        id: randomUUID(),
        {{/if}}
        title: 'Building Type-Safe APIs',
        content: 'Type safety is crucial for building reliable applications...',
        published: false,
        authorId: createdUsers[0].id,
        {{#if (eq options.provider 'sqlite')}}
        createdAt: new Date(),
        updatedAt: new Date(),
        {{/if}}
      },
      {
        {{#if (eq options.provider 'sqlite')}}
        id: randomUUID(),
        {{/if}}
        title: 'Modern Web Development',
        content: 'The web development landscape is constantly evolving...',
        published: true,
        authorId: createdUsers[1].id,
        {{#if (eq options.provider 'sqlite')}}
        createdAt: new Date(),
        updatedAt: new Date(),
        {{/if}}
      },
    ];
    
    await db.insert(posts).values(postData);
    
    console.log(\`✅ Created \${createdUsers.length} users with posts and profiles\`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

/**
 * Clean database (useful for testing)
 */
export async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  try {
    // Delete in correct order due to foreign key constraints
    await db.delete(posts);
    await db.delete(profiles);
    await db.delete(users);
    
    console.log('✅ Database cleaned');
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const [userCount] = await db.select({ count: sql\`count(*)\` }).from(users);
  const [postCount] = await db.select({ count: sql\`count(*)\` }).from(posts);
  const [profileCount] = await db.select({ count: sql\`count(*)\` }).from(profiles);
  const [publishedPostCount] = await db.select({ count: sql\`count(*)\` })
    .from(posts)
    .where(eq(posts.published, true));
  
  return {
    users: Number(userCount.count),
    posts: Number(postCount.count),
    profiles: Number(profileCount.count),
    publishedPosts: Number(publishedPostCount.count),
  };
}
`,
      overwrite: false,
    },
    
    // Seed script
    {
      path: 'src/lib/db/seed.ts',
      template: `import { seedDatabase } from './utils';
import { disconnectDB } from './index';

async function main() {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

main();
`,
      overwrite: false,
    },
    
    // Next.js API route for health check
    {
      path: 'src/app/api/db/health/route.ts',
      template: `import { NextResponse } from 'next/server';
import { checkDBHealth } from '@/lib/db';

export async function GET() {
  try {
    const health = await checkDBHealth();
    
    if (health.status === 'healthy') {
      return NextResponse.json(health);
    } else {
      return NextResponse.json(health, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    );
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Example component
    {
      path: 'src/components/examples/drizzle-example.tsx',
      template: `'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

export function DrizzleExample() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Error</h2>
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchUsers}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Drizzle ORM Example</h2>
      <p className="text-gray-600 mb-4">Database connection is working!</p>
      
      <div className="space-y-3">
        <h3 className="font-medium">Users ({users.length}):</h3>
        {users.length === 0 ? (
          <p className="text-gray-500 text-sm">No users found. Run the seed script to add example data.</p>
        ) : (
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user.id} className="p-2 bg-gray-50 rounded">
                <div className="font-medium">{user.name || 'Anonymous'}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="text-xs text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        Powered by Drizzle ORM
      </div>
    </div>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Package.json scripts update
    {
      path: 'package.json.update',
      template: `{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/lib/db/migrate.ts",
    "db:push": "drizzle-kit push",
    "db:seed": "tsx src/lib/db/seed.ts",
    "db:studio": "drizzle-kit studio"
  }
}`,
      overwrite: false,
    },
  ],
  
  // Integrations with other plugins
  integrations: [
    {
      plugin: 'api-trpc',
      type: 'provider',
      files: [
        {
          path: 'src/server/trpc/routers/users.ts',
          template: `import { z } from 'zod';
import { router, publicProcedure } from '../index';
import { TRPCError } from '@trpc/server';
import { eq, like, desc, count, or } from 'drizzle-orm';
import { users, profiles, posts } from '@/lib/db/schema';

export const usersRouter = router({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, offset, search } = input;
      
      const whereClause = search ? 
        or(
          like(users.name, \`%\${search}%\`),
          like(users.email, \`%\${search}%\`)
        ) : undefined;
      
      const [userList, totalCount] = await Promise.all([
        ctx.db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
          profile: profiles,
          postCount: count(posts.id),
        })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .leftJoin(posts, eq(users.id, posts.authorId))
        .where(whereClause)
        .groupBy(users.id, profiles.id)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
        
        ctx.db.select({ count: count() })
        .from(users)
        .where(whereClause)
        .then(result => result[0].count)
      ]);
      
      return {
        users: userList,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        profile: profiles,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(users.id, input.id))
      .limit(1);
      
      if (!user[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      
      // Get user's posts
      const userPosts = await ctx.db.select()
        .from(posts)
        .where(eq(posts.authorId, input.id))
        .orderBy(desc(posts.createdAt));
      
      return {
        ...user[0],
        posts: userPosts,
      };
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      bio: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { bio, ...userData } = input;
      
      const [newUser] = await ctx.db.insert(users)
        .values(userData)
        .returning();
      
      if (bio) {
        await ctx.db.insert(profiles)
          .values({
            bio,
            userId: newUser.id,
          });
      }
      
      return newUser;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      bio: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, bio, ...userData } = input;
      
      const [updatedUser] = await ctx.db.update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      
      if (bio !== undefined) {
        await ctx.db.insert(profiles)
          .values({ bio, userId: id })
          .onConflictDoUpdate({
            target: profiles.userId,
            set: { bio },
          });
      }
      
      return updatedUser;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedUser] = await ctx.db.delete(users)
        .where(eq(users.id, input.id))
        .returning();
      
      return deletedUser;
    }),
});
`,
          overwrite: false,
        },
      ],
    },
  ],
  
  postInstall: `🚀 Drizzle ORM has been configured successfully!

Next steps:
1. Set up your database connection:
   {{#if (eq options.provider 'postgresql')}}
   - Add DATABASE_URL to your .env file
   - Example: DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
   {{/if}}
   {{#if (eq options.provider 'mysql')}}
   - Add DATABASE_URL to your .env file  
   - Example: DATABASE_URL="mysql://user:password@localhost:3306/mydb"
   {{/if}}
   {{#if (eq options.provider 'sqlite')}}
   - Add DATABASE_URL to your .env file
   - Example: DATABASE_URL="file:./dev.db"
   {{/if}}

2. Generate your first migration:
   \`npm run db:generate\`

3. Push schema to database (development):
   \`npm run db:push\`

4. (Optional) Seed your database:
   \`npm run db:seed\`

5. Open Drizzle Studio to explore your data:
   \`npm run db:studio\`

Available commands:
- \`npm run db:generate\` - Generate migrations from schema
- \`npm run db:push\` - Push schema changes to database
- \`npm run db:migrate\` - Run migrations
- \`npm run db:seed\` - Seed database with example data
- \`npm run db:studio\` - Open Drizzle Studio

{{#if (hasPlugin 'api-trpc')}}
✨ Drizzle is now integrated with tRPC! Check out the generated user router.
{{/if}}

{{#if (hasPlugin 'api-apollo')}}
✨ Drizzle is now integrated with Apollo GraphQL! Check out the generated resolvers.
{{/if}}

Documentation: https://orm.drizzle.team/docs/overview`,
});

export default dbDrizzlePlugin;