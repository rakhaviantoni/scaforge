/**
 * Sample Plugin Definitions
 * These are example plugins for testing and demonstration
 */
import { z } from 'zod';
import { definePlugin } from './types';
import type { PluginDefinition } from './types';

/**
 * Sample API plugins
 */
export const apiTrpcPlugin = definePlugin({
  name: 'api-trpc',
  displayName: 'tRPC',
  category: 'api',
  description: 'End-to-end typesafe APIs with tRPC',
  version: '1.0.0',
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt'],
  packages: {
    dependencies: {
      '@trpc/server': '^11.0.0',
      '@trpc/client': '^11.0.0',
      '@trpc/react-query': '^11.0.0',
      'superjson': '^3.0.0',
    },
  },
  configSchema: z.object({
    batching: z.boolean().default(true),
    transformer: z.enum(['superjson', 'none']).default('superjson'),
    enableSubscriptions: z.boolean().default(false),
  }),
  files: [
    {
      path: 'src/server/trpc/index.ts',
      template: `import { initTRPC } from '@trpc/server';
{{#if (eq options.transformer 'superjson')}}
import superjson from 'superjson';
{{/if}}

const t = initTRPC.create({
{{#if (eq options.transformer 'superjson')}}
  transformer: superjson,
{{/if}}
});

export const router = t.router;
export const publicProcedure = t.procedure;
`,
      overwrite: false,
    },
  ],
  postInstall: `tRPC has been configured!

Next steps:
1. Create your routers in src/server/trpc/routers/
2. Import and use the tRPC client in your components
3. Check the example router for patterns`,
});

export const apiApolloPlugin = definePlugin({
  name: 'api-apollo',
  displayName: 'Apollo GraphQL',
  category: 'api',
  description: 'GraphQL API with Apollo Server',
  version: '1.0.0',
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt'],
  packages: {
    dependencies: {
      '@apollo/server': '^4.0.0',
      'graphql': '^16.0.0',
    },
  },
  files: [
    {
      path: 'src/server/graphql/index.ts',
      template: `import { ApolloServer } from '@apollo/server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

export const server = new ApolloServer({
  typeDefs,
  resolvers,
});
`,
      overwrite: false,
    },
  ],
  postInstall: 'Apollo GraphQL server configured!',
});

/**
 * Sample Auth plugins
 */
export const authClerkPlugin = definePlugin({
  name: 'auth-clerk',
  displayName: 'Clerk',
  category: 'auth',
  description: 'Complete authentication solution with Clerk',
  version: '1.0.0',
  supportedTemplates: ['nextjs', 'tanstack'],
  packages: {
    dependencies: {
      '@clerk/nextjs': '^5.0.0',
    },
  },
  envVars: [
    {
      name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      description: 'Clerk publishable key',
      required: true,
      secret: false,
    },
    {
      name: 'CLERK_SECRET_KEY',
      description: 'Clerk secret key',
      required: true,
      secret: true,
    },
  ],
  files: [
    {
      path: 'src/middleware.ts',
      template: `import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
`,
      overwrite: false,
    },
  ],
  postInstall: `Clerk authentication configured!

Next steps:
1. Add your Clerk keys to .env.local
2. Wrap your app with ClerkProvider
3. Use Clerk components for sign-in/sign-up`,
});

export const authAuthjsPlugin = definePlugin({
  name: 'auth-authjs',
  displayName: 'Auth.js',
  category: 'auth',
  description: 'Authentication with Auth.js (NextAuth)',
  version: '1.0.0',
  supportedTemplates: ['nextjs'],
  packages: {
    dependencies: {
      'next-auth': '^5.0.0',
    },
  },
  envVars: [
    {
      name: 'AUTH_SECRET',
      description: 'Auth.js secret key',
      required: true,
      secret: true,
    },
  ],
  files: [
    {
      path: 'src/auth.ts',
      template: `import NextAuth from 'next-auth';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [],
});
`,
      overwrite: false,
    },
  ],
  postInstall: 'Auth.js configured! Add providers in src/auth.ts',
});

/**
 * Sample Database plugins
 */
export const dbPrismaPlugin = definePlugin({
  name: 'db-prisma',
  displayName: 'Prisma',
  category: 'database',
  description: 'Type-safe database client with Prisma',
  version: '1.0.0',
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  packages: {
    dependencies: {
      '@prisma/client': '^5.0.0',
    },
    devDependencies: {
      'prisma': '^5.0.0',
    },
  },
  envVars: [
    {
      name: 'DATABASE_URL',
      description: 'Database connection URL',
      required: true,
      secret: true,
    },
  ],
  files: [
    {
      path: 'prisma/schema.prisma',
      template: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`,
      overwrite: false,
    },
    {
      path: 'src/lib/prisma.ts',
      template: `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
`,
      overwrite: false,
    },
  ],
  postInstall: `Prisma configured!

Next steps:
1. Set DATABASE_URL in your .env file
2. Run "npx prisma migrate dev" to create your database
3. Use the prisma client in your code`,
});

/**
 * Sample CMS plugins
 */
export const cmsSanityPlugin = definePlugin({
  name: 'cms-sanity',
  displayName: 'Sanity',
  category: 'cms',
  description: 'Headless CMS with Sanity',
  version: '1.0.0',
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt'],
  packages: {
    dependencies: {
      '@sanity/client': '^6.0.0',
      '@sanity/image-url': '^1.0.0',
    },
  },
  envVars: [
    {
      name: 'NEXT_PUBLIC_SANITY_PROJECT_ID',
      description: 'Sanity project ID',
      required: true,
      secret: false,
    },
    {
      name: 'NEXT_PUBLIC_SANITY_DATASET',
      description: 'Sanity dataset name',
      required: true,
      secret: false,
    },
  ],
  files: [
    {
      path: 'src/lib/sanity.ts',
      template: `import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: true,
  apiVersion: '2024-01-01',
});

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}
`,
      overwrite: false,
    },
  ],
  postInstall: 'Sanity CMS configured! Set up your project ID and dataset.',
});

/**
 * All sample plugins
 */
export const samplePlugins: PluginDefinition[] = [
  apiTrpcPlugin,
  apiApolloPlugin,
  authClerkPlugin,
  authAuthjsPlugin,
  dbPrismaPlugin,
  cmsSanityPlugin,
];