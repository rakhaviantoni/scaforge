# Sentry Error Monitoring Plugin

Error tracking and performance monitoring with Sentry.

## Features

- Real-time error tracking and alerting
- Performance monitoring and profiling
- Release tracking and deployment monitoring
- User context and breadcrumbs
- Custom tags and metadata
- Source map support for better stack traces

## Installation

```bash
npx scaforge add monitoring-sentry
```

## Configuration

The plugin will prompt you for:
- Sentry DSN
- Environment name
- Sample rate for performance monitoring
- Enable user context tracking
- Enable breadcrumbs
- Enable profiling

## Environment Variables

```env
NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_auth_token
```

## Usage

### Manual Error Reporting

```tsx
import * as Sentry from '@sentry/nextjs';

try {
  // Some code that might throw
} catch (error) {
  Sentry.captureException(error);
}
```

### Adding Context

```tsx
import { useSentry } from '@/lib/sentry/hooks';

function MyComponent() {
  const { setUser, setTag, addBreadcrumb } = useSentry();

  useEffect(() => {
    setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    setTag('userPlan', user.plan);
    
    addBreadcrumb({
      message: 'User viewed dashboard',
      category: 'navigation',
      level: 'info',
    });
  }, [user]);
}
```

### Performance Monitoring

```tsx
import { withSentryTransaction } from '@/lib/sentry/performance';

const MyComponent = withSentryTransaction('MyComponent', () => {
  // Component code
});
```

## Documentation

- [Sentry Documentation](https://docs.sentry.io/)
- [Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)