# {{name}}

A modern full-stack React application built with [TanStack Start](https://tanstack.com/start), TypeScript, and Tailwind CSS.

## Features

- ⚡ **TanStack Start** - Full-stack React framework with file-based routing
- 🔒 **TypeScript** - End-to-end type safety
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🧩 **Modular Architecture** - Extend with Scaforge plugins
- 📱 **Responsive Design** - Mobile-first approach
- 🛠️ **Developer Experience** - Hot reload, TypeScript, ESLint

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript compiler

## Project Structure

```
{{name}}/
├── app/
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions
│   ├── routes/              # File-based routing
│   ├── client.tsx           # Client entry point
│   ├── router.tsx           # Router configuration
│   └── ssr.tsx              # Server entry point
├── public/                  # Static assets
└── ...config files
```

## Extending Your App

Add functionality with Scaforge plugins:

```bash
# Add API layer
npx scaforge add api-trpc

# Add authentication
npx scaforge add auth-clerk

# Add database
npx scaforge add db-prisma

# List all available plugins
npx scaforge list
```

## Learn More

- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [Scaforge Documentation](https://scaforge.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## Deployment

This app can be deployed to any platform that supports Node.js:

- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [Railway](https://railway.app)
- [Render](https://render.com)

Refer to the TanStack Start deployment guide for platform-specific instructions.