/**
 * GraphQL Yoga + Pothos Plugin for Scaforge
 * Code-first GraphQL with excellent developer experience
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const apiYogaPlugin = definePlugin({
  name: 'api-yoga',
  displayName: 'GraphQL Yoga + Pothos',
  category: 'api',
  description: 'Code-first GraphQL with GraphQL Yoga and Pothos',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt'],
  
  packages: {
    dependencies: {
      'graphql-yoga': '^5.0.0',
      '@pothos/core': '^4.0.0',
      '@pothos/plugin-zod': '^4.0.0',
      'graphql': '^16.0.0',
      'zod': '^3.22.0',
    },
  },
  
  configSchema: z.object({
    playground: z.boolean().default(true),
    introspection: z.boolean().default(true),
    cors: z.object({
      origin: z.string().default('http://localhost:3000'),
      credentials: z.boolean().default(true),
    }).optional(),
    maskedErrors: z.boolean().default(false),
  }),
  
  files: [
    // Pothos Schema Builder
    {
      path: 'src/server/graphql/builder.ts',
      template: `import SchemaBuilder from '@pothos/core';
import ZodPlugin from '@pothos/plugin-zod';
{{#if (hasPlugin 'db-prisma')}}
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
import { prisma } from '@/lib/prisma';
{{/if}}
{{#if (hasPlugin 'auth-authjs')}}
import type { Session } from 'next-auth';
{{/if}}

export interface Context {
  {{#if (hasPlugin 'auth-authjs')}}
  session?: Session | null;
  user?: Session['user'] | null;
  {{/if}}
  {{#if (hasPlugin 'auth-clerk')}}
  userId?: string | null;
  {{/if}}
  {{#if (hasPlugin 'db-prisma')}}
  prisma: typeof prisma;
  {{/if}}
}

export const builder = new SchemaBuilder<{
  Context: Context;
  {{#if (hasPlugin 'db-prisma')}}
  PrismaTypes: PrismaTypes;
  {{/if}}
}>({
  plugins: [
    ZodPlugin,
    {{#if (hasPlugin 'db-prisma')}}
    PrismaPlugin,
    {{/if}}
  ],
  {{#if (hasPlugin 'db-prisma')}}
  prisma: {
    client: prisma,
  },
  {{/if}}
  zod: {
    // Configure Zod integration
  },
});

// Add scalar types
builder.queryType({});
builder.mutationType({});
`,
      overwrite: false,
    },
    
    // Base types
    {
      path: 'src/server/graphql/types/index.ts',
      template: `import { builder } from '../builder';

// Export all types
export * from './user';
export * from './query';
export * from './mutation';

// Build the schema
export const schema = builder.toSchema();
`,
      overwrite: false,
    },
    
    // User types (if Prisma is available)
    {
      path: 'src/server/graphql/types/user.ts',
      template: `import { builder } from '../builder';
{{#if (hasPlugin 'db-prisma')}}
import { z } from 'zod';

// User object type
builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name', { nullable: true }),
    email: t.exposeString('email'),
    createdAt: t.expose('createdAt', {
      type: 'DateTime',
    }),
    updatedAt: t.expose('updatedAt', {
      type: 'DateTime',
    }),
  }),
});

// Input types
const CreateUserInput = builder.inputType('CreateUserInput', {
  fields: (t) => ({
    name: t.string({ required: false }),
    email: t.string({ required: true }),
  }),
});

const UpdateUserInput = builder.inputType('UpdateUserInput', {
  fields: (t) => ({
    name: t.string({ required: false }),
    email: t.string({ required: false }),
  }),
});

// Zod schemas for validation
export const createUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});
{{else}}
// User type placeholder (no database plugin)
builder.objectType('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name', { nullable: true }),
    email: t.exposeString('email'),
  }),
});
{{/if}}

// DateTime scalar
builder.scalarType('DateTime', {
  serialize: (date) => date.toISOString(),
  parseValue: (value) => {
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new Error('Invalid date');
  },
});
`,
      overwrite: false,
    },
    
    // Query types
    {
      path: 'src/server/graphql/types/query.ts',
      template: `import { builder } from '../builder';
{{#if (hasPlugin 'db-prisma')}}
import { GraphQLError } from 'graphql';
{{/if}}

builder.queryFields((t) => ({
  hello: t.string({
    args: {
      name: t.arg.string({ required: false }),
    },
    resolve: (_, { name }) => \`Hello \${name || 'World'}!\`,
  }),

  {{#if (hasPlugin 'db-prisma')}}
  users: t.prismaField({
    type: ['User'],
    resolve: async (query, _, __, { prisma }) => {
      return prisma.user.findMany({
        ...query,
        orderBy: { createdAt: 'desc' },
      });
    },
  }),

  user: t.prismaField({
    type: 'User',
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (query, _, { id }, { prisma }) => {
      return prisma.user.findUnique({
        ...query,
        where: { id: String(id) },
      });
    },
  }),
  {{/if}}

  {{#if (or (hasPlugin 'auth-authjs') (hasPlugin 'auth-clerk'))}}
  me: t.field({
    type: 'User',
    nullable: true,
    resolve: async (_, __, context) => {
      {{#if (hasPlugin 'auth-authjs')}}
      if (!context.session?.user) {
        return null;
      }
      return context.session.user;
      {{/if}}
      {{#if (hasPlugin 'auth-clerk')}}
      if (!context.userId) {
        return null;
      }
      // Return user data based on userId
      return context.prisma.user.findUnique({
        where: { id: context.userId },
      });
      {{/if}}
    },
  }),
  {{/if}}
}));
`,
      overwrite: false,
    },
    
    // Mutation types
    {
      path: 'src/server/graphql/types/mutation.ts',
      template: `import { builder } from '../builder';
{{#if (hasPlugin 'db-prisma')}}
import { GraphQLError } from 'graphql';
import { createUserSchema, updateUserSchema } from './user';
{{/if}}

builder.mutationFields((t) => ({
  {{#if (hasPlugin 'db-prisma')}}
  createUser: t.prismaField({
    type: 'User',
    args: {
      input: t.arg({
        type: 'CreateUserInput',
        required: true,
      }),
    },
    validate: {
      schema: createUserSchema,
    },
    resolve: async (query, _, { input }, { prisma }) => {
      return prisma.user.create({
        ...query,
        data: input,
      });
    },
  }),

  updateUser: t.prismaField({
    type: 'User',
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({
        type: 'UpdateUserInput',
        required: true,
      }),
    },
    validate: {
      schema: updateUserSchema,
    },
    resolve: async (query, _, { id, input }, { prisma }) => {
      const user = await prisma.user.findUnique({
        where: { id: String(id) },
      });

      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return prisma.user.update({
        ...query,
        where: { id: String(id) },
        data: input,
      });
    },
  }),

  deleteUser: t.boolean({
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, { id }, { prisma }) => {
      const user = await prisma.user.findUnique({
        where: { id: String(id) },
      });

      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await prisma.user.delete({
        where: { id: String(id) },
      });

      return true;
    },
  }),
  {{else}}
  // Placeholder mutation (no database plugin)
  echo: t.string({
    args: {
      message: t.arg.string({ required: true }),
    },
    resolve: (_, { message }) => \`Echo: \${message}\`,
  }),
  {{/if}}
}));
`,
      overwrite: false,
    },
    
    // GraphQL Yoga server
    {
      path: 'src/server/graphql/server.ts',
      template: `import { createYoga } from 'graphql-yoga';
import { schema } from './types';
{{#if (hasPlugin 'auth-authjs')}}
import { auth } from '@/auth';
{{/if}}
{{#if (hasPlugin 'auth-clerk')}}
import { getAuth } from '@clerk/nextjs/server';
{{/if}}
{{#if (hasPlugin 'db-prisma')}}
import { prisma } from '@/lib/prisma';
{{/if}}

export const yoga = createYoga({
  schema,
  {{#if options.playground}}
  graphiql: {
    title: 'Scaforge GraphQL API',
  },
  {{/if}}
  {{#if options.cors}}
  cors: {
    origin: '{{options.cors.origin}}',
    credentials: {{options.cors.credentials}},
  },
  {{/if}}
  {{#if options.maskedErrors}}
  maskedErrors: true,
  {{/if}}
  context: async ({ request }) => {
    {{#if (hasPlugin 'auth-authjs')}}
    const session = await auth();
    {{/if}}
    {{#if (hasPlugin 'auth-clerk')}}
    const { userId } = getAuth(request);
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
  },
});
`,
      overwrite: false,
    },
    
    // Next.js API route
    {
      path: 'src/app/api/graphql/route.ts',
      template: `import { yoga } from '@/server/graphql/server';

export { yoga as GET, yoga as POST };
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Client setup (using urql for better Yoga integration)
    {
      path: 'src/lib/graphql/client.ts',
      template: `import { Client, cacheExchange, fetchExchange } from 'urql';

export const graphqlClient = new Client({
  url: '/api/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    return {
      headers: {
        // Add auth headers if needed
      },
    };
  },
});
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // URQL Provider
    {
      path: 'src/lib/graphql/provider.tsx',
      template: `'use client';

import { Provider } from 'urql';
import { graphqlClient } from './client';

export function GraphQLProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider value={graphqlClient}>
      {children}
    </Provider>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // GraphQL operations
    {
      path: 'src/lib/graphql/operations.ts',
      template: `import { gql } from 'urql';

export const HelloQuery = gql\`
  query Hello($name: String) {
    hello(name: $name)
  }
\`;

{{#if (hasPlugin 'db-prisma')}}
export const UsersQuery = gql\`
  query Users {
    users {
      id
      name
      email
      createdAt
    }
  }
\`;

export const UserQuery = gql\`
  query User($id: ID!) {
    user(id: $id) {
      id
      name
      email
      createdAt
      updatedAt
    }
  }
\`;

export const CreateUserMutation = gql\`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
      createdAt
    }
  }
\`;

export const UpdateUserMutation = gql\`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      updatedAt
    }
  }
\`;

export const DeleteUserMutation = gql\`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
\`;
{{/if}}

{{#if (or (hasPlugin 'auth-authjs') (hasPlugin 'auth-clerk'))}}
export const MeQuery = gql\`
  query Me {
    me {
      id
      name
      email
    }
  }
\`;
{{/if}}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/yoga-example.tsx',
      template: `'use client';

{{#if (eq template 'nextjs')}}
import { useQuery, useMutation } from 'urql';
import { HelloQuery{{#if (hasPlugin 'db-prisma')}}, UsersQuery, CreateUserMutation{{/if}} } from '@/lib/graphql/operations';
{{/if}}

export function YogaExample() {
  {{#if (eq template 'nextjs')}}
  const [{ data, fetching, error }] = useQuery({
    query: HelloQuery,
    variables: { name: 'Yoga' },
  });

  {{#if (hasPlugin 'db-prisma')}}
  const [{ data: usersData }] = useQuery({
    query: UsersQuery,
  });

  const [, createUser] = useMutation(CreateUserMutation);

  const handleCreateUser = async () => {
    try {
      await createUser({
        input: {
          name: 'New User',
          email: 'user@example.com',
        },
      });
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };
  {{/if}}

  if (fetching) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  {{/if}}

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4">GraphQL Yoga + Pothos Example</h2>
      {{#if (eq template 'nextjs')}}
      <p className="text-gray-600">{data?.hello}</p>
      
      {{#if (hasPlugin 'db-prisma')}}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Users:</h3>
          <button
            onClick={handleCreateUser}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Add User
          </button>
        </div>
        <ul className="space-y-1">
          {usersData?.users?.map((user: any) => (
            <li key={user.id} className="text-sm text-gray-500">
              {user.name} ({user.email})
            </li>
          ))}
        </ul>
      </div>
      {{/if}}
      {{else}}
      <p className="text-gray-600">GraphQL Yoga + Pothos is configured! Check /api/graphql</p>
      {{/if}}
    </div>
  );
}
`,
      overwrite: false,
    },
    
    // Nuxt plugin
    {
      path: 'plugins/urql.client.ts',
      template: `import { Client, cacheExchange, fetchExchange, provideClient } from '@urql/vue';

export default defineNuxtPlugin(() => {
  const client = new Client({
    url: '/api/graphql',
    exchanges: [cacheExchange, fetchExchange],
  });

  provideClient(client);
});
`,
      condition: { template: 'nuxt' },
      overwrite: false,
    },
  ],
  
  // Integrations with other plugins
  integrations: [
    {
      plugin: 'db-prisma',
      type: 'provider',
      files: [
        {
          path: 'src/server/graphql/types/prisma-utils.ts',
          template: `import { builder } from '../builder';
import { GraphQLError } from 'graphql';

// Helper for authenticated operations
export function requireAuth(context: any) {
  if (!context.session?.user && !context.userId) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.session?.user || context.userId;
}

// Pagination helpers
export const PaginationInput = builder.inputType('PaginationInput', {
  fields: (t) => ({
    take: t.int({ required: false, defaultValue: 10 }),
    skip: t.int({ required: false, defaultValue: 0 }),
  }),
});

export const PageInfo = builder.objectType('PageInfo', {
  fields: (t) => ({
    hasNextPage: t.exposeBoolean('hasNextPage'),
    hasPreviousPage: t.exposeBoolean('hasPreviousPage'),
    startCursor: t.exposeString('startCursor', { nullable: true }),
    endCursor: t.exposeString('endCursor', { nullable: true }),
  }),
});
`,
          overwrite: false,
        },
      ],
    },
    
    {
      plugin: 'auth-authjs',
      type: 'middleware',
      files: [
        {
          path: 'src/server/graphql/plugins/auth.ts',
          template: `import { builder } from '../builder';
import { GraphQLError } from 'graphql';

// Auth plugin for Pothos
export const AuthPlugin = builder.createContextualType('AuthUser', {
  nullable: false,
  resolve: (context) => {
    if (!context.session?.user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    return context.session.user;
  },
});

// Helper to create protected fields
export function createProtectedField<T>(
  fieldBuilder: any,
  config: any
) {
  return fieldBuilder({
    ...config,
    resolve: async (parent: any, args: any, context: any, info: any) => {
      if (!context.session?.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return config.resolve(parent, args, context, info);
    },
  });
}
`,
          overwrite: false,
        },
      ],
    },
  ],
  
  postInstall: `🚀 GraphQL Yoga + Pothos has been configured successfully!

Next steps:
1. {{#if (eq template 'nextjs')}}Wrap your app with GraphQLProvider in your layout{{/if}}
2. Define your schema using Pothos in src/server/graphql/types/
3. Add new object types and fields as needed
4. {{#if (hasPlugin 'db-prisma')}}Check out the generated Prisma integration{{/if}}

GraphQL Playground: {{#if options.playground}}http://localhost:3000/api/graphql{{else}}Disabled{{/if}}

Key features:
- 🏗️ **Code-first** - Define schema with TypeScript
- 🔒 **Type-safe** - Full TypeScript integration
- 🎯 **Zod validation** - Input validation with Zod schemas
- {{#if (hasPlugin 'db-prisma')}}🗄️ **Prisma integration** - Seamless database operations{{/if}}

Example usage:
{{#if (eq template 'nextjs')}}
\`\`\`tsx
import { useQuery } from 'urql';
import { HelloQuery } from '@/lib/graphql/operations';

function MyComponent() {
  const [{ data, fetching }] = useQuery({
    query: HelloQuery,
    variables: { name: 'World' }
  });
  
  if (fetching) return <div>Loading...</div>;
  return <div>{data?.hello}</div>;
}
\`\`\`
{{/if}}

Documentation: 
- https://the-guild.dev/graphql/yoga-server
- https://pothos-graphql.dev/`,
});

export default apiYogaPlugin;