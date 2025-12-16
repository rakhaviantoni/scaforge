# Upstash Redis Cache Plugin

Serverless Redis caching with Upstash.

## Features

- Serverless Redis database
- Built-in rate limiting
- Edge-compatible caching
- Automatic serialization/deserialization
- TTL (Time To Live) support
- Pattern-based cache invalidation

## Installation

```bash
npx scaforge add cache-upstash
```

## Configuration

The plugin will prompt you for:
- Default TTL for cache entries
- Enable rate limiting
- Rate limit configuration
- Enable cache compression
- Cache key prefix

## Environment Variables

```env
UPSTASH_REDIS_REST_URL=your_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_redis_rest_token
```

## Usage

### Basic Caching

```tsx
import { cache } from '@/lib/upstash/cache';

// Set cache
await cache.set('user:123', userData, { ttl: 3600 }); // 1 hour

// Get cache
const userData = await cache.get('user:123');

// Delete cache
await cache.del('user:123');
```

### Cache with Hooks

```tsx
import { useCache } from '@/lib/upstash/hooks';

function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error, mutate } = useCache(
    `user:${userId}`,
    () => fetchUser(userId),
    { ttl: 3600 }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Hello, {data.name}!</div>;
}
```

### Rate Limiting

```tsx
import { rateLimit } from '@/lib/upstash/rate-limit';

// In API route
const { success, limit, reset, remaining } = await rateLimit.limit(
  `api:${userId}`,
  { requests: 10, window: '1m' }
);

if (!success) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

## Documentation

- [Upstash Documentation](https://docs.upstash.com/)
- [Redis Commands](https://docs.upstash.com/redis/features/restapi)
- [Rate Limiting](https://docs.upstash.com/redis/sdks/ratelimit-js/overview)