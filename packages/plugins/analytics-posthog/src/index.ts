/**
 * PostHog Analytics Plugin for Scaforge
 * Product analytics and feature flags with PostHog
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const analyticsPosthogPlugin = definePlugin({
  name: 'analytics-posthog',
  displayName: 'PostHog Analytics',
  category: 'analytics',
  description: 'Product analytics and feature flags with PostHog',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'posthog-js': '^1.96.0',
    },
    devDependencies: {
      'posthog-node': '^3.6.0',
    },
  },
  
  configSchema: z.object({
    capturePageviews: z.boolean().default(true),
    enableSessionRecordings: z.boolean().default(true),
    enableFeatureFlags: z.boolean().default(true),
    enableHeatmaps: z.boolean().default(false),
    enableConsoleLogging: z.boolean().default(false),
    disableGeoip: z.boolean().default(false),
    respectDnt: z.boolean().default(true),
    cookieless: z.boolean().default(false),
  }),
  
  envVars: [
    {
      name: 'NEXT_PUBLIC_POSTHOG_API_KEY',
      description: 'PostHog API key',
      required: true,
    },
    {
      name: 'NEXT_PUBLIC_POSTHOG_HOST',
      description: 'PostHog host URL (defaults to PostHog Cloud)',
      required: false,
      default: 'https://app.posthog.com',
    },
  ],
  
  files: [
    // PostHog client configuration
    {
      path: 'src/lib/posthog/client.ts',
      template: `import posthog from 'posthog-js';

export const initPostHog = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: {{options.capturePageviews}},
      session_recording: {
        enabled: {{options.enableSessionRecordings}},
      },
      disable_session_recording: !{{options.enableSessionRecordings}},
      enable_heatmaps: {{options.enableHeatmaps}},
      debug: {{options.enableConsoleLogging}},
      disable_geolocation: {{options.disableGeoip}},
      respect_dnt: {{options.respectDnt}},
      opt_out_capturing_by_default: false,
      {{#if options.cookieless}}
      persistence: 'memory',
      {{/if}}
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('PostHog loaded');
        }
      },
    });
  }
};

export { posthog };
`,
      overwrite: false,
    },
    
    // PostHog provider component
    {
      path: 'src/lib/posthog/provider.tsx',
      template: `'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { initPostHog, posthog } from './client';

interface PostHogContextType {
  posthog: typeof posthog;
}

const PostHogContext = createContext<PostHogContextType | null>(null);

interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    initPostHog();
    
    return () => {
      posthog.reset();
    };
  }, []);

  return (
    <PostHogContext.Provider value={{ posthog }}>
      {children}
    </PostHogContext.Provider>
  );
}

export function usePostHogContext() {
  const context = useContext(PostHogContext);
  if (!context) {
    throw new Error('usePostHogContext must be used within a PostHogProvider');
  }
  return context;
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // PostHog hooks
    {
      path: 'src/lib/posthog/hooks.ts',
      template: `'use client';

import { useEffect, useState } from 'react';
import { posthog } from './client';

export function usePostHog() {
  return posthog;
}

export function useFeatureFlag(flag: string): boolean | undefined {
  const [flagValue, setFlagValue] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkFlag = () => {
      const value = posthog.isFeatureEnabled(flag);
      setFlagValue(value);
    };

    // Check immediately
    checkFlag();

    // Listen for feature flag updates
    posthog.onFeatureFlags(checkFlag);

    return () => {
      // PostHog doesn't provide a way to remove specific listeners
      // so we'll just rely on component unmounting
    };
  }, [flag]);

  return flagValue;
}

export function useFeatureFlags(): Record<string, boolean | string> {
  const [flags, setFlags] = useState<Record<string, boolean | string>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateFlags = () => {
      const activeFlags = posthog.getFeatureFlags();
      setFlags(activeFlags);
    };

    // Check immediately
    updateFlags();

    // Listen for feature flag updates
    posthog.onFeatureFlags(updateFlags);
  }, []);

  return flags;
}

export function usePostHogIdentify() {
  return {
    identify: (userId: string, properties?: Record<string, any>) => {
      posthog.identify(userId, properties);
    },
    alias: (alias: string) => {
      posthog.alias(alias);
    },
    reset: () => {
      posthog.reset();
    },
  };
}

export function usePostHogCapture() {
  return {
    capture: (event: string, properties?: Record<string, any>) => {
      posthog.capture(event, properties);
    },
    captureException: (error: Error, properties?: Record<string, any>) => {
      posthog.capture('$exception', {
        $exception_message: error.message,
        $exception_type: error.name,
        $exception_stack_trace_raw: error.stack,
        ...properties,
      });
    },
  };
}
`,
      overwrite: false,
    },
    
    // Server-side PostHog utilities
    {
      path: 'src/lib/posthog/server.ts',
      template: `import { PostHog } from 'posthog-node';

let posthogServer: PostHog | null = null;

export function getPostHogServer(): PostHog {
  if (!posthogServer && process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
    posthogServer = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    });
  }
  
  if (!posthogServer) {
    throw new Error('PostHog server instance not initialized. Check your API key.');
  }
  
  return posthogServer;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
) {
  try {
    const posthog = getPostHogServer();
    await posthog.capture({
      distinctId,
      event,
      properties,
    });
  } catch (error) {
    console.error('Failed to capture server event:', error);
  }
}

export async function identifyServerUser(
  distinctId: string,
  properties?: Record<string, any>
) {
  try {
    const posthog = getPostHogServer();
    await posthog.identify({
      distinctId,
      properties,
    });
  } catch (error) {
    console.error('Failed to identify server user:', error);
  }
}

export async function getServerFeatureFlag(
  flag: string,
  distinctId: string,
  groups?: Record<string, string>
): Promise<boolean | string | undefined> {
  try {
    const posthog = getPostHogServer();
    return await posthog.getFeatureFlag(flag, distinctId, groups);
  } catch (error) {
    console.error('Failed to get server feature flag:', error);
    return undefined;
  }
}

export async function shutdownPostHogServer() {
  if (posthogServer) {
    await posthogServer.shutdown();
    posthogServer = null;
  }
}
`,
      overwrite: false,
    },
    
    // PostHog page view tracker
    {
      path: 'src/lib/posthog/page-view.tsx',
      template: `'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { posthog } from './client';

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && {{options.capturePageviews}}) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + '?' + searchParams.toString();
      }
      
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Feature flag component
    {
      path: 'src/components/posthog/feature-flag.tsx',
      template: `'use client';

import { ReactNode } from 'react';
import { useFeatureFlag } from '@/lib/posthog/hooks';

interface FeatureFlagProps {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

export function FeatureFlag({ 
  flag, 
  children, 
  fallback = null,
  loading = null 
}: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag);

  if (isEnabled === undefined) {
    return <>{loading}</>;
  }

  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

interface FeatureFlagVariantProps {
  flag: string;
  variants: Record<string, ReactNode>;
  fallback?: ReactNode;
  loading?: ReactNode;
}

export function FeatureFlagVariant({
  flag,
  variants,
  fallback = null,
  loading = null,
}: FeatureFlagVariantProps) {
  const variant = useFeatureFlag(flag);

  if (variant === undefined) {
    return <>{loading}</>;
  }

  if (typeof variant === 'string' && variants[variant]) {
    return <>{variants[variant]}</>;
  }

  if (typeof variant === 'boolean' && variant && variants.true) {
    return <>{variants.true}</>;
  }

  if (typeof variant === 'boolean' && !variant && variants.false) {
    return <>{variants.false}</>;
  }

  return <>{fallback}</>;
}
`,
      overwrite: false,
    },
    
    // Analytics tracking component
    {
      path: 'src/components/posthog/analytics-tracker.tsx',
      template: `'use client';

import { useEffect } from 'react';
import { usePostHogCapture } from '@/lib/posthog/hooks';

interface AnalyticsTrackerProps {
  event: string;
  properties?: Record<string, any>;
  trigger?: 'mount' | 'unmount' | 'both';
  children?: React.ReactNode;
}

export function AnalyticsTracker({
  event,
  properties,
  trigger = 'mount',
  children,
}: AnalyticsTrackerProps) {
  const { capture } = usePostHogCapture();

  useEffect(() => {
    if (trigger === 'mount' || trigger === 'both') {
      capture(event, properties);
    }

    return () => {
      if (trigger === 'unmount' || trigger === 'both') {
        capture(\`\${event}_end\`, properties);
      }
    };
  }, [event, properties, trigger, capture]);

  return <>{children}</>;
}

interface ClickTrackerProps {
  event: string;
  properties?: Record<string, any>;
  children: React.ReactElement;
}

export function ClickTracker({ event, properties, children }: ClickTrackerProps) {
  const { capture } = usePostHogCapture();

  const handleClick = (originalOnClick?: () => void) => {
    return (e: React.MouseEvent) => {
      capture(event, {
        ...properties,
        element_type: e.currentTarget.tagName.toLowerCase(),
        element_text: e.currentTarget.textContent?.slice(0, 100),
      });
      
      if (originalOnClick) {
        originalOnClick();
      }
    };
  };

  return React.cloneElement(children, {
    onClick: handleClick(children.props.onClick),
  });
}
`,
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/posthog-example.tsx',
      template: `'use client';

import { useState } from 'react';
import { usePostHog, useFeatureFlag, usePostHogCapture, usePostHogIdentify } from '@/lib/posthog/hooks';
import { FeatureFlag, FeatureFlagVariant } from '@/components/posthog/feature-flag';
import { ClickTracker, AnalyticsTracker } from '@/components/posthog/analytics-tracker';

export function PostHogExample() {
  const posthog = usePostHog();
  const { capture } = usePostHogCapture();
  const { identify, reset } = usePostHogIdentify();
  const [userId, setUserId] = useState('');
  
  const showNewButton = useFeatureFlag('new-button-design');
  const buttonVariant = useFeatureFlag('button-color-test');

  const handleIdentify = () => {
    if (userId) {
      identify(userId, {
        email: \`\${userId}@example.com\`,
        plan: 'free',
        signup_date: new Date().toISOString(),
      });
      capture('user_identified', { user_id: userId });
    }
  };

  const handleReset = () => {
    reset();
    setUserId('');
    capture('user_reset');
  };

  const handleCustomEvent = () => {
    capture('custom_event_triggered', {
      source: 'example_component',
      timestamp: Date.now(),
    });
  };

  return (
    <AnalyticsTracker event="posthog_example_viewed" properties={{ component: 'PostHogExample' }}>
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">PostHog Analytics</h2>
        
        {/* User Identification */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-medium mb-3">User Identification</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Enter user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button
              onClick={handleIdentify}
              disabled={!userId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Identify
            </button>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Reset User
          </button>
        </div>

        {/* Event Tracking */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Event Tracking</h3>
          <div className="space-y-2">
            <ClickTracker 
              event="button_clicked" 
              properties={{ button_type: 'custom_event', location: 'example' }}
            >
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Track Custom Event
              </button>
            </ClickTracker>
            
            <ClickTracker 
              event="cta_clicked" 
              properties={{ cta_type: 'signup', position: 'example' }}
            >
              <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                Track CTA Click
              </button>
            </ClickTracker>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Feature Flags</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Feature flag: <code>new-button-design</code>
              </p>
              <FeatureFlag 
                flag="new-button-design"
                fallback={
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-md">
                    Old Button Design
                  </button>
                }
                loading={<div className="text-gray-500">Loading...</div>}
              >
                <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg">
                  ✨ New Button Design
                </button>
              </FeatureFlag>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                Variant flag: <code>button-color-test</code>
              </p>
              <FeatureFlagVariant
                flag="button-color-test"
                variants={{
                  red: <button className="px-4 py-2 bg-red-600 text-white rounded-md">Red Variant</button>,
                  blue: <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Blue Variant</button>,
                  green: <button className="px-4 py-2 bg-green-600 text-white rounded-md">Green Variant</button>,
                }}
                fallback={<button className="px-4 py-2 bg-gray-600 text-white rounded-md">Default Button</button>}
                loading={<div className="text-gray-500">Loading variant...</div>}
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-green-800">
            ✅ PostHog is configured and tracking events!
          </p>
          <p className="text-sm text-green-600 mt-1">
            Check your PostHog dashboard to see the events and user data.
          </p>
        </div>
      </div>
    </AnalyticsTracker>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
  ],
  
  integrations: [
    {
      plugin: 'auth-*',
      type: 'hook',
      files: [
        {
          path: 'src/lib/posthog/auth-integration.ts',
          template: `import { useEffect } from 'react';
import { usePostHogIdentify } from './hooks';

export function usePostHogAuth(user: any) {
  const { identify, reset } = usePostHogIdentify();

  useEffect(() => {
    if (user) {
      identify(user.id, {
        email: user.email,
        name: user.name,
        plan: user.plan || 'free',
        created_at: user.createdAt,
      });
    } else {
      reset();
    }
  }, [user, identify, reset]);
}
`,
        },
      ],
    },
  ],
  
  postInstall: `🚀 PostHog Analytics has been configured successfully!

Next steps:
1. Set up your PostHog account:
   - Visit https://app.posthog.com (or your self-hosted instance)
   - Create a project and get your API key
   - Add it to your environment variables

2. Add the PostHogProvider to your app:
   {{#if (eq template 'nextjs')}}
   \`\`\`tsx
   // app/layout.tsx
   import { PostHogProvider } from '@/lib/posthog/provider';
   import { PostHogPageView } from '@/lib/posthog/page-view';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <PostHogProvider>
             <PostHogPageView />
             {children}
           </PostHogProvider>
         </body>
       </html>
     );
   }
   \`\`\`
   {{/if}}

3. Start tracking events:
   \`\`\`tsx
   import { usePostHogCapture } from '@/lib/posthog/hooks';
   
   const { capture } = usePostHogCapture();
   capture('button_clicked', { button_name: 'signup' });
   \`\`\`

4. Use feature flags:
   \`\`\`tsx
   import { useFeatureFlag } from '@/lib/posthog/hooks';
   
   const showNewFeature = useFeatureFlag('new-feature');
   \`\`\`

Configuration options:
- Capture pageviews: {{options.capturePageviews}}
- Session recordings: {{options.enableSessionRecordings}}
- Feature flags: {{options.enableFeatureFlags}}
- Heatmaps: {{options.enableHeatmaps}}

Documentation: https://posthog.com/docs`,
});

export default analyticsPosthogPlugin;