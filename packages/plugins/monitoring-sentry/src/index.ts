/**
 * Sentry Error Monitoring Plugin for Scaforge
 * Error tracking and performance monitoring with Sentry
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const monitoringSentryPlugin = definePlugin({
  name: 'monitoring-sentry',
  displayName: 'Sentry Error Monitoring',
  category: 'monitoring',
  description: 'Error tracking and performance monitoring with Sentry',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      '@sentry/nextjs': '^7.99.0',
    },
    devDependencies: {
      '@sentry/webpack-plugin': '^2.13.0',
    },
  },
  
  configSchema: z.object({
    environment: z.string().default('production'),
    sampleRate: z.number().min(0).max(1).default(1.0),
    tracesSampleRate: z.number().min(0).max(1).default(0.1),
    profilesSampleRate: z.number().min(0).max(1).default(0.1),
    enableUserContext: z.boolean().default(true),
    enableBreadcrumbs: z.boolean().default(true),
    enableProfiling: z.boolean().default(false),
    enableSourceMaps: z.boolean().default(true),
    enableTunneling: z.boolean().default(false),
    beforeSend: z.string().optional(),
  }),
  
  envVars: [
    {
      name: 'NEXT_PUBLIC_SENTRY_DSN',
      description: 'Sentry DSN for client-side error reporting',
      required: true,
    },
    {
      name: 'SENTRY_DSN',
      description: 'Sentry DSN for server-side error reporting',
      required: false,
    },
    {
      name: 'SENTRY_ORG',
      description: 'Sentry organization slug',
      required: false,
    },
    {
      name: 'SENTRY_PROJECT',
      description: 'Sentry project slug',
      required: false,
    },
    {
      name: 'SENTRY_AUTH_TOKEN',
      description: 'Sentry auth token for source map uploads',
      required: false,
      secret: true,
    },
  ],
  
  files: [
    // Sentry configuration
    {
      path: 'sentry.client.config.ts',
      template: `import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  environment: '{{options.environment}}',
  
  // Performance monitoring
  tracesSampleRate: {{options.tracesSampleRate}},
  
  // Profiling
  {{#if options.enableProfiling}}
  profilesSampleRate: {{options.profilesSampleRate}},
  {{/if}}
  
  // Error filtering and sampling
  sampleRate: {{options.sampleRate}},
  
  // User context
  {{#if options.enableUserContext}}
  initialScope: {
    tags: {
      component: 'client',
    },
  },
  {{/if}}
  
  // Breadcrumbs
  {{#if options.enableBreadcrumbs}}
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level !== 'error') {
      return null;
    }
    return breadcrumb;
  },
  {{/if}}
  
  // Custom error filtering
  {{#if options.beforeSend}}
  beforeSend(event, hint) {
    // Custom filtering logic
    {{{options.beforeSend}}}
    return event;
  },
  {{else}}
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry would capture:', event);
      return null;
    }
    return event;
  },
  {{/if}}
  
  // Integration configuration
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for navigation transactions
      routingInstrumentation: Sentry.nextRouterInstrumentation,
    }),
    {{#if options.enableProfiling}}
    new Sentry.BrowserProfilingIntegration(),
    {{/if}}
  ],
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
});
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Server-side Sentry configuration
    {
      path: 'sentry.server.config.ts',
      template: `import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  environment: '{{options.environment}}',
  
  // Performance monitoring
  tracesSampleRate: {{options.tracesSampleRate}},
  
  // Profiling
  {{#if options.enableProfiling}}
  profilesSampleRate: {{options.profilesSampleRate}},
  {{/if}}
  
  // Error filtering and sampling
  sampleRate: {{options.sampleRate}},
  
  // Server-specific configuration
  initialScope: {
    tags: {
      component: 'server',
    },
  },
  
  // Custom error filtering
  {{#if options.beforeSend}}
  beforeSend(event, hint) {
    // Custom filtering logic
    {{{options.beforeSend}}}
    return event;
  },
  {{else}}
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry would capture:', event);
      return null;
    }
    return event;
  },
  {{/if}}
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
});
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Edge runtime configuration
    {
      path: 'sentry.edge.config.ts',
      template: `import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  environment: '{{options.environment}}',
  
  // Performance monitoring
  tracesSampleRate: {{options.tracesSampleRate}},
  
  // Error filtering and sampling
  sampleRate: {{options.sampleRate}},
  
  // Edge-specific configuration
  initialScope: {
    tags: {
      component: 'edge',
    },
  },
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
});
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Sentry utilities
    {
      path: 'src/lib/sentry/utils.ts',
      template: `import * as Sentry from '@sentry/nextjs';

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(
  message: string, 
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureMessage(message, level);
  });
}

export function setUserContext(user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}) {
  Sentry.setUser(user);
}

export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

export function setTags(tags: Record<string, string>) {
  Sentry.setTags(tags);
}

export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) {
  Sentry.addBreadcrumb(breadcrumb);
}

export function startTransaction(name: string, op?: string) {
  return Sentry.startTransaction({ name, op });
}

export function withSentryTransaction<T>(
  name: string,
  op: string,
  callback: () => T
): T {
  const transaction = Sentry.startTransaction({ name, op });
  
  try {
    const result = callback();
    
    if (result instanceof Promise) {
      return result
        .then((res) => {
          transaction.setStatus('ok');
          transaction.finish();
          return res;
        })
        .catch((error) => {
          transaction.setStatus('internal_error');
          transaction.finish();
          throw error;
        }) as T;
    }
    
    transaction.setStatus('ok');
    transaction.finish();
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    transaction.finish();
    throw error;
  }
}

export function configureScope(callback: (scope: Sentry.Scope) => void) {
  Sentry.configureScope(callback);
}
`,
      overwrite: false,
    },
    
    // Sentry hooks
    {
      path: 'src/lib/sentry/hooks.ts',
      template: `'use client';

import { useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';
import { 
  setUserContext, 
  setTag, 
  setTags, 
  addBreadcrumb, 
  captureError, 
  captureMessage 
} from './utils';

export function useSentry() {
  const setUser = useCallback((user: Parameters<typeof setUserContext>[0]) => {
    setUserContext(user);
  }, []);

  const captureException = useCallback((error: Error, context?: Record<string, any>) => {
    captureError(error, context);
  }, []);

  const captureMsg = useCallback((
    message: string, 
    level?: Sentry.SeverityLevel,
    context?: Record<string, any>
  ) => {
    captureMessage(message, level, context);
  }, []);

  return {
    setUser,
    setTag,
    setTags,
    addBreadcrumb,
    captureException,
    captureMessage: captureMsg,
  };
}

export function useSentryUser(user: any) {
  useEffect(() => {
    if (user) {
      setUserContext({
        id: user.id,
        email: user.email,
        username: user.username || user.name,
      });
    } else {
      setUserContext({});
    }
  }, [user]);
}

export function useSentryBreadcrumbs(component: string) {
  useEffect(() => {
    addBreadcrumb({
      message: \`Rendered \${component}\`,
      category: 'ui',
      level: 'info',
    });
  }, [component]);
}

export function useSentryPerformance(name: string, op: string = 'component') {
  useEffect(() => {
    const transaction = Sentry.startTransaction({ name, op });
    
    return () => {
      transaction.finish();
    };
  }, [name, op]);
}
`,
      overwrite: false,
    },
    
    // Error boundary component
    {
      path: 'src/components/sentry/error-boundary.tsx',
      template: `'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  tags?: Record<string, string>;
  level?: Sentry.SeverityLevel;
}

export class SentryErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, tags, level = 'error' } = this.props;
    
    Sentry.withScope((scope) => {
      if (tags) {
        scope.setTags(tags);
      }
      
      scope.setContext('errorInfo', errorInfo);
      scope.setLevel(level);
      
      Sentry.captureException(error);
    });

    onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Something went wrong
            </h3>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            An unexpected error occurred. The error has been reported and we're working to fix it.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={resetError}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Higher-order component for easier usage
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryOptions?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <SentryErrorBoundary {...errorBoundaryOptions}>
      <Component {...props} />
    </SentryErrorBoundary>
  );

  WrappedComponent.displayName = \`withSentryErrorBoundary(\${Component.displayName || Component.name})\`;

  return WrappedComponent;
}
`,
      overwrite: false,
    },
    
    // Performance monitoring component
    {
      path: 'src/components/sentry/performance-monitor.tsx',
      template: `'use client';

import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';

interface PerformanceMonitorProps {
  name: string;
  op?: string;
  tags?: Record<string, string>;
  children: React.ReactNode;
}

export function PerformanceMonitor({ 
  name, 
  op = 'component', 
  tags,
  children 
}: PerformanceMonitorProps) {
  const transactionRef = useRef<Sentry.Transaction | null>(null);

  useEffect(() => {
    // Start transaction
    transactionRef.current = Sentry.startTransaction({ name, op });
    
    if (tags) {
      transactionRef.current.setTags(tags);
    }

    return () => {
      // Finish transaction on unmount
      if (transactionRef.current) {
        transactionRef.current.finish();
      }
    };
  }, [name, op, tags]);

  return <>{children}</>;
}

interface RenderTimeMonitorProps {
  name: string;
  threshold?: number; // ms
  children: React.ReactNode;
}

export function RenderTimeMonitor({ 
  name, 
  threshold = 100,
  children 
}: RenderTimeMonitorProps) {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const renderTime = Date.now() - startTimeRef.current;
    
    // Report slow renders
    if (renderTime > threshold) {
      Sentry.addBreadcrumb({
        message: \`Slow render: \${name}\`,
        category: 'performance',
        level: 'warning',
        data: {
          renderTime,
          threshold,
        },
      });
    }

    // Always track render time as a measurement
    Sentry.setMeasurement('render_time', renderTime, 'millisecond');
  });

  return <>{children}</>;
}
`,
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/sentry-example.tsx',
      template: `'use client';

import { useState } from 'react';
import { useSentry, useSentryUser } from '@/lib/sentry/hooks';
import { SentryErrorBoundary } from '@/components/sentry/error-boundary';
import { PerformanceMonitor } from '@/components/sentry/performance-monitor';

function ErrorProneComponent() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('This is a test error for Sentry!');
  }

  return (
    <button
      onClick={() => setShouldError(true)}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
    >
      Trigger Error
    </button>
  );
}

export function SentryExample() {
  const { setUser, setTag, addBreadcrumb, captureException, captureMessage } = useSentry();
  const [userId, setUserIdState] = useState('');

  const handleSetUser = () => {
    if (userId) {
      setUser({
        id: userId,
        email: \`\${userId}@example.com\`,
        username: userId,
      });
      
      setTag('userType', 'example');
      
      addBreadcrumb({
        message: 'User context set in example',
        category: 'user',
        level: 'info',
      });
    }
  };

  const handleCaptureMessage = () => {
    captureMessage('This is a test message from Sentry example', 'info', {
      source: 'example_component',
    });
  };

  const handleCaptureError = () => {
    try {
      throw new Error('This is a manually captured error');
    } catch (error) {
      captureException(error as Error, {
        source: 'manual_capture',
        component: 'SentryExample',
      });
    }
  };

  return (
    <PerformanceMonitor name="SentryExample" tags={{ component: 'example' }}>
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Sentry Error Monitoring</h2>
        
        {/* User Context */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-medium mb-3">User Context</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Enter user ID"
              value={userId}
              onChange={(e) => setUserIdState(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button
              onClick={handleSetUser}
              disabled={!userId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Set User
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Set user context for better error tracking
          </p>
        </div>

        {/* Manual Reporting */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Manual Reporting</h3>
          <div className="space-y-2">
            <button
              onClick={handleCaptureMessage}
              className="block w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Capture Message
            </button>
            
            <button
              onClick={handleCaptureError}
              className="block w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Capture Error Manually
            </button>
          </div>
        </div>

        {/* Error Boundary Test */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Error Boundary Test</h3>
          <SentryErrorBoundary
            tags={{ source: 'example', component: 'ErrorProneComponent' }}
            onError={(error) => console.log('Error boundary caught:', error)}
          >
            <ErrorProneComponent />
          </SentryErrorBoundary>
        </div>

        {/* Status */}
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-green-800">
            ✅ Sentry is configured and monitoring errors!
          </p>
          <p className="text-sm text-green-600 mt-1">
            Check your Sentry dashboard to see captured errors and performance data.
          </p>
        </div>
      </div>
    </PerformanceMonitor>
  );
}
`,
      overwrite: false,
    },
    
    // Next.js configuration update
    {
      path: 'next.config.js',
      template: `const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  
  // Upload source maps during build
  {{#if options.enableSourceMaps}}
  widenClientFileUpload: true,
  hideSourceMaps: true,
  {{/if}}
  
  {{#if options.enableTunneling}}
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: '/monitoring',
  {{/if}}
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
`,
      condition: { template: 'nextjs' },
      overwrite: true,
    },
  ],
  
  integrations: [
    {
      plugin: 'auth-*',
      type: 'hook',
      files: [
        {
          path: 'src/lib/sentry/auth-integration.ts',
          template: `import { useEffect } from 'react';
import { useSentry } from './hooks';

export function useSentryAuth(user: any) {
  const { setUser } = useSentry();

  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        email: user.email,
        username: user.username || user.name,
      });
    } else {
      setUser({});
    }
  }, [user, setUser]);
}
`,
        },
      ],
    },
  ],
  
  postInstall: `🚀 Sentry Error Monitoring has been configured successfully!

Next steps:
1. Set up your Sentry account:
   - Visit https://sentry.io
   - Create a project and get your DSN
   - Add it to your environment variables

2. Configure source maps (optional):
   - Set SENTRY_ORG, SENTRY_PROJECT, and SENTRY_AUTH_TOKEN
   - Source maps will be uploaded automatically during build

3. Add error boundary to your app:
   {{#if (eq template 'nextjs')}}
   \`\`\`tsx
   // app/layout.tsx
   import { SentryErrorBoundary } from '@/components/sentry/error-boundary';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <SentryErrorBoundary>
             {children}
           </SentryErrorBoundary>
         </body>
       </html>
     );
   }
   \`\`\`
   {{/if}}

4. Use Sentry hooks in your components:
   \`\`\`tsx
   import { useSentry } from '@/lib/sentry/hooks';
   
   const { captureException, setUser } = useSentry();
   \`\`\`

Configuration:
- Environment: {{options.environment}}
- Sample rate: {{options.sampleRate}}
- Performance monitoring: {{options.tracesSampleRate}}
- Profiling: {{options.enableProfiling}}
- Source maps: {{options.enableSourceMaps}}

Documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/`,
});

export default monitoringSentryPlugin;