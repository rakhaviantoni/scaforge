# @scaforge/plugin-api-apollo

Apollo GraphQL plugin for Scaforge - GraphQL API with Apollo Server and Client.

## Features

- 🚀 **GraphQL API** - Full-featured GraphQL server with Apollo Server
- 🔍 **Type Safety** - Generated TypeScript types from GraphQL schema
- 🎯 **Client Integration** - Apollo Client with React hooks
- 🔌 **Integrations** - Seamless integration with auth and database plugins
- 📱 **Multi-Framework** - Support for Next.js, TanStack Start, and Nuxt
- 🛠 **Developer Experience** - GraphQL Playground and introspection

## Installation

```bash
npx scaforge add api-apollo
```

## Configuration Options

- `introspection` (boolean, default: true) - Enable GraphQL introspection
- `playground` (boolean, default: true) - Enable GraphQL Playground
- `cors` (object, optional) - CORS configuration
- `csrfPrevention` (boolean, default: true) - Enable CSRF prevention

## Generated Files

### Core Files
- `src/server/graphql/schema/index.ts` - Schema composition
- `src/server/graphql/schema/typeDefs.ts` - GraphQL type definitions
- `src/server/graphql/schema/resolvers.ts` - GraphQL resolvers
- `src/server/graphql/types.ts` - TypeScript types
- `src/server/graphql/server.ts` - Apollo Server setup

### Framework-Specific Files

#### Next.js
- `src/app/api/graphql/route.ts` - API route handler
- `src/lib/apollo/client.ts` - Apollo Client setup
- `src/lib/apollo/provider.tsx` - React provider
- `src/lib/apollo/queries.ts` - GraphQL queries and mutations

#### Nuxt
- `plugins/apollo.client.ts` - Nuxt Apollo plugin

### Examples
- `src/components/examples/apollo-example.tsx` - Usage example

## Integrations

### With Auth Plugins
When used with `auth-authjs` or `auth-clerk`, automatically generates:
- Authentication middleware for resolvers
- User context in GraphQL resolvers
- Protected queries and mutations

### With Database Plugins
When used with `db-prisma`, automatically generates:
- Database client in GraphQL context
- CRUD resolvers for User model
- Type-safe database operations

## Usage

### Define Schema

```typescript
// src/server/graphql/schema/typeDefs.ts
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    posts: [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
  }

  input CreatePostInput {
    title: String!
    content: String!
  }
`;
```

### Add Resolvers

```typescript
// src/server/graphql/schema/resolvers.ts
export const resolvers: Resolvers = {
  Query: {
    posts: async (_, __, { prisma }) => {
      return prisma.post.findMany({
        include: { author: true },
      });
    },
    
    post: async (_, { id }, { prisma }) => {
      return prisma.post.findUnique({
        where: { id },
        include: { author: true },
      });
    },
  },

  Mutation: {
    createPost: async (_, { input }, { prisma, user }) => {
      if (!user) throw new GraphQLError('Not authenticated');
      
      return prisma.post.create({
        data: {
          ...input,
          authorId: user.id,
        },
        include: { author: true },
      });
    },
  },
};
```

### Use in Components

```tsx
// Next.js example
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_POSTS = gql`
  query GetPosts {
    posts {
      id
      title
      content
      author {
        name
      }
    }
  }
`;

function PostsList() {
  const { data, loading, error } = useQuery(GET_POSTS);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.posts?.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <small>By {post.author.name}</small>
        </article>
      ))}
    </div>
  );
}
```

## GraphQL Playground

When enabled, access the GraphQL Playground at:
- Development: `http://localhost:3000/api/graphql`
- Production: Disabled by default for security

## Documentation

- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [GraphQL Documentation](https://graphql.org/learn/)