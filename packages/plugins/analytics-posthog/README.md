# PostHog Analytics Plugin

Product analytics and feature flags with PostHog.

## Features

- Event tracking and user analytics
- Feature flags and A/B testing
- Session recordings and heatmaps
- Cohort analysis and funnels
- Privacy-focused analytics
- Self-hosted or cloud options

## Installation

```bash
npx scaforge add analytics-posthog
```

## Configuration

The plugin will prompt you for:
- PostHog API key
- PostHog host (optional, defaults to PostHog Cloud)
- Enable session recordings
- Enable feature flags
- Capture pageviews automatically

## Environment Variables

```env
NEXT_PUBLIC_POSTHOG_API_KEY=your_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com  # Optional
```

## Usage

### Basic Event Tracking

```tsx
import { usePostHog } from '@/lib/posthog/hooks';

function MyComponent() {
  const posthog = usePostHog();

  const handleClick = () => {
    posthog.capture('button_clicked', {
      button_name: 'signup',
      page: 'landing',
    });
  };

  return <button onClick={handleClick}>Sign Up</button>;
}
```

### Feature Flags

```tsx
import { useFeatureFlag } from '@/lib/posthog/hooks';

function MyComponent() {
  const showNewFeature = useFeatureFlag('new-feature');

  if (showNewFeature) {
    return <NewFeatureComponent />;
  }

  return <OldFeatureComponent />;
}
```

### User Identification

```tsx
import { usePostHog } from '@/lib/posthog/hooks';

function LoginComponent() {
  const posthog = usePostHog();

  const handleLogin = (user) => {
    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
      plan: user.plan,
    });
  };
}
```

## Documentation

- [PostHog Documentation](https://posthog.com/docs)
- [JavaScript SDK](https://posthog.com/docs/libraries/js)
- [Feature Flags](https://posthog.com/docs/feature-flags)