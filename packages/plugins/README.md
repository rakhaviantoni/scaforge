# Scaforge Plugins

This directory contains all Scaforge plugins organized by category.

## Plugin Categories

- **api-*** - API providers (tRPC, Apollo, Yoga, ORPC, REST)
- **auth-*** - Authentication (Auth.js, Clerk, Lucia, Better-Auth)
- **db-*** - Database ORMs (Prisma, Drizzle, Kysely)
- **cms-*** - Content Management Systems
- **payments-*** - Payment processors
- **email-*** - Email services
- **storage-*** - File storage
- **analytics-*** - Analytics platforms
- **monitoring-*** - Error monitoring
- **cache-*** - Caching solutions
- **jobs-*** - Background job processing
- **search-*** - Search engines
- **ai-*** - AI/ML integrations
- And many more...

## Creating a Plugin

Each plugin should follow this structure:

```
packages/plugins/plugin-name/
├── src/
│   ├── index.ts              # Plugin definition export
│   ├── templates/            # File templates per framework
│   │   ├── nextjs/
│   │   ├── tanstack/
│   │   ├── nuxt/
│   │   └── hydrogen/
│   └── integrations/         # Integration templates
├── package.json
└── README.md
```

See `@scaforge/core` for the `definePlugin` helper and type definitions.
