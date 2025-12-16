/**
 * tRPC Plugin for Scaforge
 * End-to-end typesafe APIs with tRPC
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

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
      '@tanstack/react-query': '^5.0.0',
      'superjson': '^3.0.0',
    },
  },
  
  configSchema: z.object({
    batching: z.boolean().default(true),
    transformer: z.enum(['superjson', 'none']).default('superjson'),
    enableSubscriptions: z.boolean().default(false),
    cors: z.object({
      origin: z.string().default('http://localhost:3000'),
      credentials: z.boolean().default(true),
    }).optional(),
  }),
  
  files: [
    // Core tRPC setup
    {
      path: 'src/server/trpc/index.ts',
      template: `import { initTRPC, TRPCError } from '@trpc/server';
{{#if (eq options.transformer 'superjson')}}
import superjson from 'superjson';
{{/if}}
{{#if (hasPlugin 'auth-authjs')}}
import { auth } from '@/auth';
{{/if}}
{{#if (hasPlugin 'auth-clerk')}}
import { getAuth } from '@clerk/nextjs/server';
{{/if}}
{{#if (hasPlugin 'db-prisma')}}
import { prisma } from '@/lib/prisma';
{{/if}}

/**
 * Create context for tRPC
 */
export async function createContext(opts: { req?: any; res?: any }) {
  {{#if (hasPlugin 'auth-authjs')}}
  const session = await auth();
  {{/if}}
  {{#if (hasPlugin 'auth-clerk')}}
  const { userId } = getAuth(opts.req);
  {{/if}}
  
  return {
    {{#if (hasPlugin 'auth-authjs')}}
    session,
    user: session?.user,
    {{/if}}
    {{#if (hasPlugin 'auth-clerk')}}
    userId,
    {{/if}}
    {{#if (hasPlugin 'db-prisma')}}
    prisma,
    {{/if}}
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
{{#if (eq options.transformer 'superjson')}}
  transformer: superjson,
{{/if}}
{{#if options.batching}}
  allowOutsideOfServer: true,
{{/if}}
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;

{{#if (or (hasPlugin 'auth-authjs') (hasPlugin 'auth-clerk'))}}
/**
 * Protected procedure that requires authentication
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  {{#if (hasPlugin 'auth-authjs')}}
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  });
  {{/if}}
  {{#if (hasPlugin 'auth-clerk')}}
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
  {{/if}}
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
{{/if}}
`,
      overwrite: false,
    },
    
    // Example router
    {
      path: 'src/server/trpc/routers/example.ts',
      template: `import { z } from 'zod';
import { router, publicProcedure{{#if (or (hasPlugin 'auth-authjs') (hasPlugin 'auth-clerk'))}}, protectedProcedure{{/if}} } from '../index';

export const exampleRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return {
        greeting: \`Hello \${input.name ?? 'World'}!\`,
      };
    }),

  {{#if (hasPlugin 'db-prisma')}}
  getUsers: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.user.findMany({
        take: 10,
      });
    }),

  createUser: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.create({
        data: input,
      });
    }),
  {{/if}}

  {{#if (or (hasPlugin 'auth-authjs') (hasPlugin 'auth-clerk'))}}
  getProfile: protectedProcedure
    .query(({ ctx }) => {
      return {
        {{#if (hasPlugin 'auth-authjs')}}
        user: ctx.user,
        {{/if}}
        {{#if (hasPlugin 'auth-clerk')}}
        userId: ctx.userId,
        {{/if}}
      };
    }),
  {{/if}}
});
`,
      overwrite: false,
    },
    
    // Main app router
    {
      path: 'src/server/trpc/routers/index.ts',
      template: `import { router } from '../index';
import { exampleRouter } from './example';

/**
 * Main tRPC router
 * Add your routers here
 */
export const appRouter = router({
  example: exampleRouter,
});

export type AppRouter = typeof appRouter;
`,
      overwrite: false,
    },
    
    // Next.js API route
    {
      path: 'src/app/api/trpc/[trpc]/route.ts',
      template: `import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/routers';
import { createContext } from '@/server/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    {{#if options.cors}}
    responseMeta() {
      return {
        headers: {
          'Access-Control-Allow-Origin': '{{options.cors.origin}}',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          {{#if options.cors.credentials}}
          'Access-Control-Allow-Credentials': 'true',
          {{/if}}
        },
      };
    },
    {{/if}}
  });

export { handler as GET, handler as POST };
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Client setup for Next.js
    {
      path: 'src/lib/trpc/client.ts',
      template: `import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/trpc/routers';

export const trpc = createTRPCReact<AppRouter>();
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Provider for Next.js
    {
      path: 'src/lib/trpc/provider.tsx',
      template: `'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from './client';
{{#if (eq options.transformer 'superjson')}}
import superjson from 'superjson';
{{/if}}

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return \`https://\${process.env.VERCEL_URL}\`;
  return 'http://localhost:3000';
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: \`\${getBaseUrl()}/api/trpc\`,
          {{#if options.batching}}
          maxURLLength: 2083,
          {{/if}}
        }),
      ],
      {{#if (eq options.transformer 'superjson')}}
      transformer: superjson,
      {{/if}}
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // TanStack Start setup
    {
      path: 'app/server/trpc.ts',
      template: `import { createTRPCMsw } from 'msw-trpc';
import { appRouter } from '@/server/trpc/routers';

export const trpcMsw = createTRPCMsw(appRouter);
`,
      condition: { template: 'tanstack' },
      overwrite: false,
    },
    
    // Nuxt plugin
    {
      path: 'plugins/trpc.client.ts',
      template: `import { createTRPCNuxtClient, httpBatchLink } from 'trpc-nuxt/client';
import type { AppRouter } from '~/server/trpc/routers';
{{#if (eq options.transformer 'superjson')}}
import superjson from 'superjson';
{{/if}}

export default defineNuxtPlugin(() => {
  const { $trpc } = useNuxtApp();

  const client = createTRPCNuxtClient<AppRouter>({
    links: [
      httpBatchLink({
        url: '/api/trpc',
      }),
    ],
    {{#if (eq options.transformer 'superjson')}}
    transformer: superjson,
    {{/if}}
  });

  return {
    provide: {
      trpc: client,
    },
  };
});
`,
      condition: { template: 'nuxt' },
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/trpc-example.tsx',
      template: `'use client';

{{#if (eq template 'nextjs')}}
import { trpc } from '@/lib/trpc/client';
{{/if}}

export function TRPCExample() {
  {{#if (eq template 'nextjs')}}
  const { data, isLoading } = trpc.example.hello.useQuery({ name: 'tRPC' });
  {{#if (hasPlugin 'db-prisma')}}
  const { data: users } = trpc.example.getUsers.useQuery();
  {{/if}}
  {{/if}}

  {{#if (eq template 'nextjs')}}
  if (isLoading) return <div>Loading...</div>;
  {{/if}}

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4">tRPC Example</h2>
      {{#if (eq template 'nextjs')}}
      <p className="text-gray-600">{data?.greeting}</p>
      
      {{#if (hasPlugin 'db-prisma')}}
      <div className="mt-4">
        <h3 className="font-medium">Users:</h3>
        <ul className="mt-2 space-y-1">
          {users?.map((user) => (
            <li key={user.id} className="text-sm text-gray-500">
              {user.name} ({user.email})
            </li>
          ))}
        </ul>
      </div>
      {{/if}}
      {{else}}
      <p className="text-gray-600">tRPC is configured! Check the API routes.</p>
      {{/if}}
    </div>
  );
}
`,
      overwrite: false,
    },
  ],
  
  // Integrations with other plugins
  integrations: [
    {
      plugin: 'auth-authjs',
      type: 'middleware',
      files: [
        {
          path: 'src/server/trpc/middleware/auth.ts',
          template: `import { TRPCError } from '@trpc/server';
import { t } from '../index';

/**
 * Auth middleware for tRPC procedures
 */
export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  });
});

/**
 * Protected procedure that requires authentication
 */
export const protectedProcedure = t.procedure.use(authMiddleware);
`,
          overwrite: false,
        },
      ],
    },
    
    {
      plugin: 'auth-clerk',
      type: 'middleware',
      files: [
        {
          path: 'src/server/trpc/middleware/clerk-auth.ts',
          template: `import { TRPCError } from '@trpc/server';
import { t } from '../index';

/**
 * Clerk auth middleware for tRPC procedures
 */
export const clerkAuthMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/**
 * Protected procedure that requires Clerk authentication
 */
export const protectedProcedure = t.procedure.use(clerkAuthMiddleware);
`,
          overwrite: false,
        },
      ],
    },
    
    {
      plugin: 'db-prisma',
      type: 'provider',
      files: [
        {
          path: 'src/server/trpc/routers/users.ts',
          template: `import { z } from 'zod';
import { router, publicProcedure } from '../index';

export const usersRouter = router({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });
      
      let nextCursor: typeof input.cursor | undefined = undefined;
      if (users.length > input.limit) {
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
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.user.update({
        where: { id },
        data,
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
      ],
    },
  ],
  
  postInstall: `🚀 tRPC has been configured successfully!

Next steps:
1. {{#if (eq template 'nextjs')}}Wrap your app with TRPCProvider in your layout{{/if}}
2. Create your API procedures in src/server/trpc/routers/
3. Use the tRPC client in your components
4. {{#if (hasPlugin 'db-prisma')}}Check out the generated user router for database examples{{/if}}

Example usage:
{{#if (eq template 'nextjs')}}
\`\`\`tsx
import { trpc } from '@/lib/trpc/client';

function MyComponent() {
  const { data } = trpc.example.hello.useQuery({ name: 'World' });
  return <div>{data?.greeting}</div>;
}
\`\`\`
{{/if}}

Documentation: https://trpc.io/docs`,
});

export default apiTrpcPlugin;