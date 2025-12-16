# @scaforge/plugin-auth-authjs

Auth.js (NextAuth) authentication plugin for Scaforge projects.

## Features

- 🔐 Complete Auth.js v5 setup
- 🎯 Multiple provider support (Google, GitHub, Discord, etc.)
- 🔒 Session management and middleware
- 🛡️ Protected routes and API endpoints
- 🎨 Customizable sign-in pages
- 📱 Framework-specific implementations
- 🔗 Auto-integration with API and database plugins

## Supported Templates

- ✅ Next.js (App Router)
- ✅ TanStack Start
- ✅ Nuxt 3
- ❌ Hydrogen (not supported)

## Installation

```bash
npx scaforge add auth-authjs
```

## Configuration

The plugin will prompt you to configure:

- Authentication providers (Google, GitHub, Discord, etc.)
- Session strategy (JWT or database)
- Custom pages (optional)
- Callbacks and events (optional)

## Environment Variables

Add these to your `.env.local`:

```env
AUTH_SECRET=your-auth-secret
AUTH_URL=http://localhost:3000

# Provider credentials (example for Google)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

## Usage

### Sign In/Out Buttons

```tsx
import { signIn, signOut, useSession } from "next-auth/react"

export function AuthButton() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div>
        <p>Signed in as {session.user?.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }
  
  return (
    <button onClick={() => signIn()}>Sign in</button>
  )
}
```

### Protected API Routes

```tsx
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  return Response.json({ user: session.user })
}
```

### Middleware Protection

```tsx
// middleware.ts
import { auth } from "@/auth"

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/login") {
    const newUrl = new URL("/login", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

## Integration

This plugin automatically integrates with:

- **API Plugins**: Adds auth context to tRPC, GraphQL, and REST APIs
- **Database Plugins**: Configures database adapters for session storage
- **UI Plugins**: Provides auth components and hooks

## Documentation

- [Auth.js Documentation](https://authjs.dev)
- [Next.js Integration](https://authjs.dev/getting-started/installation?framework=next.js)
- [Providers](https://authjs.dev/getting-started/providers)