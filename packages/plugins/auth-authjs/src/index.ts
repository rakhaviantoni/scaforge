/**
 * Auth.js (NextAuth) Plugin for Scaforge
 * Complete authentication solution with Auth.js v5
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const authAuthjsPlugin = definePlugin({
  name: 'auth-authjs',
  displayName: 'Auth.js (NextAuth)',
  category: 'auth',
  description: 'Complete authentication solution with Auth.js v5',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt'],
  
  packages: {
    dependencies: {
      'next-auth': '^5.0.0-beta.4',
      '@auth/core': '^0.18.0',
    },
    devDependencies: {
      '@types/next-auth': '^3.15.0',
    },
  },
  
  configSchema: z.object({
    providers: z.array(z.enum([
      'google',
      'github',
      'discord',
      'twitter',
      'facebook',
      'apple',
      'credentials',
    ])).default(['google', 'github']),
    
    session: z.object({
      strategy: z.enum(['jwt', 'database']).default('jwt'),
      maxAge: z.number().default(30 * 24 * 60 * 60), // 30 days
    }),
    
    pages: z.object({
      signIn: z.string().optional(),
      signOut: z.string().optional(),
      error: z.string().optional(),
      verifyRequest: z.string().optional(),
      newUser: z.string().optional(),
    }).optional(),
    
    callbacks: z.object({
      enableJWT: z.boolean().default(true),
      enableSession: z.boolean().default(true),
      enableSignIn: z.boolean().default(false),
    }).optional(),
    
    debug: z.boolean().default(false),
  }),
  
  envVars: [
    {
      name: 'AUTH_SECRET',
      description: 'Secret key for signing tokens (generate with: openssl rand -base64 32)',
      required: true,
      secret: true,
    },
    {
      name: 'AUTH_URL',
      description: 'Canonical URL of your site (e.g., https://example.com)',
      required: true,
      default: 'http://localhost:3000',
    },
    {
      name: 'AUTH_GOOGLE_ID',
      description: 'Google OAuth Client ID',
      required: false,
      secret: true,
    },
    {
      name: 'AUTH_GOOGLE_SECRET',
      description: 'Google OAuth Client Secret',
      required: false,
      secret: true,
    },
    {
      name: 'AUTH_GITHUB_ID',
      description: 'GitHub OAuth App Client ID',
      required: false,
      secret: true,
    },
    {
      name: 'AUTH_GITHUB_SECRET',
      description: 'GitHub OAuth App Client Secret',
      required: false,
      secret: true,
    },
    {
      name: 'AUTH_DISCORD_ID',
      description: 'Discord OAuth App Client ID',
      required: false,
      secret: true,
    },
    {
      name: 'AUTH_DISCORD_SECRET',
      description: 'Discord OAuth App Client Secret',
      required: false,
      secret: true,
    },
  ],
  
  files: [
    // Core Auth.js configuration
    {
      path: 'auth.ts',
      template: `import NextAuth from "next-auth"
{{#each options.providers}}
{{#if (eq this 'google')}}
import Google from "next-auth/providers/google"
{{/if}}
{{#if (eq this 'github')}}
import GitHub from "next-auth/providers/github"
{{/if}}
{{#if (eq this 'discord')}}
import Discord from "next-auth/providers/discord"
{{/if}}
{{#if (eq this 'twitter')}}
import Twitter from "next-auth/providers/twitter"
{{/if}}
{{#if (eq this 'facebook')}}
import Facebook from "next-auth/providers/facebook"
{{/if}}
{{#if (eq this 'apple')}}
import Apple from "next-auth/providers/apple"
{{/if}}
{{#if (eq this 'credentials')}}
import Credentials from "next-auth/providers/credentials"
{{/if}}
{{/each}}
{{#if (hasPlugin 'db-prisma')}}
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
{{/if}}

export const { handlers, signIn, signOut, auth } = NextAuth({
  {{#if (hasPlugin 'db-prisma')}}
  adapter: PrismaAdapter(prisma),
  {{/if}}
  
  session: {
    strategy: "{{options.session.strategy}}",
    maxAge: {{options.session.maxAge}},
  },
  
  providers: [
    {{#each options.providers}}
    {{#if (eq this 'google')}}
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    {{/if}}
    {{#if (eq this 'github')}}
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    {{/if}}
    {{#if (eq this 'discord')}}
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
    {{/if}}
    {{#if (eq this 'twitter')}}
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET,
    }),
    {{/if}}
    {{#if (eq this 'facebook')}}
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
    {{/if}}
    {{#if (eq this 'apple')}}
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
    {{/if}}
    {{#if (eq this 'credentials')}}
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Add your own logic here to validate credentials
        // This is just an example - implement your own validation
        if (credentials?.email === "admin@example.com" && credentials?.password === "password") {
          return {
            id: "1",
            name: "Admin User",
            email: "admin@example.com",
          }
        }
        return null
      },
    }),
    {{/if}}
    {{/each}}
  ],
  
  {{#if options.pages}}
  pages: {
    {{#if options.pages.signIn}}
    signIn: "{{options.pages.signIn}}",
    {{/if}}
    {{#if options.pages.signOut}}
    signOut: "{{options.pages.signOut}}",
    {{/if}}
    {{#if options.pages.error}}
    error: "{{options.pages.error}}",
    {{/if}}
    {{#if options.pages.verifyRequest}}
    verifyRequest: "{{options.pages.verifyRequest}}",
    {{/if}}
    {{#if options.pages.newUser}}
    newUser: "{{options.pages.newUser}}",
    {{/if}}
  },
  {{/if}}
  
  {{#if options.callbacks}}
  callbacks: {
    {{#if options.callbacks.enableJWT}}
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    {{/if}}
    
    {{#if options.callbacks.enableSession}}
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
    {{/if}}
    
    {{#if options.callbacks.enableSignIn}}
    async signIn({ user, account, profile }) {
      // Add custom sign-in logic here
      return true
    },
    {{/if}}
  },
  {{/if}}
  
  {{#if options.debug}}
  debug: true,
  {{/if}}
})
`,
      overwrite: false,
    },
    
    // Next.js API route
    {
      path: 'src/app/api/auth/[...nextauth]/route.ts',
      template: `import { handlers } from "@/auth"

export const { GET, POST } = handlers
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Auth middleware
    {
      path: 'middleware.ts',
      template: `import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  
  // Define protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )
  
  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/auth/signin', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', nextUrl.href)
    return NextResponse.redirect(loginUrl)
  }
  
  // Redirect to dashboard if accessing auth pages while logged in
  if (isLoggedIn && nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Auth components
    {
      path: 'src/components/auth/auth-button.tsx',
      template: `"use client"

import { signIn, signOut } from "next-auth/react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function AuthButton() {
  const { data: session, status } = useSession()
  
  if (status === "loading") {
    return <Button disabled>Loading...</Button>
  }
  
  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {session.user?.email}
        </span>
        <Button 
          variant="outline" 
          onClick={() => signOut()}
        >
          Sign Out
        </Button>
      </div>
    )
  }
  
  return (
    <Button onClick={() => signIn()}>
      Sign In
    </Button>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    {
      path: 'src/components/auth/sign-in-form.tsx',
      template: `"use client"

import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Provider {
  id: string
  name: string
  type: string
}

export function SignInForm() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  
  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])
  
  if (!providers) {
    return <div>Loading...</div>
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Choose your preferred sign-in method
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.values(providers).map((provider) => (
          <Button
            key={provider.name}
            variant="outline"
            className="w-full"
            onClick={() => signIn(provider.id)}
          >
            Sign in with {provider.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Session provider wrapper
    {
      path: 'src/components/auth/session-provider.tsx',
      template: `"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

interface Props {
  children: React.ReactNode
  session?: Session | null
}

export function AuthSessionProvider({ children, session }: Props) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Auth pages
    {
      path: 'src/app/auth/signin/page.tsx',
      template: `import { SignInForm } from "@/components/auth/sign-in-form"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignInForm />
    </div>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Auth utilities
    {
      path: 'src/lib/auth/utils.ts',
      template: `import { auth } from "@/auth"
import { redirect } from "next/navigation"

/**
 * Server-side function to get the current session
 * Throws an error if no session is found
 */
export async function getCurrentUser() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("No authenticated user found")
  }
  
  return session.user
}

/**
 * Server-side function to require authentication
 * Redirects to sign-in page if not authenticated
 */
export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }
  
  return session
}

/**
 * Check if user has a specific role (if using role-based auth)
 */
export async function hasRole(role: string) {
  const session = await auth()
  
  // Extend this based on your user model
  return (session?.user as any)?.role === role
}

/**
 * Server action to sign out
 */
export async function signOutAction() {
  "use server"
  
  const { signOut } = await import("@/auth")
  await signOut()
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Protected route example
    {
      path: 'src/app/dashboard/page.tsx',
      template: `import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AuthButton } from "@/components/auth/auth-button"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <AuthButton />
      </div>
      
      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
          <p className="text-gray-600">
            You are signed in as: <strong>{session.user.email}</strong>
          </p>
          {session.user.name && (
            <p className="text-gray-600">
              Name: <strong>{session.user.name}</strong>
            </p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Session Information</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // TanStack Start setup
    {
      path: 'app/auth.ts',
      template: `import { createServerFn } from '@tanstack/start'
import { auth, signIn, signOut } from '@/auth'

export const getSession = createServerFn('GET', async () => {
  return await auth()
})

export const signInAction = createServerFn('POST', async (provider: string) => {
  return await signIn(provider)
})

export const signOutAction = createServerFn('POST', async () => {
  return await signOut()
})
`,
      condition: { template: 'tanstack' },
      overwrite: false,
    },
    
    // Nuxt plugin
    {
      path: 'plugins/auth.client.ts',
      template: `export default defineNuxtPlugin(async () => {
  // Auth.js client-side setup for Nuxt
  // This will be expanded based on Auth.js Nuxt integration
})
`,
      condition: { template: 'nuxt' },
      overwrite: false,
    },
    
    // Type definitions
    {
      path: 'types/auth.ts',
      template: `import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
    } & DefaultSession["user"]
  }
  
  interface User {
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
  }
}
`,
      overwrite: false,
    },
  ],
  
  // Integrations with other plugins
  integrations: [
    {
      plugin: 'api-trpc',
      type: 'middleware',
      files: [
        {
          path: 'src/server/trpc/context.ts',
          template: `import { auth } from "@/auth"

export async function createTRPCContext(opts: { req?: any }) {
  const session = await auth()
  
  return {
    session,
    user: session?.user,
  }
}
`,
          overwrite: true,
        },
      ],
    },
    
    {
      plugin: 'db-prisma',
      type: 'config',
      files: [
        {
          path: 'prisma/schema-auth.prisma',
          template: `// Auth.js required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          String    @default("user")
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
`,
          overwrite: false,
        },
      ],
    },
  ],
  
  postInstall: `🔐 Auth.js has been configured successfully!

Next steps:
1. {{#if (eq template 'nextjs')}}Add AuthSessionProvider to your root layout{{/if}}
2. Set up your environment variables in .env.local
3. Configure your OAuth providers (Google, GitHub, etc.)
4. {{#if (hasPlugin 'db-prisma')}}Run database migrations for auth tables{{/if}}
5. Customize the sign-in page and auth flow

Environment setup:
{{#each options.providers}}
{{#if (eq this 'google')}}
- Get Google OAuth credentials: https://console.developers.google.com
{{/if}}
{{#if (eq this 'github')}}
- Get GitHub OAuth credentials: https://github.com/settings/developers
{{/if}}
{{#if (eq this 'discord')}}
- Get Discord OAuth credentials: https://discord.com/developers/applications
{{/if}}
{{/each}}

Example usage:
{{#if (eq template 'nextjs')}}
\`\`\`tsx
import { auth } from "@/auth"

// Server component
export default async function Page() {
  const session = await auth()
  return <div>Welcome {session?.user?.name}</div>
}

// Client component
import { useSession } from "next-auth/react"

function ClientComponent() {
  const { data: session } = useSession()
  return <div>Welcome {session?.user?.name}</div>
}
\`\`\`
{{/if}}

Documentation: https://authjs.dev`,
});

export default authAuthjsPlugin;