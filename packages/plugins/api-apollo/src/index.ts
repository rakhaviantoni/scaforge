/**
 * Apollo GraphQL Plugin for Scaforge
 * GraphQL API with Apollo Server and Client
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const apiApolloPlugin = definePlugin({
  name: 'api-apollo',
  displayName: 'Apollo GraphQL',
  category: 'api',
  description: 'GraphQL API with Apollo Server and Client',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt'],
  
  packages: {
    dependencies: {
      '@apollo/server': '^4.0.0',
      '@apollo/client': '^3.8.0',
      'graphql': '^16.0.0',
      'graphql-tag': '^2.12.0',
      '@graphql-tools/schema': '^10.0.0',
    },
  },
  
  configSchema: z.object({
    introspection: z.boolean().default(true),
    playground: z.boolean().default(true),
    cors: z.object({
      origin: z.string().default('http://localhost:3000'),
      credentials: z.boolean().default(true),
    }).optional(),
    csrfPrevention: z.boolean().default(true),
  }),
  
  files: [
    // GraphQL Schema
    {
      path: 'src/server/graphql/schema/index.ts',
      template: `import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export * from './typeDefs';
export * from './resolvers';
`,
      overwrite: false,
    },
    
    // Type Definitions
    {
      path: 'src/server/graphql/schema/typeDefs.ts',
      template: `import { gql } from 'graphql-tag';

export const typeDefs = gql\`
  type Query {
    hello(name: String): String!
    {{#if (hasPlugin 'db-prisma')}}
    users: [User!]!
    user(id: ID!): User
    {{/if}}
    {{#if (or (hasPlugin 'auth-authjs') (hasPlugin 'auth-clerk'))}}
    me: User
    {{/if}}
  }

  type Mutation {
    {{#if (hasPlugin 'db-prisma')}}
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    {{/if}}
  }

  {{#if (hasPlugin 'db-prisma')}}
  type User {
    id: ID!
    name: String
    email: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateUserInput {
    name: String
    email: String!
  }

  input UpdateUserInput {
    name: String
    email: String
  }
  {{/if}}
\`;
`,
      overwrite: false,
    },
    
    // Resolvers
    {
      path: 'src/server/graphql/schema/resolvers.ts',
      template: `import type { Resolvers } from '../types';
{{#if (hasPlugin 'db-prisma')}}
import { prisma } from '@/lib/prisma';
{{/if}}

export const resolvers: Resolvers = {
  Query: {
    hello: (_, { name }) => \`Hello \${name || 'World'}!\`,
    
    {{#if (hasPlugin 'db-prisma')}}
    users: async () => {
      return prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    },
    
    user: async (_, { id }) => {
      return prisma.user.findUnique({
        where: { id },
      });
    },
    {{/if}}
    
    {{#if (or (hasPlugin 'auth-authjs') (hasPlugin 'auth-clerk'))}}
    me: async (_, __, { user, userId }) => {
      {{#if (hasPlugin 'auth-authjs')}}
      if (!user) throw new Error('Not authenticated');
      return user;
      {{/if}}
      {{#if (hasPlugin 'auth-clerk')}}
      if (!userId) throw new Error('Not authenticated');
      return prisma.user.findUnique({ where: { id: userId } });
      {{/if}}
    },
    {{/if}}
  },

  {{#if (hasPlugin 'db-prisma')}}
  Mutation: {
    createUser: async (_, { input }) => {
      return prisma.user.create({
        data: input,
      });
    },
    
    updateUser: async (_, { id, input }) => {
      return prisma.user.update({
        where: { id },
        data: input,
      });
    },
    
    deleteUser: async (_, { id }) => {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    },
  },
  {{/if}}
};
`,
      overwrite: false,
    },
    
    // GraphQL Types
    {
      path: 'src/server/graphql/types.ts',
      template: `import type { GraphQLResolveInfo } from 'graphql';
{{#if (hasPlugin 'auth-authjs')}}
import type { Session } from 'next-auth';
{{/if}}
{{#if (hasPlugin 'db-prisma')}}
import type { PrismaClient } from '@prisma/client';
{{/if}}

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Context = {
  {{#if (hasPlugin 'auth-authjs')}}
  session?: Session | null;
  user?: Session['user'] | null;
  {{/if}}
  {{#if (hasPlugin 'auth-clerk')}}
  userId?: string | null;
  {{/if}}
  {{#if (hasPlugin 'db-prisma')}}
  prisma: PrismaClient;
  {{/if}}
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export type Resolvers<ContextType = Context> = {
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  {{#if (hasPlugin 'db-prisma')}}
  User?: UserResolvers<ContextType>;
  {{/if}}
};

export type QueryResolvers<ContextType = Context> = {
  hello?: Resolver<ResolverTypeWrapper<Scalars['String']>, {}, ContextType, { name?: InputMaybe<Scalars['String']> }>;
  {{#if (hasPlugin 'db-prisma')}}
  users?: Resolver<Array<ResolverTypeWrapper<User>>, {}, ContextType>;
  user?: Resolver<Maybe<ResolverTypeWrapper<User>>, {}, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  {{/if}}
  {{#if (or (hasPlugin 'auth-authjs') (hasPlugin 'auth-clerk'))}}
  me?: Resolver<Maybe<ResolverTypeWrapper<User>>, {}, ContextType>;
  {{/if}}
};

{{#if (hasPlugin 'db-prisma')}}
export type MutationResolvers<ContextType = Context> = {
  createUser?: Resolver<ResolverTypeWrapper<User>, {}, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  updateUser?: Resolver<ResolverTypeWrapper<User>, {}, ContextType, RequireFields<MutationUpdateUserArgs, 'id' | 'input'>>;
  deleteUser?: Resolver<ResolverTypeWrapper<Scalars['Boolean']>, {}, ContextType, RequireFields<MutationDeleteUserArgs, 'id'>>;
};

export type User = {
  __typename?: 'User';
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  email: Scalars['String'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type UserResolvers<ContextType = Context> = {
  id?: Resolver<ResolverTypeWrapper<Scalars['ID']>, User, ContextType>;
  name?: Resolver<Maybe<ResolverTypeWrapper<Scalars['String']>>, User, ContextType>;
  email?: Resolver<ResolverTypeWrapper<Scalars['String']>, User, ContextType>;
  createdAt?: Resolver<ResolverTypeWrapper<Scalars['String']>, User, ContextType>;
  updatedAt?: Resolver<ResolverTypeWrapper<Scalars['String']>, User, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<User, ContextType>;
};

export type CreateUserInput = {
  name?: InputMaybe<Scalars['String']>;
  email: Scalars['String'];
};

export type UpdateUserInput = {
  name?: InputMaybe<Scalars['String']>;
  email?: InputMaybe<Scalars['String']>;
};

export type QueryUserArgs = {
  id: Scalars['ID'];
};

export type MutationCreateUserArgs = {
  input: CreateUserInput;
};

export type MutationUpdateUserArgs = {
  id: Scalars['ID'];
  input: UpdateUserInput;
};

export type MutationDeleteUserArgs = {
  id: Scalars['ID'];
};
{{/if}}
`,
      overwrite: false,
    },
    
    // Apollo Server setup
    {
      path: 'src/server/graphql/server.ts',
      template: `import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@apollo/server/integrations/next';
import { schema } from './schema';
{{#if (hasPlugin 'auth-authjs')}}
import { auth } from '@/auth';
{{/if}}
{{#if (hasPlugin 'auth-clerk')}}
import { getAuth } from '@clerk/nextjs/server';
{{/if}}
{{#if (hasPlugin 'db-prisma')}}
import { prisma } from '@/lib/prisma';
{{/if}}

const server = new ApolloServer({
  schema,
  {{#if options.introspection}}
  introspection: true,
  {{/if}}
  {{#if options.csrfPrevention}}
  csrfPrevention: true,
  {{/if}}
});

export default startServerAndCreateNextHandler(server, {
  context: async (req, res) => {
    {{#if (hasPlugin 'auth-authjs')}}
    const session = await auth();
    {{/if}}
    {{#if (hasPlugin 'auth-clerk')}}
    const { userId } = getAuth(req);
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
      template: `import apolloServer from '@/server/graphql/server';

export { apolloServer as GET, apolloServer as POST };
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Apollo Client setup
    {
      path: 'src/lib/apollo/client.ts',
      template: `import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: '/api/graphql',
});

{{#if (or (hasPlugin 'auth-authjs') (hasPlugin 'auth-clerk'))}}
const authLink = setContext((_, { headers }) => {
  // Add auth headers if needed
  return {
    headers: {
      ...headers,
      // Add authorization header here if using token-based auth
    }
  };
});
{{/if}}

export const apolloClient = new ApolloClient({
  link: {{#if (or (hasPlugin 'auth-authjs') (hasPlugin 'auth-clerk'))}}authLink.concat(httpLink){{else}}httpLink{{/if}},
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Apollo Provider
    {
      path: 'src/lib/apollo/provider.tsx',
      template: `'use client';

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './client';

export function GraphQLProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // GraphQL queries
    {
      path: 'src/lib/apollo/queries.ts',
      template: `import { gql } from '@apollo/client';

export const GET_HELLO = gql\`
  query GetHello($name: String) {
    hello(name: $name)
  }
\`;

{{#if (hasPlugin 'db-prisma')}}
export const GET_USERS = gql\`
  query GetUsers {
    users {
      id
      name
      email
      createdAt
    }
  }
\`;

export const GET_USER = gql\`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      createdAt
      updatedAt
    }
  }
\`;

export const CREATE_USER = gql\`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
      createdAt
    }
  }
\`;

export const UPDATE_USER = gql\`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      updatedAt
    }
  }
\`;

export const DELETE_USER = gql\`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
\`;
{{/if}}

{{#if (or (hasPlugin 'auth-authjs') (hasPlugin 'auth-clerk'))}}
export const GET_ME = gql\`
  query GetMe {
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
      path: 'src/components/examples/apollo-example.tsx',
      template: `'use client';

{{#if (eq template 'nextjs')}}
import { useQuery, useMutation } from '@apollo/client';
import { GET_HELLO{{#if (hasPlugin 'db-prisma')}}, GET_USERS, CREATE_USER{{/if}} } from '@/lib/apollo/queries';
{{/if}}

export function ApolloExample() {
  {{#if (eq template 'nextjs')}}
  const { data, loading, error } = useQuery(GET_HELLO, {
    variables: { name: 'Apollo' },
  });

  {{#if (hasPlugin 'db-prisma')}}
  const { data: usersData } = useQuery(GET_USERS);
  const [createUser] = useMutation(CREATE_USER, {
    refetchQueries: [GET_USERS],
  });

  const handleCreateUser = async () => {
    try {
      await createUser({
        variables: {
          input: {
            name: 'New User',
            email: 'user@example.com',
          },
        },
      });
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };
  {{/if}}

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  {{/if}}

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Apollo GraphQL Example</h2>
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
      <p className="text-gray-600">Apollo GraphQL is configured! Check /api/graphql</p>
      {{/if}}
    </div>
  );
}
`,
      overwrite: false,
    },
    
    // Nuxt plugin
    {
      path: 'plugins/apollo.client.ts',
      template: `import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { provideApolloClient } from '@vue/apollo-composable';

export default defineNuxtPlugin(() => {
  const httpLink = createHttpLink({
    uri: '/api/graphql',
  });

  const apolloClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
  });

  provideApolloClient(apolloClient);
});
`,
      condition: { template: 'nuxt' },
      overwrite: false,
    },
  ],
  
  // Integrations with other plugins
  integrations: [
    {
      plugin: 'auth-authjs',
      type: 'provider',
      files: [
        {
          path: 'src/server/graphql/middleware/auth.ts',
          template: `import { GraphQLError } from 'graphql';
import type { Context } from '../types';

export function requireAuth(context: Context) {
  if (!context.session?.user) {
    throw new GraphQLError('You must be authenticated to perform this action.', {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    });
  }
  return context.session.user;
}

export function optionalAuth(context: Context) {
  return context.session?.user || null;
}
`,
          overwrite: false,
        },
      ],
    },
    
    {
      plugin: 'auth-clerk',
      type: 'provider',
      files: [
        {
          path: 'src/server/graphql/middleware/clerk-auth.ts',
          template: `import { GraphQLError } from 'graphql';
import type { Context } from '../types';

export function requireClerkAuth(context: Context) {
  if (!context.userId) {
    throw new GraphQLError('You must be authenticated to perform this action.', {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    });
  }
  return context.userId;
}

export function optionalClerkAuth(context: Context) {
  return context.userId || null;
}
`,
          overwrite: false,
        },
      ],
    },
  ],
  
  postInstall: `🚀 Apollo GraphQL has been configured successfully!

Next steps:
1. {{#if (eq template 'nextjs')}}Wrap your app with GraphQLProvider in your layout{{/if}}
2. Define your GraphQL schema in src/server/graphql/schema/
3. Add resolvers for your queries and mutations
4. {{#if (hasPlugin 'db-prisma')}}Check out the generated user resolvers for database examples{{/if}}

GraphQL Playground: {{#if options.playground}}http://localhost:3000/api/graphql{{else}}Disabled{{/if}}

Example usage:
{{#if (eq template 'nextjs')}}
\`\`\`tsx
import { useQuery } from '@apollo/client';
import { GET_HELLO } from '@/lib/apollo/queries';

function MyComponent() {
  const { data, loading } = useQuery(GET_HELLO, {
    variables: { name: 'World' }
  });
  
  if (loading) return <div>Loading...</div>;
  return <div>{data?.hello}</div>;
}
\`\`\`
{{/if}}

Documentation: https://www.apollographql.com/docs/`,
});

export default apiApolloPlugin;