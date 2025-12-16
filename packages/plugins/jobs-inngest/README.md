# Inngest Background Jobs Plugin

Event-driven background jobs with Inngest.

## Features

- Event-driven job processing
- Automatic retries and error handling
- Scheduled and delayed jobs
- Job monitoring and observability
- Type-safe event definitions
- Built-in rate limiting and concurrency control

## Installation

```bash
npx scaforge add jobs-inngest
```

## Configuration

The plugin will prompt you for:
- Inngest event key
- Enable development mode
- Default retry configuration
- Job concurrency limits
- Enable job monitoring

## Environment Variables

```env
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here
```

## Usage

### Define Events

```tsx
// src/lib/inngest/events.ts
export const events = {
  'user/created': {
    data: {
      userId: string;
      email: string;
    }
  },
  'email/send': {
    data: {
      to: string;
      subject: string;
      body: string;
    }
  }
};
```

### Create Jobs

```tsx
// src/lib/inngest/functions/send-welcome-email.ts
import { inngest } from '../client';

export const sendWelcomeEmail = inngest.createFunction(
  { id: 'send-welcome-email' },
  { event: 'user/created' },
  async ({ event, step }) => {
    const user = await step.run('fetch-user', async () => {
      return fetchUser(event.data.userId);
    });

    await step.run('send-email', async () => {
      return sendEmail({
        to: user.email,
        subject: 'Welcome!',
        template: 'welcome',
        data: { name: user.name },
      });
    });
  }
);
```

### Trigger Jobs

```tsx
import { inngest } from '@/lib/inngest/client';

// Trigger immediately
await inngest.send({
  name: 'user/created',
  data: {
    userId: '123',
    email: 'user@example.com',
  },
});

// Schedule for later
await inngest.send({
  name: 'email/send',
  data: { /* ... */ },
  ts: Date.now() + 3600000, // 1 hour from now
});
```

## Documentation

- [Inngest Documentation](https://www.inngest.com/docs)
- [Function Configuration](https://www.inngest.com/docs/functions)
- [Event Schemas](https://www.inngest.com/docs/events)