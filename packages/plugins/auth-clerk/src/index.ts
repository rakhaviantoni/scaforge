/**
 * Clerk Authentication Plugin for Scaforge
 * Complete authentication solution with Clerk
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';


export const authClerkPlugin = definePlugin({
  name: 'auth-clerk',
  displayName: 'Clerk',
  category: 'auth',
  description: 'Complete authentication solution with Clerk',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt'],
  
  packages: {
    dependencies: {
      '@clerk/nextjs': '^5.0.0',
      '@clerk/themes': '^2.0.0',
    },
  },
  
  configSchema: z.object({
    appearance: z.object({
      theme: z.enum(['light', 'dark', 'auto']).default('light'),
      variables: z.object({
        colorPrimary: z.string().default('#3b82f6'),
        colorBackground: z.string().optional(),
        colorText: z.string().optional(),
      }).optional(),
    }).optional(),
    
    signIn: z.object({
      url: z.string().default('/sign-in'),
      redirectUrl: z.string().default('/dashboard'),
      elements: z.array(z.enum([
        'emailAddress',
        'phoneNumber',
        'username',
        'socialProviders',
      ])).default(['emailAddress', 'socialProviders']),
    }),
    
    signUp: z.object({
      url: z.string().default('/sign-up'),
      redirectUrl: z.string().default('/dashboard'),
      elements: z.array(z.enum([
        'emailAddress',
        'phoneNumber',
        'username',
        'firstName',
        'lastName',
      ])).default(['emailAddress', 'firstName', 'lastName']),
    }),
    
    socialProviders: z.array(z.enum([
      'google',
      'github',
      'discord',
      'twitter',
      'facebook',
      'apple',
      'linkedin',
      'microsoft',
    ])).default(['google', 'github']),
    
    features: z.object({
      multiFactorAuth: z.boolean().default(false),
      organizationMode: z.boolean().default(false),
      userProfile: z.boolean().default(true),
      sessionManagement: z.boolean().default(true),
    }).optional(),
    
    publicRoutes: z.array(z.string()).default([
      '/',
      '/about',
      '/contact',
      '/pricing',
    ]),
    
    ignoredRoutes: z.array(z.string()).default([
      '/api/webhook',
      '/api/health',
    ]),
  }),
  
  envVars: [
    {
      name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      description: 'Clerk publishable key (get from Clerk dashboard)',
      required: true,
    },
    {
      name: 'CLERK_SECRET_KEY',
      description: 'Clerk secret key (get from Clerk dashboard)',
      required: true,
      secret: true,
    },
    {
      name: 'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
      description: 'Custom sign-in URL',
      required: false,
      default: '/sign-in',
    },
    {
      name: 'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
      description: 'Custom sign-up URL',
      required: false,
      default: '/sign-up',
    },
    {
      name: 'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
      description: 'Redirect URL after sign-in',
      required: false,
      default: '/dashboard',
    },
    {
      name: 'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
      description: 'Redirect URL after sign-up',
      required: false,
      default: '/dashboard',
    },
  ],
  
  files: [
    // Clerk provider wrapper
    {
      path: 'src/components/providers/clerk-provider.tsx',
      template: `import { ClerkProvider } from '@clerk/nextjs'
{{#if options.appearance}}
import { {{options.appearance.theme}} } from '@clerk/themes'
{{/if}}

interface Props {
  children: React.ReactNode
}

export function AuthClerkProvider({ children }: Props) {
  return (
    <ClerkProvider
      {{#if options.appearance}}
      appearance={{
        {{#if options.appearance.theme}}
        baseTheme: {{options.appearance.theme}},
        {{/if}}
        {{#if options.appearance.variables}}
        variables: {
          {{#if options.appearance.variables.colorPrimary}}
          colorPrimary: '{{options.appearance.variables.colorPrimary}}',
          {{/if}}
          {{#if options.appearance.variables.colorBackground}}
          colorBackground: '{{options.appearance.variables.colorBackground}}',
          {{/if}}
          {{#if options.appearance.variables.colorText}}
          colorText: '{{options.appearance.variables.colorText}}',
          {{/if}}
        },
        {{/if}}
      }}
      {{/if}}
    >
      {children}
    </ClerkProvider>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Middleware
    {
      path: 'middleware.ts',
      template: `import { authMiddleware } from "@clerk/nextjs"

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    {{#each options.publicRoutes}}
    "{{this}}",
    {{/each}}
  ],
  
  // Routes that should be ignored by the auth middleware
  ignoredRoutes: [
    {{#each options.ignoredRoutes}}
    "{{this}}",
    {{/each}}
  ],
  
  {{#if options.signIn.url}}
  signInUrl: "{{options.signIn.url}}",
  {{/if}}
  {{#if options.signUp.url}}
  signUpUrl: "{{options.signUp.url}}",
  {{/if}}
  {{#if options.signIn.redirectUrl}}
  afterSignInUrl: "{{options.signIn.redirectUrl}}",
  {{/if}}
  {{#if options.signUp.redirectUrl}}
  afterSignUpUrl: "{{options.signUp.redirectUrl}}",
  {{/if}}
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Sign-in page
    {
      path: 'src/app/sign-in/[[...sign-in]]/page.tsx',
      template: `import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <SignIn 
          {{#if options.appearance}}
          appearance={{
            {{#if options.appearance.theme}}
            baseTheme: {{options.appearance.theme}},
            {{/if}}
            {{#if options.appearance.variables}}
            variables: {
              {{#if options.appearance.variables.colorPrimary}}
              colorPrimary: '{{options.appearance.variables.colorPrimary}}',
              {{/if}}
            },
            {{/if}}
          }}
          {{/if}}
        />
      </div>
    </div>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Sign-up page
    {
      path: 'src/app/sign-up/[[...sign-up]]/page.tsx',
      template: `import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <SignUp 
          {{#if options.appearance}}
          appearance={{
            {{#if options.appearance.theme}}
            baseTheme: {{options.appearance.theme}},
            {{/if}}
            {{#if options.appearance.variables}}
            variables: {
              {{#if options.appearance.variables.colorPrimary}}
              colorPrimary: '{{options.appearance.variables.colorPrimary}}',
              {{/if}}
            },
            {{/if}}
          }}
          {{/if}}
        />
      </div>
    </div>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // User profile page
    {
      path: 'src/app/user-profile/[[...user-profile]]/page.tsx',
      template: `import { UserProfile } from '@clerk/nextjs'

export default function UserProfilePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <UserProfile 
        {{#if options.appearance}}
        appearance={{
          {{#if options.appearance.theme}}
          baseTheme: {{options.appearance.theme}},
          {{/if}}
          {{#if options.appearance.variables}}
          variables: {
            {{#if options.appearance.variables.colorPrimary}}
            colorPrimary: '{{options.appearance.variables.colorPrimary}}',
            {{/if}}
          },
          {{/if}}
        }}
        {{/if}}
      />
    </div>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Auth components
    {
      path: 'src/components/auth/user-button.tsx',
      template: `import { UserButton as ClerkUserButton } from '@clerk/nextjs'

export function UserButton() {
  return (
    <ClerkUserButton 
      afterSignOutUrl="/"
      {{#if options.appearance}}
      appearance={{
        {{#if options.appearance.theme}}
        baseTheme: {{options.appearance.theme}},
        {{/if}}
        {{#if options.appearance.variables}}
        variables: {
          {{#if options.appearance.variables.colorPrimary}}
          colorPrimary: '{{options.appearance.variables.colorPrimary}}',
          {{/if}}
        },
        {{/if}}
      }}
      {{/if}}
    />
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    {
      path: 'src/components/auth/auth-guard.tsx',
      template: `'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  fallback = <div>Loading...</div>,
  redirectTo = '/sign-in'
}: Props) {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push(redirectTo)
    }
  }, [isLoaded, userId, router, redirectTo])
  
  if (!isLoaded) {
    return <>{fallback}</>
  }
  
  if (!userId) {
    return null
  }
  
  return <>{children}</>
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    {
      path: 'src/components/auth/sign-in-button.tsx',
      template: `'use client'

import { SignInButton as ClerkSignInButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

interface Props {
  mode?: 'modal' | 'redirect'
  children?: React.ReactNode
}

export function SignInButton({ mode = 'redirect', children }: Props) {
  return (
    <ClerkSignInButton mode={mode}>
      {children || <Button>Sign In</Button>}
    </ClerkSignInButton>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Auth utilities
    {
      path: 'src/lib/auth/utils.ts',
      template: `import { auth, currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

/**
 * Server-side function to get the current user
 * Throws an error if no user is found
 */
export async function getCurrentUser() {
  const user = await currentUser()
  
  if (!user) {
    throw new Error('No authenticated user found')
  }
  
  return user
}

/**
 * Server-side function to require authentication
 * Redirects to sign-in page if not authenticated
 */
export async function requireAuth() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return userId
}

/**
 * Get user ID from server context
 */
export function getUserId() {
  const { userId } = auth()
  return userId
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const { userId } = auth()
  return !!userId
}

/**
 * Get user metadata
 */
export async function getUserMetadata() {
  const user = await currentUser()
  
  if (!user) {
    return null
  }
  
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    publicMetadata: user.publicMetadata,
    privateMetadata: user.privateMetadata,
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Protected route example
    {
      path: 'src/app/dashboard/page.tsx',
      template: `import { auth, currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { UserButton } from '@/components/auth/user-button'

export default async function DashboardPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await currentUser()
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <UserButton />
      </div>
      
      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
          <p className="text-gray-600">
            You are signed in as: <strong>{user?.emailAddresses[0]?.emailAddress}</strong>
          </p>
          {user?.firstName && (
            <p className="text-gray-600">
              Name: <strong>{user.firstName} {user.lastName}</strong>
            </p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">User Information</h3>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user?.id}</p>
            <p><strong>Created:</strong> {user?.createdAt?.toLocaleDateString()}</p>
            <p><strong>Last Sign In:</strong> {user?.lastSignInAt?.toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // API route example
    {
      path: 'src/app/api/user/route.ts',
      template: `import { auth, currentUser } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const user = await currentUser()
    
    return NextResponse.json({
      user: {
        id: user?.id,
        email: user?.emailAddresses[0]?.emailAddress,
        firstName: user?.firstName,
        lastName: user?.lastName,
        imageUrl: user?.imageUrl,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // TanStack Start setup
    {
      path: 'app/auth/clerk.ts',
      template: `import { createServerFn } from '@tanstack/start'
import { auth, currentUser } from '@clerk/nextjs'

export const getAuth = createServerFn('GET', async () => {
  return auth()
})

export const getCurrentUserData = createServerFn('GET', async () => {
  return await currentUser()
})
`,
      condition: { template: 'tanstack' },
      overwrite: false,
    },
    
    // Nuxt plugin
    {
      path: 'plugins/clerk.client.ts',
      template: `export default defineNuxtPlugin(async () => {
  // Clerk client-side setup for Nuxt
  // This will be expanded based on Clerk Nuxt integration
})
`,
      condition: { template: 'nuxt' },
      overwrite: false,
    },
    
    // Organization support (if enabled)
    {
      path: 'src/app/organization/[[...organization]]/page.tsx',
      template: `import { OrganizationProfile } from '@clerk/nextjs'

export default function OrganizationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <OrganizationProfile 
        {{#if options.appearance}}
        appearance={{
          {{#if options.appearance.theme}}
          baseTheme: {{options.appearance.theme}},
          {{/if}}
          {{#if options.appearance.variables}}
          variables: {
            {{#if options.appearance.variables.colorPrimary}}
            colorPrimary: '{{options.appearance.variables.colorPrimary}}',
            {{/if}}
          },
          {{/if}}
        }}
        {{/if}}
      />
    </div>
  )
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Type definitions
    {
      path: 'types/clerk.ts',
      template: `import type { User } from '@clerk/nextjs/server'

export interface AuthUser extends User {
  // Add custom user properties here
}

export interface AuthContext {
  userId: string | null
  user: AuthUser | null
  sessionId: string | null
  orgId: string | null
  orgRole: string | null
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
          template: `import { auth, currentUser } from '@clerk/nextjs'

export async function createTRPCContext(opts: { req?: any }) {
  const { userId, sessionId, orgId, orgRole } = auth()
  const user = userId ? await currentUser() : null
  
  return {
    userId,
    user,
    sessionId,
    orgId,
    orgRole,
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
          path: 'prisma/schema-clerk.prisma',
          template: `// Clerk integration models
model User {
  id        String   @id // This will be the Clerk user ID
  email     String   @unique
  firstName String?
  lastName  String?
  imageUrl  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add your custom user fields here
  // posts     Post[]
  // profile   Profile?
}

// Optional: If you want to store additional user data
model UserProfile {
  id     String @id @default(cuid())
  userId String @unique // Clerk user ID
  bio    String?
  
  // Add custom profile fields
  
  @@map("user_profiles")
}
`,
          overwrite: false,
        },
      ],
    },
  ],
  
  postInstall: `🔐 Clerk has been configured successfully!

Next steps:
1. {{#if (eq template 'nextjs')}}Wrap your app with ClerkProvider in your root layout{{/if}}
2. Set up your Clerk application at https://clerk.com/
3. Add your API keys to .env.local
4. Configure your authentication settings in the Clerk dashboard
5. {{#if (hasPlugin 'db-prisma')}}Sync user data with your database{{/if}}

Clerk Dashboard Setup:
1. Create a new application at https://clerk.com/
2. Configure your sign-in/sign-up options
3. Set up social providers:
{{#each options.socialProviders}}
   - {{this}}
{{/each}}
4. {{#if options.features.multiFactorAuth}}Enable multi-factor authentication{{/if}}
5. {{#if options.features.organizationMode}}Enable organization mode{{/if}}

Example usage:
{{#if (eq template 'nextjs')}}
\`\`\`tsx
import { auth, currentUser } from "@clerk/nextjs"

// Server component
export default async function Page() {
  const { userId } = auth()
  const user = await currentUser()
  return <div>Welcome {user?.firstName}</div>
}

// Client component
import { useUser } from "@clerk/nextjs"

function ClientComponent() {
  const { user } = useUser()
  return <div>Welcome {user?.firstName}</div>
}
\`\`\`
{{/if}}

Documentation: https://clerk.com/docs`,
});

export default authClerkPlugin;