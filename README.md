# Scaforge

A modular, plug-and-play full-stack boilerplate ecosystem. Start minimal, extend infinitely.

## Features

- 🚀 **Minimal by default** - Start with just the framework and essentials
- 🔌 **Plugin system** - Add features as you need them
- 🎯 **Framework agnostic** - Support for Next.js, TanStack Start, Nuxt, and Hydrogen
- 🔄 **Auto-integration** - Plugins automatically wire up with each other
- 📦 **110+ plugins** - API, Auth, Database, CMS, Payments, and more

## Quick Start

```bash
# Create a new project
npx create-scaforge my-app

# Or use the CLI directly
npx scaforge init
```

## CLI Commands

### Initialize a Project

```bash
# Interactive mode
npx scaforge init

# With options
npx scaforge init --name my-app --template nextjs

# Skip prompts with defaults
npx scaforge init -y
```

**Available templates:**
- `nextjs` - Next.js 15 with App Router
- `tanstack` - TanStack Start with TanStack Router
- `nuxt` - Nuxt 3 with auto-imports
- `hydrogen` - Shopify Hydrogen storefront

### Add Plugins

```bash
# Interactive plugin selection
npx scaforge add

# Add specific plugin
npx scaforge add api-trpc
npx scaforge add db-prisma
npx scaforge add auth-clerk

# Skip confirmation
npx scaforge add api-trpc -y
```

### Remove Plugins

```bash
npx scaforge remove api-trpc

# Skip confirmation
npx scaforge remove api-trpc -y
```

### List Plugins

```bash
# List all available plugins
npx scaforge list

# List installed plugins
npx scaforge list --installed
```

### Update Plugins

```bash
# Check for updates
npx scaforge update --check-only

# Update all plugins
npx scaforge update

# Update specific plugin
npx scaforge update api-trpc

# Skip confirmation
npx scaforge update -y
```

## Plugin Categories

| Category | Plugins |
|----------|---------|
| **API** | tRPC, Apollo GraphQL, GraphQL Yoga, ORPC, REST |
| **Auth** | Auth.js, Clerk, Lucia, Better-Auth, Supabase Auth |
| **Database** | Prisma, Drizzle, Kysely |
| **CMS** | Sanity, Contentful, Strapi, Prismic, Payload |
| **Payments** | Stripe, LemonSqueezy, Paddle, Midtrans, Xendit |
| **Email** | Resend, SendGrid, Postmark, AWS SES |
| **Storage** | S3, Cloudflare R2, Uploadthing, Supabase Storage |
| **Analytics** | Vercel Analytics, Plausible, PostHog, Mixpanel |
| **Monitoring** | Sentry, LogRocket, Axiom |
| **Caching** | Redis, Upstash |
| **Jobs** | BullMQ, Inngest, Trigger.dev, QStash |
| **Search** | Algolia, Meilisearch, Typesense |
| **AI** | OpenAI, Anthropic, Google Gemini, Vercel AI SDK |
| **Real-time** | Pusher, Ably, Socket.io, Liveblocks |
| **i18n** | next-intl, i18next, Paraglide |
| **Forms** | React Hook Form, Conform |

## Configuration

Scaforge projects use a `scaforge.config.ts` file:

```typescript
import { defineConfig } from '@scaforge/core';

export default defineConfig({
  name: 'my-app',
  template: 'nextjs',
  plugins: {
    'api-trpc': {
      enabled: true,
      options: {
        batching: true,
      },
    },
    'db-prisma': {
      enabled: true,
      options: {
        provider: 'postgresql',
      },
    },
  },
  settings: {
    generateExamples: true,
    codeStyle: {
      semicolons: true,
      singleQuote: true,
      tabWidth: 2,
    },
  },
});
```

## Project Structure

```
my-app/
├── src/
│   ├── app/              # App routes (Next.js/TanStack)
│   ├── components/       # UI components
│   ├── lib/              # Utilities and helpers
│   └── server/           # Server-side code (API, etc.)
├── prisma/               # Database schema (if using Prisma)
├── public/               # Static assets
├── scaforge.config.ts    # Scaforge configuration
├── .env.example          # Environment variables template
└── package.json
```

## Plugin Development

### Creating a Plugin

```typescript
// packages/plugins/my-plugin/src/index.ts
import { definePlugin } from '@scaforge/core';
import { z } from 'zod';

export default definePlugin({
  name: 'my-plugin',
  displayName: 'My Plugin',
  category: 'api',
  description: 'A custom plugin',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'my-package': '^1.0.0',
    },
  },
  
  configSchema: z.object({
    apiKey: z.string().optional(),
  }),
  
  envVars: [
    {
      name: 'MY_PLUGIN_API_KEY',
      description: 'API key for My Plugin',
      required: true,
      secret: true,
    },
  ],
  
  files: [
    {
      path: 'src/lib/my-plugin.ts',
      template: `export const myPlugin = {
  apiKey: process.env.MY_PLUGIN_API_KEY,
};`,
    },
  ],
  
  integrations: [
    {
      plugin: 'api-trpc',
      type: 'middleware',
      files: [
        {
          path: 'src/server/trpc/middleware/my-plugin.ts',
          template: '// Integration with tRPC',
        },
      ],
    },
  ],
  
  postInstall: `
My Plugin has been configured!

Next steps:
1. Add MY_PLUGIN_API_KEY to your .env file
2. Import and use the plugin in your code
  `,
});
```

### Plugin Structure

```
packages/plugins/my-plugin/
├── src/
│   ├── index.ts              # Plugin definition
│   ├── templates/            # Framework-specific templates
│   │   ├── nextjs/
│   │   ├── tanstack/
│   │   ├── nuxt/
│   │   └── hydrogen/
│   └── integrations/         # Integration templates
├── package.json
└── README.md
```

### Plugin Definition Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique plugin identifier |
| `displayName` | string | Human-readable name |
| `category` | string | Plugin category for grouping |
| `description` | string | Short description |
| `version` | string | Semantic version |
| `supportedTemplates` | array | Supported framework templates |
| `dependencies` | array | Other plugins this depends on |
| `conflicts` | array | Plugins that conflict with this one |
| `packages` | object | NPM packages to install |
| `configSchema` | ZodType | Configuration validation schema |
| `envVars` | array | Required environment variables |
| `files` | array | Files to generate |
| `integrations` | array | Integration hooks with other plugins |
| `postInstall` | string | Post-installation instructions |

## Monorepo Structure

```
scaforge/
├── packages/
│   ├── cli/                  # @scaforge/cli
│   ├── core/                 # @scaforge/core
│   ├── create-scaforge/      # npx create-scaforge
│   ├── template-nextjs/      # Next.js template
│   ├── template-tanstack/    # TanStack Start template
│   ├── template-nuxt/        # Nuxt template
│   ├── template-hydrogen/    # Hydrogen template
│   └── plugins/              # All plugins
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Contributing

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/scaforge.git
cd scaforge

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run in development mode
pnpm dev
```

### Adding a New Plugin

1. Create a new directory in `packages/plugins/`
2. Add the plugin definition in `src/index.ts`
3. Create templates for each supported framework
4. Add integration templates if needed
5. Write tests for the plugin
6. Update the plugins README

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @scaforge/core test

# Run tests in watch mode
pnpm --filter @scaforge/cli test:watch
```

### Code Style

- TypeScript for all code
- ESLint for linting
- Prettier for formatting
- Vitest for testing

## License

MIT
