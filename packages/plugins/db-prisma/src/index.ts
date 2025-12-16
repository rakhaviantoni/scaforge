/**
 * Prisma ORM Plugin for Scaforge
 * Type-safe database access with support for multiple backends
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const dbPrismaPlugin = definePlugin({
  name: 'db-prisma',
  displayName: 'Prisma',
  category: 'database',
  description: 'Type-safe database access with Prisma ORM',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      '@prisma/client': '^5.7.0',
    },
    devDependencies: {
      'prisma': '^5.7.0',
    },
  },
  
  configSchema: z.object({
    provider: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb']).default('postgresql'),
    cloudProvider: z.enum(['neon', 'planetscale', 'turso', 'supabase', 'railway', 'none']).default('none'),
    enableLogging: z.boolean().default(false),
    enableMetrics: z.boolean().default(false),
    connectionPooling: z.boolean().default(true),
  }),
  
  envVars: [
    {
      name: 'DATABASE_URL',
      description: 'Database connection string',
      required: true,
      secret: true,
    },
    {
      name: 'DIRECT_URL',
      description: 'Direct database connection (for connection pooling)',
      required: false,
      secret: true,
    },
  ],
  
  files: [
    // Prisma schema
    {
      path: 'prisma/schema.prisma',
      template: `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
  {{#if options.enableMetrics}}
  previewFeatures = ["metrics"]
  {{/if}}
}

datasource db {
  provider = "{{options.provider}}"
  url      = env("DATABASE_URL")
  {{#if (and options.connectionPooling (eq options.provider 'postgresql'))}}
  directUrl = env("DIRECT_URL")
  {{/if}}
  {{#if (eq options.provider 'sqlite')}}
  {{#if (eq options.cloudProvider 'turso')}}
  url      = env("DATABASE_URL")
  {{/if}}
  {{/if}}
}

// Example User model
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  posts     Post[]
  profile   Profile?
  
  {{#if (eq options.provider 'mongodb')}}
  @@map("users")
  {{else}}
  @@map("users")
  {{/if}}
}

// Example Profile model
model Profile {
  id     String  @id @default(cuid())
  bio    String?
  avatar String?
  userId String  @unique
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  {{#if (eq options.provider 'mongodb')}}
  @@map("profiles")
  {{else}}
  @@map("profiles")
  {{/if}}
}

// Example Post model
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  {{#if (eq options.provider 'mongodb')}}
  @@map("posts")
  {{else}}
  @@map("posts")
  {{/if}}
}
`,
      overwrite: false,
    },
    
    // Prisma client setup
    {
      path: 'src/lib/prisma.ts',
      template: `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  {{#if options.enableLogging}}
  log: ['query', 'info', 'warn', 'error'],
  {{/if}}
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper types
export type User = Awaited<ReturnType<typeof prisma.user.findUnique>>;
export type Post = Awaited<ReturnType<typeof prisma.post.findUnique>>;
export type Profile = Awaited<ReturnType<typeof prisma.profile.findUnique>>;

// Helper functions
export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDB() {
  await prisma.$disconnect();
}

// Health check
export async function checkDBHealth() {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
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
      path: 'src/lib/db-utils.ts',
      template: `import { prisma } from './prisma';

/**
 * Seed database with example data
 */
export async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  // Create example users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        name: 'Alice Johnson',
        profile: {
          create: {
            bio: 'Software developer and tech enthusiast',
          },
        },
        posts: {
          create: [
            {
              title: 'Getting Started with Prisma',
              content: 'Prisma is a next-generation ORM that makes database access easy...',
              published: true,
            },
            {
              title: 'Building Type-Safe APIs',
              content: 'Type safety is crucial for building reliable applications...',
              published: false,
            },
          ],
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        name: 'Bob Smith',
        profile: {
          create: {
            bio: 'Full-stack developer and open source contributor',
          },
        },
        posts: {
          create: [
            {
              title: 'Modern Web Development',
              content: 'The web development landscape is constantly evolving...',
              published: true,
            },
          ],
        },
      },
    }),
  ]);
  
  console.log(\`✅ Created \${users.length} users with posts and profiles\`);
}

/**
 * Clean database (useful for testing)
 */
export async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  // Delete in correct order due to foreign key constraints
  await prisma.post.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✅ Database cleaned');
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const [userCount, postCount, profileCount] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.profile.count(),
  ]);
  
  return {
    users: userCount,
    posts: postCount,
    profiles: profileCount,
    publishedPosts: await prisma.post.count({ where: { published: true } }),
  };
}
`,
      overwrite: false,
    },
    
    // Seed script
    {
      path: 'prisma/seed.ts',
      template: `import { seedDatabase } from '../src/lib/db-utils';
import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
`,
      overwrite: false,
    },
    
    // Example migration (initial)
    {
      path: 'prisma/migrations/20231201000000_init/migration.sql',
      template: `-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Next.js API route for health check
    {
      path: 'src/app/api/db/health/route.ts',
      template: `import { NextResponse } from 'next/server';
import { checkDBHealth } from '@/lib/prisma';

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
      path: 'src/components/examples/prisma-example.tsx',
      template: `'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  _count?: {
    posts: number;
  };
}

export function PrismaExample() {
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
      <h2 className="text-xl font-semibold mb-4">Prisma Example</h2>
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
                {user._count && (
                  <div className="text-xs text-gray-400">{user._count.posts} posts</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        Powered by Prisma ORM
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
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:reset": "prisma migrate reset",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:push": "prisma db push"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
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

export const usersRouter = router({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search } = input;
      
      const users = await ctx.prisma.user.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        } : undefined,
        include: {
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      let nextCursor: typeof cursor | undefined = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem!.id;
      }
      
      return {
        users,
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        include: {
          profile: true,
          posts: {
            where: { published: true },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { posts: true },
          },
        },
      });
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      
      return user;
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      bio: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { bio, ...userData } = input;
      
      return ctx.prisma.user.create({
        data: {
          ...userData,
          profile: bio ? {
            create: { bio },
          } : undefined,
        },
        include: {
          profile: true,
        },
      });
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
      
      return ctx.prisma.user.update({
        where: { id },
        data: {
          ...userData,
          profile: bio !== undefined ? {
            upsert: {
              create: { bio },
              update: { bio },
            },
          } : undefined,
        },
        include: {
          profile: true,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.delete({
        where: { id: input.id },
      });
    }),
});
`,
          overwrite: false,
        },
        {
          path: 'src/server/trpc/routers/posts.ts',
          template: `import { z } from 'zod';
import { router, publicProcedure } from '../index';
import { TRPCError } from '@trpc/server';

export const postsRouter = router({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
      published: z.boolean().optional(),
      authorId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor, published, authorId } = input;
      
      const posts = await ctx.prisma.post.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          ...(published !== undefined && { published }),
          ...(authorId && { authorId }),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      let nextCursor: typeof cursor | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.id;
      }
      
      return {
        posts,
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: true,
            },
          },
        },
      });
      
      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }
      
      return post;
    }),

  create: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().optional(),
      published: z.boolean().default(false),
      authorId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.post.create({
        data: input,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      content: z.string().optional(),
      published: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      return ctx.prisma.post.update({
        where: { id },
        data,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.post.delete({
        where: { id: input.id },
      });
    }),

  publish: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.post.update({
        where: { id: input.id },
        data: { published: true },
      });
    }),

  unpublish: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.post.update({
        where: { id: input.id },
        data: { published: false },
      });
    }),
});
`,
          overwrite: false,
        },
      ],
    },
    
    {
      plugin: 'api-apollo',
      type: 'provider',
      files: [
        {
          path: 'src/graphql/resolvers/user.ts',
          template: `import { prisma } from '@/lib/prisma';
import { GraphQLError } from 'graphql';

export const userResolvers = {
  Query: {
    users: async (_: any, { limit = 10, cursor, search }: any) => {
      const users = await prisma.user.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        } : undefined,
        include: {
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      let nextCursor: string | null = null;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem!.id;
      }
      
      return {
        users,
        nextCursor,
      };
    },
    
    user: async (_: any, { id }: { id: string }) => {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
          posts: {
            where: { published: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      return user;
    },
  },
  
  Mutation: {
    createUser: async (_: any, { input }: any) => {
      const { bio, ...userData } = input;
      
      return prisma.user.create({
        data: {
          ...userData,
          profile: bio ? {
            create: { bio },
          } : undefined,
        },
        include: {
          profile: true,
        },
      });
    },
    
    updateUser: async (_: any, { id, input }: any) => {
      const { bio, ...userData } = input;
      
      return prisma.user.update({
        where: { id },
        data: {
          ...userData,
          profile: bio !== undefined ? {
            upsert: {
              create: { bio },
              update: { bio },
            },
          } : undefined,
        },
        include: {
          profile: true,
        },
      });
    },
    
    deleteUser: async (_: any, { id }: { id: string }) => {
      return prisma.user.delete({
        where: { id },
      });
    },
  },
  
  User: {
    postCount: async (parent: any) => {
      return prisma.post.count({
        where: { authorId: parent.id },
      });
    },
  },
};
`,
          overwrite: false,
        },
      ],
    },
    
    {
      plugin: 'auth-authjs',
      type: 'provider',
      files: [
        {
          path: 'src/lib/auth-prisma-adapter.ts',
          template: `import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authAdapter = PrismaAdapter(prisma);
`,
          overwrite: false,
        },
      ],
    },
  ],
  
  postInstall: `🚀 Prisma has been configured successfully!

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

2. Generate the Prisma client:
   \`npx prisma generate\`

3. Run your first migration:
   \`npx prisma migrate dev --name init\`

4. (Optional) Seed your database:
   \`npm run db:seed\`

5. Open Prisma Studio to explore your data:
   \`npx prisma studio\`

Available commands:
- \`npm run db:generate\` - Generate Prisma client
- \`npm run db:migrate\` - Run migrations in development
- \`npm run db:deploy\` - Deploy migrations to production
- \`npm run db:seed\` - Seed database with example data
- \`npm run db:studio\` - Open Prisma Studio
- \`npm run db:reset\` - Reset database and run migrations

{{#if (hasPlugin 'api-trpc')}}
✨ Prisma is now integrated with tRPC! Check out the generated user and post routers.
{{/if}}

{{#if (hasPlugin 'api-apollo')}}
✨ Prisma is now integrated with Apollo GraphQL! Check out the generated resolvers.
{{/if}}

Documentation: https://www.prisma.io/docs`,
});

export default dbPrismaPlugin;