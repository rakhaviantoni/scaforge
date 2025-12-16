# @scaforge/plugin-auth-better

Better-Auth authentication plugin for Scaforge projects.

## Features

- 🔐 Complete Better-Auth setup
- 🎯 Type-safe authentication with full TypeScript support
- 🔒 Session management and middleware
- 🛡️ Protected routes and API endpoints
- 🎨 Customizable authentication flows
- 📱 Framework-specific implementations
- 🔗 Auto-integration with API and database plugins
- 🌐 Multi-session support
- 📧 Email verification and password reset
- 🔑 Social login providers
- 🛡️ Built-in security features (CSRF, rate limiting)

## Supported Templates

- ✅ Next.js (App Router)
- ✅ TanStack Start
- ✅ Nuxt 3
- ❌ Hydrogen (not supported)

## Installation

```bash
npx scaforge add auth-better
```

## Configuration

The plugin will prompt you to configure:

- Database adapter (Prisma, Drizzle, etc.)
- Social providers (Google, GitHub, Discord, etc.)
- Email provider for verification
- Session configuration
- Security settings

## Environment Variables

Add these to your `.env.local`:

```env
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Database (if using database sessions)
DATABASE_URL=your-database-url

# Email provider (for verification)
EMAIL_FROM=noreply@yourapp.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Social providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Usage

### Authentication Hooks

```tsx
import { useSession, signIn, signOut } from "@/lib/auth/client"

export function AuthButton() {
  const { data: session, isPending } = useSession()
  
  if (isPending) return <div>Loading...</div>
  
  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span>Welcome, {session.user.name}!</span>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    )
  }
  
  return (
    <button onClick={() => signIn.email({ email: "user@example.com" })}>
      Sign In
    </button>
  )
}
```

### Server-side Authentication

```tsx
import { auth } from "@/lib/auth/server"

export default async function ProtectedPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }
  
  return <div>Welcome, {session.user.name}!</div>
}
```

### API Route Protection

```tsx
import { auth } from "@/lib/auth/server"

export async function GET() {
  const session = await auth()
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  return Response.json({ user: session.user })
}
```

### Social Authentication

```tsx
import { signIn } from "@/lib/auth/client"

export function SocialButtons() {
  return (
    <div className="space-y-2">
      <button onClick={() => signIn.social({ provider: "google" })}>
        Sign in with Google
      </button>
      <button onClick={() => signIn.social({ provider: "github" })}>
        Sign in with GitHub
      </button>
    </div>
  )
}
```

## Integration

This plugin automatically integrates with:

- **API Plugins**: Adds Better-Auth context to tRPC, GraphQL, and REST APIs
- **Database Plugins**: Configures database adapters for user and session storage
- **Email Plugins**: Uses configured email provider for verification emails

## Advanced Features

### Multi-Session Support

```tsx
import { listSessions, revokeSession } from "@/lib/auth/client"

export function SessionManager() {
  const { data: sessions } = listSessions()
  
  return (
    <div>
      {sessions?.map((session) => (
        <div key={session.id}>
          <span>{session.userAgent}</span>
          <button onClick={() => revokeSession({ sessionId: session.id })}>
            Revoke
          </button>
        </div>
      ))}
    </div>
  )
}
```

### Two-Factor Authentication

```tsx
import { twoFactor } from "@/lib/auth/client"

export function TwoFactorSetup() {
  const { data: qrCode } = twoFactor.getTotpUri()
  
  return (
    <div>
      <img src={qrCode} alt="QR Code" />
      <button onClick={() => twoFactor.enable({ code: "123456" })}>
        Enable 2FA
      </button>
    </div>
  )
}
```

## Documentation

- [Better-Auth Documentation](https://better-auth.com)
- [API Reference](https://better-auth.com/docs/api)
- [Plugins](https://better-auth.com/docs/plugins)