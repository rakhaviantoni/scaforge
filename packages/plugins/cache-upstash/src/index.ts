/**
 * Upstash Redis Cache Plugin for Scaforge
 * Serverless Redis caching with Upstash
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const cacheUpstashPlugin = definePlugin({
  name: 'cache-upstash',
  displayName: 'Upstash Redis Cache',
  category: 'caching',
  description: 'Serverless Redis caching with Upstash',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      '@upstash/redis': '^1.28.0',
      '@upstash/ratelimit': '^1.0.0',
    },
  },
  
  configSchema: z.object({
    defaultTtl: z.number().default(3600), // 1 hour
    enableRateLimit: z.boolean().default(true),
    rateLimitRequests: z.number().default(100),
    rateLimitWindow: z.string().default('1h'),
    enableCompression: z.boolean().default(false),
    keyPrefix: z.string().default('app'),
    enablePatternInvalidation: z.boolean().default(true),
  }),
  
  envVars: [
    {
      name: 'UPSTASH_REDIS_REST_URL',
      description: 'Upstash Redis REST URL',
      required: true,
    },
    {
      name: 'UPSTASH_REDIS_REST_TOKEN',
      description: 'Upstash Redis REST Token',
      required: true,
      secret: true,
    },
  ],
  
  files: [
    // Upstash Redis client
    {
      path: 'src/lib/upstash/client.ts',
      template: `import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default redis;
`,
      overwrite: false,
    },
    
    // Cache utilities
    {
      path: 'src/lib/upstash/cache.ts',
      template: `import { redis } from './client';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
}

export class UpstashCache {
  private keyPrefix = '{{options.keyPrefix}}';
  private defaultTtl = {{options.defaultTtl}};
  private enableCompression = {{options.enableCompression}};

  private getKey(key: string): string {
    return \`\${this.keyPrefix}:\${key}\`;
  }

  private serialize(value: any): string {
    const serialized = JSON.stringify(value);
    
    if (this.enableCompression && serialized.length > 1000) {
      // Simple compression could be added here
      return serialized;
    }
    
    return serialized;
  }

  private deserialize(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(this.getKey(key));
      
      if (value === null) {
        return null;
      }
      
      return this.deserialize(value as string);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    try {
      const serialized = this.serialize(value);
      const ttl = options.ttl || this.defaultTtl;
      
      if (ttl > 0) {
        await redis.setex(this.getKey(key), ttl, serialized);
      } else {
        await redis.set(this.getKey(key), serialized);
      }
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await redis.del(this.getKey(key));
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(this.getKey(key));
      return result > 0;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(this.getKey(key));
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await redis.expire(this.getKey(key), seconds);
      return result > 0;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  {{#if options.enablePatternInvalidation}}
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(\`\${this.keyPrefix}:\${pattern}\`);
      
      if (keys.length === 0) {
        return 0;
      }
      
      const result = await redis.del(...keys);
      return result;
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
      return 0;
    }
  }
  {{/if}}

  async flush(): Promise<boolean> {
    try {
      await redis.flushall();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Atomic operations
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await redis.incrby(this.getKey(key), by);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    try {
      return await redis.decrby(this.getKey(key), by);
    } catch (error) {
      console.error('Cache decrement error:', error);
      return 0;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<any> {
    try {
      const value = await redis.hget(this.getKey(key), field);
      return value ? this.deserialize(value as string) : null;
    } catch (error) {
      console.error('Cache hget error:', error);
      return null;
    }
  }

  async hset(key: string, field: string, value: any): Promise<boolean> {
    try {
      const serialized = this.serialize(value);
      const result = await redis.hset(this.getKey(key), { [field]: serialized });
      return result > 0;
    } catch (error) {
      console.error('Cache hset error:', error);
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    try {
      const hash = await redis.hgetall(this.getKey(key));
      const result: Record<string, any> = {};
      
      for (const [field, value] of Object.entries(hash)) {
        result[field] = this.deserialize(value as string);
      }
      
      return result;
    } catch (error) {
      console.error('Cache hgetall error:', error);
      return {};
    }
  }
}

export const cache = new UpstashCache();
`,
      overwrite: false,
    },
    
    // Rate limiting
    {
      path: 'src/lib/upstash/rate-limit.ts',
      template: `import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './client';

export interface RateLimitOptions {
  requests: number;
  window: string; // e.g., '1s', '1m', '1h', '1d'
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

class UpstashRateLimit {
  private rateLimiters = new Map<string, Ratelimit>();

  private getRateLimiter(options: RateLimitOptions): Ratelimit {
    const key = \`\${options.requests}-\${options.window}\`;
    
    if (!this.rateLimiters.has(key)) {
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.requests, options.window),
        analytics: true,
      });
      
      this.rateLimiters.set(key, ratelimit);
    }
    
    return this.rateLimiters.get(key)!;
  }

  async limit(
    identifier: string,
    options: RateLimitOptions = {
      requests: {{options.rateLimitRequests}},
      window: '{{options.rateLimitWindow}}',
    }
  ): Promise<RateLimitResult> {
    try {
      const ratelimit = this.getRateLimiter(options);
      const result = await ratelimit.limit(identifier);
      
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset),
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      
      // Fail open - allow the request if rate limiting fails
      return {
        success: true,
        limit: options.requests,
        remaining: options.requests - 1,
        reset: new Date(Date.now() + 60000), // 1 minute from now
      };
    }
  }

  // Predefined rate limiters for common use cases
  async limitAPI(identifier: string): Promise<RateLimitResult> {
    return this.limit(\`api:\${identifier}\`, {
      requests: 100,
      window: '1h',
    });
  }

  async limitAuth(identifier: string): Promise<RateLimitResult> {
    return this.limit(\`auth:\${identifier}\`, {
      requests: 5,
      window: '15m',
    });
  }

  async limitUpload(identifier: string): Promise<RateLimitResult> {
    return this.limit(\`upload:\${identifier}\`, {
      requests: 10,
      window: '1h',
    });
  }

  async limitSearch(identifier: string): Promise<RateLimitResult> {
    return this.limit(\`search:\${identifier}\`, {
      requests: 50,
      window: '1m',
    });
  }
}

export const rateLimit = new UpstashRateLimit();
`,
      overwrite: false,
    },
    
    // Cache hooks for React
    {
      path: 'src/lib/upstash/hooks.ts',
      template: `'use client';

import { useState, useEffect, useCallback } from 'react';
import { cache, CacheOptions } from './cache';

export interface UseCacheOptions extends CacheOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

export interface UseCacheResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  mutate: (data?: T) => Promise<void>;
  revalidate: () => Promise<void>;
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (useCache = true) => {
    try {
      setError(null);
      
      // Try cache first
      if (useCache) {
        const cached = await cache.get<T>(key);
        if (cached !== null) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }
      
      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the result
      await cache.set(key, freshData, options);
      
      setData(freshData);
      setLoading(false);
      
      return freshData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setLoading(false);
      throw error;
    }
  }, [key, fetcher, options]);

  const mutate = useCallback(async (newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
      await cache.set(key, newData, options);
    } else {
      await fetchData(false);
    }
  }, [key, fetchData, options]);

  const revalidate = useCallback(async () => {
    setLoading(true);
    await fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Revalidate on focus
  useEffect(() => {
    if (!options.revalidateOnFocus) return;

    const handleFocus = () => {
      fetchData(false);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, options.revalidateOnFocus]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!options.revalidateOnReconnect) return;

    const handleOnline = () => {
      fetchData(false);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchData, options.revalidateOnReconnect]);

  // Refresh interval
  useEffect(() => {
    if (!options.refreshInterval) return;

    const interval = setInterval(() => {
      fetchData(false);
    }, options.refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, options.refreshInterval]);

  return {
    data,
    error,
    loading,
    mutate,
    revalidate,
  };
}

export function useCacheValue<T>(key: string): {
  value: T | null;
  setValue: (value: T, options?: CacheOptions) => Promise<void>;
  deleteValue: () => Promise<void>;
} {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    cache.get<T>(key).then(setValue);
  }, [key]);

  const setValueAndCache = useCallback(async (newValue: T, options?: CacheOptions) => {
    setValue(newValue);
    await cache.set(key, newValue, options);
  }, [key]);

  const deleteValue = useCallback(async () => {
    setValue(null);
    await cache.del(key);
  }, [key]);

  return {
    value,
    setValue: setValueAndCache,
    deleteValue,
  };
}
`,
      overwrite: false,
    },
    
    // Cache middleware for API routes
    {
      path: 'src/lib/upstash/middleware.ts',
      template: `import { NextRequest, NextResponse } from 'next/server';
import { cache } from './cache';
import { rateLimit } from './rate-limit';

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: NextRequest) => string;
  skipCache?: (req: NextRequest) => boolean;
  enableRateLimit?: boolean;
  rateLimitOptions?: {
    requests: number;
    window: string;
  };
}

export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CacheMiddlewareOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const {
      ttl = {{options.defaultTtl}},
      keyGenerator = (req) => \`api:\${req.url}\`,
      skipCache = () => false,
      enableRateLimit = {{options.enableRateLimit}},
      rateLimitOptions = {
        requests: {{options.rateLimitRequests}},
        window: '{{options.rateLimitWindow}}',
      },
    } = options;

    // Rate limiting
    if (enableRateLimit) {
      const identifier = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
      const rateLimitResult = await rateLimit.limit(identifier, rateLimitOptions);
      
      if (!rateLimitResult.success) {
        return new NextResponse('Rate limit exceeded', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
          },
        });
      }
    }

    // Skip cache for certain requests
    if (skipCache(req) || req.method !== 'GET') {
      return handler(req);
    }

    const cacheKey = keyGenerator(req);

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return new NextResponse(JSON.stringify(cached), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      });
    }

    // Execute handler
    const response = await handler(req);
    
    // Cache successful responses
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      try {
        const responseData = await response.json();
        await cache.set(cacheKey, responseData, { ttl });
        
        return new NextResponse(JSON.stringify(responseData), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'MISS',
          },
        });
      } catch {
        // If we can't parse JSON, return original response
        return response;
      }
    }

    return response;
  };
}

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    requests: number;
    window: string;
    keyGenerator?: (req: NextRequest) => string;
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const {
      requests,
      window,
      keyGenerator = (req) => req.ip || req.headers.get('x-forwarded-for') || 'anonymous',
    } = options;

    const identifier = keyGenerator(req);
    const result = await rateLimit.limit(identifier, { requests, window });

    if (!result.success) {
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toISOString(),
        },
      });
    }

    const response = await handler(req);
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.reset.toISOString());

    return response;
  };
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/upstash-example.tsx',
      template: `'use client';

import { useState, useEffect } from 'react';
import { useCache, useCacheValue } from '@/lib/upstash/hooks';
import { cache } from '@/lib/upstash/cache';
import { rateLimit } from '@/lib/upstash/rate-limit';

// Mock data fetcher
const fetchUserData = async (userId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    id: userId,
    name: \`User \${userId}\`,
    email: \`user\${userId}@example.com\`,
    lastLogin: new Date().toISOString(),
  };
};

export function UpstashExample() {
  const [userId, setUserId] = useState('123');
  const [rateLimitResult, setRateLimitResult] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);

  // Use cache hook for user data
  const { data: userData, loading, error, mutate, revalidate } = useCache(
    \`user:\${userId}\`,
    () => fetchUserData(userId),
    { 
      ttl: 300, // 5 minutes
      revalidateOnFocus: true,
    }
  );

  // Use cache value hook for simple values
  const { value: counter, setValue: setCounter } = useCacheValue<number>('example:counter');

  const handleTestRateLimit = async () => {
    const result = await rateLimit.limit('example:test', {
      requests: 5,
      window: '1m',
    });
    setRateLimitResult(result);
  };

  const handleIncrementCounter = async () => {
    const newValue = (counter || 0) + 1;
    await setCounter(newValue, { ttl: 3600 });
  };

  const handleCacheOperations = async () => {
    // Test various cache operations
    await cache.set('test:string', 'Hello World', { ttl: 60 });
    await cache.set('test:object', { foo: 'bar', timestamp: Date.now() }, { ttl: 60 });
    await cache.set('test:number', 42, { ttl: 60 });

    const stringValue = await cache.get('test:string');
    const objectValue = await cache.get('test:object');
    const numberValue = await cache.get('test:number');
    const ttl = await cache.ttl('test:string');

    setCacheStats({
      string: stringValue,
      object: objectValue,
      number: numberValue,
      ttl,
    });
  };

  const handleInvalidatePattern = async () => {
    {{#if options.enablePatternInvalidation}}
    const deleted = await cache.invalidatePattern('test:*');
    alert(\`Deleted \${deleted} keys matching pattern 'test:*'\`);
    {{else}}
    alert('Pattern invalidation is disabled in configuration');
    {{/if}}
  };

  useEffect(() => {
    // Initialize counter if not set
    if (counter === null) {
      setCounter(0, { ttl: 3600 });
    }
  }, [counter, setCounter]);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Upstash Redis Cache</h2>
      
      {/* User Data Cache */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-medium mb-3">Cached User Data</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <button
            onClick={revalidate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {loading && <div className="text-gray-500">Loading user data...</div>}
        {error && <div className="text-red-600">Error: {error.message}</div>}
        {userData && (
          <div className="bg-gray-50 p-3 rounded">
            <pre className="text-sm">{JSON.stringify(userData, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Counter Example */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-medium mb-3">Cached Counter</h3>
        <div className="flex items-center gap-3">
          <span className="text-lg">Count: {counter || 0}</span>
          <button
            onClick={handleIncrementCounter}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Increment
          </button>
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-medium mb-3">Rate Limiting</h3>
        <button
          onClick={handleTestRateLimit}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 mb-3"
        >
          Test Rate Limit (5 requests/minute)
        </button>
        
        {rateLimitResult && (
          <div className={\`p-3 rounded \${rateLimitResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}\`}>
            <div>Success: {rateLimitResult.success ? 'Yes' : 'No'}</div>
            <div>Limit: {rateLimitResult.limit}</div>
            <div>Remaining: {rateLimitResult.remaining}</div>
            <div>Reset: {rateLimitResult.reset.toLocaleTimeString()}</div>
          </div>
        )}
      </div>

      {/* Cache Operations */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-medium mb-3">Cache Operations</h3>
        <div className="space-x-2 mb-3">
          <button
            onClick={handleCacheOperations}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Test Cache Operations
          </button>
          <button
            onClick={handleInvalidatePattern}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Clear Test Cache
          </button>
        </div>
        
        {cacheStats && (
          <div className="bg-gray-50 p-3 rounded">
            <pre className="text-sm">{JSON.stringify(cacheStats, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="p-4 bg-green-50 rounded-lg">
        <p className="text-green-800">
          ✅ Upstash Redis is configured and working!
        </p>
        <p className="text-sm text-green-600 mt-1">
          Cache TTL: {{options.defaultTtl}}s | Rate Limiting: {{options.enableRateLimit}} | Compression: {{options.enableCompression}}
        </p>
      </div>
    </div>
  );
}
`,
      overwrite: false,
    },
  ],
  
  postInstall: `🚀 Upstash Redis Cache has been configured successfully!

Next steps:
1. Set up your Upstash Redis database at https://console.upstash.com
2. Copy the REST URL and token to your environment variables
3. Start using the cache utilities in your application

Documentation: https://docs.upstash.com/redis`,
});

export default cacheUpstashPlugin;