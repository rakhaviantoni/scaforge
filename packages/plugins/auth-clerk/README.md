# @scaforge/plugin-auth-clerk

Clerk authentication plugin for Scaforge projects.

## Features

- 🔐 Complete Clerk authentication setup
- 🎯 Pre-built UI components (SignIn, SignUp, UserProfile)
- 🔒 Session management and middleware
- 🛡️ Protected routes and API endpoints
- 🎨 Customizable themes and branding
- 📱 Framework-specific implementations
- 🔗 Auto-integration with API and database plugins
- 🌐 Multi-tenant support
- 📧 Email/SMS verification
- 🔑 Social login providers

## Supported Templates

- ✅ Next.js (App Router)
- ✅ TanStack Start
- ✅ Nuxt 3
- ❌ Hydrogen (not supported)

## Installation

```bash
npx scaforge add auth-clerk
```

## Configuration

The plugin will prompt you to configure:

- Application name and branding
- Sign-in/sign-up options
- Social providers (Google, GitHub, Discord, etc.)
- Multi-factor authentication
- Custom domains (optional)

## Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Custom domains
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Usage

### Authentication Components

```tsx
import { SignIn, SignUp, UserButton } from "@clerk/nextjs"

// Sign-in page
export default function SignInPage() {
  return <SignIn />
}

// User button (shows user menu)
export function Header() {
  return (
    <div className="flex justify-between items-center">
      <h1>My App</h1>
      <UserButton afterSignOutUrl="/" />
    </div>
  )
}
```

### Protected Routes

```tsx
import { auth } from "@clerk/nextjs"
import { redirect } from "next/navigation"

export default async function ProtectedPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect("/sign-in")
  }
  
  return <div>Protected content</div>
}
```

### Client-side Auth State

```tsx
import { useUser, useAuth } from "@clerk/nextjs"

export function UserProfile() {
  const { user, isLoaded } = useUser()
  const { signOut } = useAuth()
  
  if (!isLoaded) return <div>Loading...</div>
  
  return (
    <div>
      <p>Welcome, {user?.firstName}!</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  )
}
```

### API Route Protection

```tsx
import { auth } from "@clerk/nextjs"

export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  return Response.json({ userId })
}
```

## Integration

This plugin automatically integrates with:

- **API Plugins**: Adds Clerk auth context to tRPC, GraphQL, and REST APIs
- **Database Plugins**: Provides user ID for database operations
- **UI Plugins**: Provides pre-built auth components

## Customization

### Custom Sign-in Page

```tsx
import { SignIn } from "@clerk/nextjs"

export default function CustomSignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn 
        appearance={{
          theme: "dark",
          variables: {
            colorPrimary: "#3b82f6"
          }
        }}
      />
    </div>
  )
}
```

### Middleware Configuration

```tsx
import { authMiddleware } from "@clerk/nextjs"

export default authMiddleware({
  publicRoutes: ["/", "/about", "/contact"],
  ignoredRoutes: ["/api/webhook"]
})
```

## Documentation

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- [Components Reference](https://clerk.com/docs/components/overview)