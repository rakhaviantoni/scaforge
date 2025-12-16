/**
 * Better-Auth Plugin for Scaforge
 * Type-safe authentication with Better-Auth
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const authBetterPlugin = definePlugin({
  name: 'auth-better',
  displayName: 'Better-Auth',
  category: 'auth',
  description: 'Type-safe authentication with Better-Auth',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt'],
  
  packages: {
    dependencies: {
      'better-auth': '^0.7.0',
      '@better-auth/react': '^0.7.0',
    },
  },
  
  configSchema: z.object({
    database: z.object({
      provider: z.enum(['prisma', 'drizzle', 'kysely']).default('prisma'),
      type: z.enum(['postgres', 'mysql', 'sqlite']).default('postgres'),
    }),
    
    session: z.object({
      expiresIn: z.number().default(60 * 60 * 24 * 7), // 7 days
      updateAge: z.number().default(60 * 60 * 24), // 1 day
      cookieCache: z.boolean().default(true),
    }),
    
    socialProviders: z.array(z.enum([
      'google',
      'github',
      'discord',
      'twitter',
      'facebook',
      'apple',
      'microsoft',
    ])).default(['google', 'github']),
    
    features: z.object({
      emailVerification: z.boolean().default(true),
      passwordReset: z.boolean().default(true),
      twoFactor: z.boolean().default(false),
      multiSession: z.boolean().default(true),
      rateLimit: z.boolean().default(true),
      csrfProtection: z.boolean().default(true),
    }),
    
    email: z.object({
      provider: z.enum(['smtp', 'resend', 'sendgrid']).default('smtp'),
      from: z.string().default('noreply@yourapp.com'),
    }).optional(),
    
    security: z.object({
      allowedOrigins: z.array(z.string()).default(['http://localhost:3000']),
      trustedOrigins: z.array(z.string()).default([]),
      enableAdvancedLogs: z.boolean().default(false),
    }).optional(),
  }),
  
  envVars: [
    {
      name: 'BETTER_AUTH_SECRET',
      description: 'Secret key for signing tokens (generate with: openssl rand -base64 32)',
      required: true,
      secret: true,
    },
    {
      name: 'BETTER_AUTH_URL',
      description: 'Base URL of your application',
      required: true,
      default: 'http://localhost:3000',
    },
    {
      name: 'DATABASE_URL',
      description: 'Database connection URL',
      required: true,
      secret: true,
    },
    {
      name: 'EMAIL_FROM',
      description: 'From email address for auth emails',
      required: false,
      default: 'noreply@yourapp.com',
    },
    {
      name: 'SMTP_HOST',
      description: 'SMTP server host',
      required: false,
    },
    {
      name: 'SMTP_PORT',
      description: 'SMTP server port',
      required: false,
      default: '587',
    },
    {
      name: 'SMTP_USER',
      description: 'SMTP username',
      required: false,
      secret: true,
    },
    {
      name: 'SMTP_PASS',
      description: 'SMTP password',
      required: false,
      secret: true,
    },
    {
      name: 'GOOGLE_CLIENT_ID',
      description: 'Google OAuth Client ID',
      required: false,
      secret: true,
    },
    {
      name: 'GOOGLE_CLIENT_SECRET',
      description: 'Google OAuth Client Secret',
      required: false,
      secret: true,
    },
    {
      name: 'GITHUB_CLIENT_ID',
      description: 'GitHub OAuth Client ID',
      required: false,
      secret: true,
    },
    {
      name: 'GITHUB_CLIENT_SECRET',
      description: 'GitHub OAuth Client Secret',
      required: false,
      secret: true,
    },
  ],
  
  files: [
    // Core Better-Auth configuration
    {
      path: 'lib/auth/config.ts',
      template: `import { betterAuth } from "better-auth"
{{#if (hasPlugin 'db-prisma')}}
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"
{{/if}}
{{#if (hasPlugin 'db-drizzle')}}
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"
{{/if}}
{{#each options.socialProviders}}
{{#if (eq this 'google')}}
import { google } from "better-auth/providers"
{{/if}}
{{#if (eq this 'github')}}
import { github } from "better-auth/providers"
{{/if}}
{{#if (eq this 'discord')}}
import { discord } from "better-auth/providers"
{{/if}}
{{#if (eq this 'twitter')}}
import { twitter } from "better-auth/providers"
{{/if}}
{{#if (eq this 'facebook')}}
import { facebook } from "better-auth/providers"
{{/if}}
{{#if (eq this 'microsoft')}}
import { microsoft } from "better-auth/providers"
{{/if}}
{{/each}}
{{#if options.features.twoFactor}}
import { twoFactor } from "better-auth/plugins"
{{/if}}
{{#if options.features.multiSession}}
import { multiSession } from "better-auth/plugins"
{{/if}}

export const auth = betterAuth({
  {{#if (hasPlugin 'db-prisma')}}
  database: prismaAdapter(prisma, {
    provider: "{{options.database.type}}",
  }),
  {{/if}}
  {{#if (hasPlugin 'db-drizzle')}}
  database: drizzleAdapter(db, {
    provider: "{{options.database.type}}",
  }),
  {{/if}}
  
  session: {
    expiresIn: {{options.session.expiresIn}},
    updateAge: {{options.session.updateAge}},
    cookieCache: {{options.session.cookieCache}},
  },
  
  {{#if options.email}}
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: {{options.features.emailVerification}},
    sendResetPassword: async ({ user, url }) => {
      // Send password reset email
      console.log(\`Send reset password email to \${user.email}: \${url}\`)
    },
    sendVerificationEmail: async ({ user, url }) => {
      // Send verification email
      console.log(\`Send verification email to \${user.email}: \${url}\`)
    },
  },
  {{/if}}
  
  socialProviders: [
    {{#each options.socialProviders}}
    {{#if (eq this 'google')}}
    google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    {{/if}}
    {{#if (eq this 'github')}}
    github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    {{/if}}
    {{#if (eq this 'discord')}}
    discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    {{/if}}
    {{#if (eq this 'twitter')}}
    twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
    {{/if}}
    {{#if (eq this 'facebook')}}
    facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    {{/if}}
    {{#if (eq this 'microsoft')}}
    microsoft({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    }),
    {{/if}}
    {{/each}}
  ],
  
  plugins: [
    {{#if options.features.twoFactor}}
    twoFactor({
      issuer: "{{config.name}}",
    }),
    {{/if}}
    {{#if options.features.multiSession}}
    multiSession(),
    {{/if}}
  ],
  
  {{#if options.security}}
  advanced: {
    {{#if options.security.allowedOrigins}}
    crossSubDomainCookies: {
      enabled: true,
      allowedOrigins: [
        {{#each options.security.allowedOrigins}}
        "{{this}}",
        {{/each}}
      ],
    },
    {{/if}}
    {{#if options.security.enableAdvancedLogs}}
    generateId: () => crypto.randomUUID(),
    {{/if}}
  },
  {{/if}}
  
  {{#if options.features.rateLimit}}
  rateLimit: {
    window: 60, // 1 minute
    max: 100, // 100 requests per minute
  },
  {{/if}}
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.User
`,
      overwrite: false,
    },
    
    // Server-side auth utilities
    {
      path: 'lib/auth/server.ts',
      template: `import { auth as betterAuth } from "./config"
import { headers } from "next/headers"

/**
 * Get the current session on the server
 */
export async function auth() {
  return await betterAuth.api.getSession({
    headers: headers(),
  })
}

/**
 * Require authentication, throw if not authenticated
 */
export async function requireAuth() {
  const session = await auth()
  
  if (!session) {
    throw new Error("Authentication required")
  }
  
  return session
}

/**
 * Get current user, throw if not authenticated
 */
export async function getCurrentUser() {
  const session = await requireAuth()
  return session.user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await auth()
  return !!session
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Client-side auth utilities
    {
      path: 'lib/auth/client.ts',
      template: `"use client"

import { createAuthClient } from "@better-auth/react"
import { auth } from "./config"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
})

export const {
  useSession,
  signIn,
  signOut,
  signUp,
  {{#if options.features.twoFactor}}
  twoFactor,
  {{/if}}
  {{#if options.features.multiSession}}
  listSessions,
  revokeSession,
  {{/if}}
} = authClient

// Re-export types
export type { Session, User } from "./config"
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Next.js API route
    {
      path: 'app/api/auth/[...all]/route.ts',
      template: `import { auth } from "@/lib/auth/config"

export const { GET, POST } = auth.handler
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Auth components
    {
      path: 'components/auth/auth-button.tsx',
      template: `"use client"

import { useSession, signIn, signOut } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"

export function AuthButton() {
  const { data: session, isPending } = useSession()
  
  if (isPending) {
    return <Button disabled>Loading...</Button>
  }
  
  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {session.user.email}
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
    <Button onClick={() => signIn.email({ 
      email: "user@example.com",
      password: "password123"
    })}>
      Sign In
    </Button>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    {
      path: 'components/auth/sign-in-form.tsx',
      template: `"use client"

import { useState } from "react"
import { signIn, signUp } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SignInForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (isSignUp) {
        await signUp.email({
          email,
          password,
          name,
        })
      } else {
        await signIn.email({
          email,
          password,
        })
      }
    } catch (error) {
      console.error("Auth error:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isSignUp ? "Sign Up" : "Sign In"}</CardTitle>
        <CardDescription>
          {isSignUp ? "Create a new account" : "Sign in to your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
          </Button>
        </form>
        
        <div className="mt-4 space-y-2">
          {{#each options.socialProviders}}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn.social({ provider: "{{this}}" })}
          >
            Sign in with {{capitalize this}}
          </Button>
          {{/each}}
        </div>
        
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    {
      path: 'components/auth/auth-guard.tsx',
      template: `"use client"

import { useSession } from "@/lib/auth/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  fallback = <div>Loading...</div>,
  redirectTo = "/auth/signin"
}: Props) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (!isPending && !session) {
      router.push(redirectTo)
    }
  }, [isPending, session, router, redirectTo])
  
  if (isPending) {
    return <>{fallback}</>
  }
  
  if (!session) {
    return null
  }
  
  return <>{children}</>
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Auth pages
    {
      path: 'app/auth/signin/page.tsx',
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
    
    // Protected route example
    {
      path: 'app/dashboard/page.tsx',
      template: `import { auth } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import { AuthButton } from "@/components/auth/auth-button"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
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
    
    // Middleware
    {
      path: 'middleware.ts',
      template: `import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth/config"

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  
  const { pathname } = request.nextUrl
  
  // Define protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/auth/signin', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Redirect to dashboard if accessing auth pages while logged in
  if (session && pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

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
    
    // TanStack Start setup
    {
      path: 'app/auth/better.ts',
      template: `import { createServerFn } from '@tanstack/start'
import { auth } from '@/lib/auth/config'

export const getSession = createServerFn('GET', async () => {
  return await auth.api.getSession({
    headers: {},
  })
})
`,
      condition: { template: 'tanstack' },
      overwrite: false,
    },
    
    // Nuxt plugin
    {
      path: 'plugins/better-auth.client.ts',
      template: `export default defineNuxtPlugin(async () => {
  // Better-Auth client-side setup for Nuxt
  // This will be expanded based on Better-Auth Nuxt integration
})
`,
      condition: { template: 'nuxt' },
      overwrite: false,
    },
    
    // Two-factor authentication components (if enabled)
    {
      path: 'components/auth/two-factor-setup.tsx',
      template: `"use client"

import { useState } from "react"
import { twoFactor } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function TwoFactorSetup() {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const { data: qrCode } = twoFactor.getTotpUri()
  const { data: backupCodes } = twoFactor.getBackupCodes()
  
  const handleEnable = async () => {
    setIsLoading(true)
    try {
      await twoFactor.enable({ code })
    } catch (error) {
      console.error("2FA setup error:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Secure your account with 2FA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCode && (
          <div className="text-center">
            <img src={qrCode} alt="QR Code" className="mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              Scan this QR code with your authenticator app
            </p>
          </div>
        )}
        
        <div>
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
        </div>
        
        <Button 
          onClick={handleEnable} 
          className="w-full"
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? "Enabling..." : "Enable 2FA"}
        </Button>
        
        {backupCodes && backupCodes.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Backup Codes</h4>
            <div className="bg-gray-100 p-3 rounded text-sm">
              {backupCodes.map((code, index) => (
                <div key={index}>{code}</div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Session management (if multi-session enabled)
    {
      path: 'components/auth/session-manager.tsx',
      template: `"use client"

import { listSessions, revokeSession } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SessionManager() {
  const { data: sessions, refetch } = listSessions()
  
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession({ sessionId })
      refetch()
    } catch (error) {
      console.error("Failed to revoke session:", error)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          Manage your active sessions across devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions?.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <p className="font-medium">{session.userAgent || "Unknown Device"}</p>
                <p className="text-sm text-muted-foreground">
                  Last active: {new Date(session.updatedAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  IP: {session.ipAddress || "Unknown"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRevokeSession(session.id)}
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
`,
      condition: { template: 'nextjs' },
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
          path: 'server/trpc/context.ts',
          template: `import { auth } from "@/lib/auth/server"

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
          path: 'prisma/schema-better-auth.prisma',
          template: `// Better-Auth required models
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Better-Auth relations
  sessions      Session[]
  accounts      Account[]
  
  // Add your custom user fields here
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  accountId         String
  providerId        String
  accessToken       String?
  refreshToken      String?
  idToken           String?
  accessTokenExpiresAt DateTime?
  refreshTokenExpiresAt DateTime?
  scope             String?
  password          String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([providerId, accountId])
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@unique([identifier, value])
}
`,
          overwrite: false,
        },
      ],
    },
  ],
  
  postInstall: `🔐 Better-Auth has been configured successfully!

Next steps:
1. Set up your environment variables in .env.local
2. {{#if (hasPlugin 'db-prisma')}}Run database migrations for auth tables{{/if}}
3. Configure your social providers
4. {{#if options.features.emailVerification}}Set up email provider for verification{{/if}}
5. Test the authentication flow

Environment setup:
- Generate BETTER_AUTH_SECRET: \`openssl rand -base64 32\`
- Set up your database connection
{{#if options.email}}
- Configure email provider (SMTP, Resend, or SendGrid)
{{/if}}
{{#each options.socialProviders}}
- Get {{this}} OAuth credentials
{{/each}}

Example usage:
{{#if (eq template 'nextjs')}}
\`\`\`tsx
import { auth } from "@/lib/auth/server"

// Server component
export default async function Page() {
  const session = await auth()
  return <div>Welcome {session?.user?.name}</div>
}

// Client component
import { useSession } from "@/lib/auth/client"

function ClientComponent() {
  const { data: session } = useSession()
  return <div>Welcome {session?.user?.name}</div>
}
\`\`\`
{{/if}}

Features enabled:
{{#if options.features.emailVerification}}
- ✅ Email verification
{{/if}}
{{#if options.features.passwordReset}}
- ✅ Password reset
{{/if}}
{{#if options.features.twoFactor}}
- ✅ Two-factor authentication
{{/if}}
{{#if options.features.multiSession}}
- ✅ Multi-session support
{{/if}}
{{#if options.features.rateLimit}}
- ✅ Rate limiting
{{/if}}

Documentation: https://better-auth.com`,
});

export default authBetterPlugin;