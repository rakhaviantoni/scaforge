# {{name}}

A Shopify Hydrogen storefront created with [Scaforge](https://github.com/scaforge/scaforge).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## What's Included

This template includes:

- **Shopify Hydrogen** framework for building storefronts
- **Remix** for full-stack web development
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **ESLint** for code linting
- **Basic UI Components** (Button, Card)

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your Shopify store credentials:
   ```
   PUBLIC_STOREFRONT_API_TOKEN=your-storefront-access-token
   PUBLIC_STORE_DOMAIN=your-shop-name.myshopify.com
   SESSION_SECRET=your-session-secret-here
   ```

## Shopify Configuration

To connect this storefront to your Shopify store:

1. Create a new Storefront API access token in your Shopify admin
2. Add the token and store domain to your `.env` file
3. Configure your storefront permissions in Shopify admin

## Adding Plugins

Extend your Hydrogen storefront with Scaforge plugins:

```bash
# Add authentication
npx scaforge add auth-clerk

# Add a database
npx scaforge add db-prisma

# Add analytics
npx scaforge add analytics-posthog

# List all available plugins
npx scaforge list
```

## Deployment

This Hydrogen storefront can be deployed to:

- **Shopify Oxygen** (recommended)
- **Cloudflare Workers**
- **Netlify**
- **Vercel**

For Oxygen deployment:
```bash
npx shopify hydrogen deploy
```

## Learn More

- [Hydrogen Documentation](https://hydrogen.shopify.dev)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- [Scaforge Documentation](https://scaforge.dev)
- [Remix Documentation](https://remix.run/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)