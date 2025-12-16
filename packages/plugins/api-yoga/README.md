# @scaforge/plugin-api-yoga

GraphQL Yoga + Pothos plugin for Scaforge - Code-first GraphQL with excellent developer experience.

## Features

- 🏗️ **Code-First** - Define GraphQL schema with TypeScript
- 🔒 **Type Safety** - Full end-to-end type safety
- 🎯 **Zod Integration** - Input validation with Zod schemas
- 🚀 **Performance** - Built on GraphQL Yoga for excellent performance
- 🔌 **Integrations** - Seamless integration with auth and database plugins
- 📱 **Multi-Framework** - Support for Next.js, TanStack Start, and Nuxt
- 🛠 **Developer Experience** - GraphiQL playground and excellent tooling

## Installation

```bash
npx scaforge add api-yoga
```

## Configuration Options

- `playground` (boolean, default: true) - Enable GraphiQL playground
- `introspection` (boolean, default: true) - Enable GraphQL introspection
- `cors` (object, optional) - CORS configuration
- `maskedErrors` (boolean, default: false) - Mask error details in production

## Generated Files

### Core Files
- `src/server/graphql/builder.ts` - Pothos schema builder setup
- `src/server/graphql/types/index.ts` - Schema composition
- `src/server/graphql/types/user.ts` - User types and validation
- `src/server/graphql/types/query.ts` - Query definitions
- `src/server/graphql/types/mutation.ts` - Mutation definitions
- `src/server/graphql/server.ts` - GraphQL Yoga server

### Framework-Specific Files

#### Next.js
- `src/app/api/graphql/route.ts` - API route handler
- `src/lib/graphql/client.ts` - URQL client setup
- `src/lib/graphql/provider.tsx` - React provider
- `src/lib/graphql/operations.ts` - GraphQL operations

#### Nuxt
- `plugins/urql.client.ts` - Nuxt URQL plugin

### Examples
- `src/components/examples/yoga-example.tsx` - Usage example

## Integrations

### With Auth Plugins
When used with `auth-authjs` or `auth-clerk`, automatically generates:
- Authentication helpers and plugins
- Protected field utilities
- User context in GraphQL resolvers

### With Database Plugins
When used with `db-prisma`, automatically generates:
- Prisma plugin integration
- CRUD operations for User model
- Pagination helpers and utilities

## Usage

### Define Object Types

```typescript
// src/server/graphql/types/post.ts
import { builder } from '../builder';

builder.prismaObject('Post', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    content: t.exposeString('content'),
    published: t.exposeBoolean('published'),
    author: t.relation('author'),
    createdAt: t.expose('createdAt', {
      type: 'DateTime',
    }),
  }),
});
```

### Add Queries

```typescript
// src/server/graphql/types/query.ts
builder.queryFields((t) => ({
  posts: t.prismaField({
    type: ['Post'],
    args: {
      published: t.arg.boolean({ required: false }),
    },
    resolve: async (query, _, { published }, { prisma }) => {
      return prisma.post.findMany({
        ...query,
        where: published !== undefined ? { published } : undefined,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),
}));
```

### Add Mutations with Validation

```typescript
// src/server/graphql/types/mutation.ts
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
});

builder.mutationFields((t) => ({
  createPost: t.prismaField({
    type: 'Post',
    args: {
      input: t.arg({
        type: 'CreatePostInput',
        required: true,
      }),
    },
    validate: {
      schema: createPostSchema,
    },
    resolve: async (query, _, { input }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required');
      }
      
      return prisma.post.create({
        ...query,
        data: {
          ...input,
          authorId: user.id,
        },
      });
    },
  }),
}));
```

### Use in Components

```tsx
// Next.js example with URQL
import { useQuery, useMutation } from 'urql';
import { PostsQuery, CreatePostMutation } from '@/lib/graphql/operations';

function PostsList() {
  const [{ data, fetching }] = useQuery({
    query: PostsQuery,
    variables: { published: true },
  });

  const [, createPost] = useMutation(CreatePostMutation);

  const handleCreate = async () => {
    await createPost({
      input: {
        title: 'New Post',
        content: 'Post content...',
      },
    });
  };

  if (fetching) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleCreate}>Create Post</button>
      {data?.posts?.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}
```

## Key Concepts

### Pothos Builder
Pothos provides a code-first approach to GraphQL schema building with excellent TypeScript integration:

```typescript
// Type-safe field definitions
builder.queryField('user', (t) =>
  t.prismaField({
    type: 'User',
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: (query, _, { id }, { prisma }) =>
      prisma.user.findUnique({
        ...query,
        where: { id: String(id) },
      }),
  })
);
```

### Zod Validation
Input validation is handled automatically with Zod schemas:

```typescript
const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// Validation happens automatically
builder.mutationField('createUser', (t) =>
  t.prismaField({
    // ...
    validate: { schema: userSchema },
    // ...
  })
);
```

## GraphiQL Playground

When enabled, access the GraphiQL playground at:
- Development: `http://localhost:3000/api/graphql`
- Production: Disabled by default for security

## Documentation

- [GraphQL Yoga Documentation](https://the-guild.dev/graphql/yoga-server)
- [Pothos Documentation](https://pothos-graphql.dev/)
- [URQL Documentation](https://formidable.com/open-source/urql/)