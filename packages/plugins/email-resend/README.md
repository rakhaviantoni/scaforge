# Resend Email Plugin

This plugin integrates Resend email service with your Scaforge project, providing transactional email capabilities with React Email templates.

## Features

- Resend API integration
- React Email template support
- TypeScript-first email templates
- Batch email sending
- Email tracking and analytics
- Template management

## Installation

```bash
npx scaforge add email-resend
```

## Configuration

The plugin will prompt you for:
- Resend API key
- Default sender email
- Default sender name

## Usage

```typescript
import { resend } from '@/lib/resend/client';
import { WelcomeEmail } from '@/emails/welcome';

// Send email with React component
await resend.emails.send({
  from: 'noreply@example.com',
  to: 'user@example.com',
  subject: 'Welcome!',
  react: WelcomeEmail({ name: 'John' }),
});
```

## Environment Variables

Add these to your `.env.local`:

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Your App Name
```