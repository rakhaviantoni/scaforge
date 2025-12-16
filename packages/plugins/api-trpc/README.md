# @scaforge/plugin-api-trpc

tRPC plugin for Scaforge - End-to-end typesafe APIs with tRPC.

## Features

- 🔒 **Type Safety** - End-to-end type safety from server to client
- 🚀 **Performance** - Built-in request batching and caching
- 🔌 **Integrations** - Seamless integration with auth and database plugins
- 📱 **Multi-Framework** - Support for Next.js, TanStack Start, and Nuxt
- 🛠 **Developer Experience** - Excellent TypeScript support and tooling

## Installation

```bash
npx scaforge add api-trpc
```

## Configuration Options

- `batching` (boolean, default: true) - Enable request batching
- `transformer` ('superjson' | 'none', default: 'superjson') - Data transformer
- `enableSubscriptions` (boolean, default: false) - Enable WebSocket subscriptions
- `cors` (object, optional) - CORS configuration

## Generated Files

### Core Files
- `src/server/trpc/index.ts` - tRPC initialization and context
- `src/server/trpc/routers/index.ts` - Main router
- `src/server/trpc/routers/example.ts` - Example procedures

### Framework-Specific Files

#### Next.js
- `src/app/api/trpc/[trpc]/route.ts` - API route handler
- `src/lib/trpc/client.ts` - tRPC React client
- `src/lib/trpc/provider.tsx` - React Query provider

#### TanStack Start
- `app/server/trpc.ts` - Server setup

#### Nuxt
- `plugins/trpc.client.ts` - Nuxt plugin

### Examples
- `src/components/examples/trpc-example.tsx` - Usage example

## Integrations

### With Auth Plugins
When used with `auth-authjs` or `auth-clerk`, automatically generates:
- Authentication middleware
- Protected procedures
- User context in tRPC procedures

### With Database Plugins
When used with `db-prisma`, automatically generates:
- Database client in tRPC context
- Example CRUD procedures
- Pagination helpers

## Usage

### Define Procedures

```typescript
// src/server/trpc/routers/posts.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../index';

export const postsRouter = router({
  getAll: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.post.findMany({
        take: input.limit,
      });
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.post.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
      });
    }),
});
```

### Use in Components

```tsx
// Next.js example
import { trpc } from '@/lib/trpc/client';

function PostsList() {
  const { data: posts, isLoading } = trpc.posts.getAll.useQuery({ limit: 5 });
  const createPost = trpc.posts.create.useMutation();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {posts?.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

## Documentation

- [tRPC Documentation](https://trpc.io/docs)
- [React Query Integration](https://trpc.io/docs/client/react)
- [Server-Side Usage](https://trpc.io/docs/server/introduction)