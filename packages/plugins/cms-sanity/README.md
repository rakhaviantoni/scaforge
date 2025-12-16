# Sanity CMS Plugin

This plugin integrates Sanity CMS with your Scaforge project, providing a headless CMS solution with real-time collaboration and structured content.

## Features

- Sanity Studio integration
- TypeScript-first content modeling
- Real-time content updates
- Image optimization with Sanity CDN
- Unified CMS adapter interface
- Framework-specific implementations

## Installation

```bash
npx scaforge add cms-sanity
```

## Configuration

The plugin will prompt you for:
- Project ID
- Dataset name
- API version
- Studio configuration

## Usage

```typescript
import { sanityClient } from '@/lib/sanity/client';

// Fetch content
const posts = await sanityClient.fetch('*[_type == "post"]');

// Use the unified CMS adapter
import { cms } from '@/lib/cms';
const content = await cms.getDocument('post', 'slug');
```

## Environment Variables

Add these to your `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token
```