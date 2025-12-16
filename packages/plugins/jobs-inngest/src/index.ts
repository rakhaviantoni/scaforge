/**
 * Inngest Background Jobs Plugin for Scaforge
 * Event-driven background jobs with Inngest
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const jobsInngestPlugin = definePlugin({
  name: 'jobs-inngest',
  displayName: 'Inngest Background Jobs',
  category: 'jobs',
  description: 'Event-driven background jobs with Inngest',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'inngest': '^3.15.0',
    },
  },
  
  configSchema: z.object({
    enableDevMode: z.boolean().default(true),
    defaultRetries: z.number().default(3),
    defaultConcurrency: z.number().default(10),
    enableMonitoring: z.boolean().default(true),
    rateLimitPerSecond: z.number().default(100),
    enableBatching: z.boolean().default(false),
    batchSize: z.number().default(10),
  }),
  
  envVars: [
    {
      name: 'INNGEST_EVENT_KEY',
      description: 'Inngest event key for sending events',
      required: true,
      secret: true,
    },
    {
      name: 'INNGEST_SIGNING_KEY',
      description: 'Inngest signing key for webhook verification',
      required: true,
      secret: true,
    },
    {
      name: 'INNGEST_DEV',
      description: 'Enable Inngest development mode',
      required: false,
      default: 'true',
    },
  ],
  
  files: [
    // Inngest client configuration
    {
      path: 'src/lib/inngest/client.ts',
      template: `import { Inngest } from 'inngest';
import { events } from './events';

export const inngest = new Inngest({
  id: '{{config.name}}',
  schemas: {
    events,
  },
  {{#if options.enableDevMode}}
  isDev: process.env.INNGEST_DEV === 'true',
  {{/if}}
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export default inngest;
`,
      overwrite: false,
    },
    
    // Event definitions
    {
      path: 'src/lib/inngest/events.ts',
      template: `// Define your application events here
// These events will be type-safe throughout your application

export const events = {
  // User events
  'user/created': {
    data: {
      userId: string;
      email: string;
      name?: string;
    },
  },
  
  'user/updated': {
    data: {
      userId: string;
      changes: Record<string, any>;
    },
  },
  
  'user/deleted': {
    data: {
      userId: string;
    },
  },

  // Email events
  'email/send': {
    data: {
      to: string;
      subject: string;
      body: string;
      template?: string;
      data?: Record<string, any>;
    },
  },
  
  'email/sent': {
    data: {
      messageId: string;
      to: string;
      subject: string;
    },
  },
  
  'email/failed': {
    data: {
      to: string;
      subject: string;
      error: string;
    },
  },

  // Notification events
  'notification/send': {
    data: {
      userId: string;
      type: 'push' | 'sms' | 'email';
      message: string;
      data?: Record<string, any>;
    },
  },

  // Data processing events
  'data/process': {
    data: {
      type: string;
      payload: Record<string, any>;
      priority?: 'low' | 'normal' | 'high';
    },
  },

  // Scheduled events
  'schedule/daily-report': {
    data: {
      date: string;
      reportType: string;
    },
  },

  // Webhook events
  'webhook/received': {
    data: {
      source: string;
      payload: Record<string, any>;
      headers: Record<string, string>;
    },
  },
} as const;

export type Events = typeof events;
export type EventNames = keyof Events;
`,
      overwrite: false,
    },
    
    // Job functions directory
    {
      path: 'src/lib/inngest/functions/index.ts',
      template: `// Export all your Inngest functions here
// This file is imported by the API route to register functions

export { sendWelcomeEmail } from './send-welcome-email';
export { processUserData } from './process-user-data';
export { sendNotification } from './send-notification';
export { generateDailyReport } from './generate-daily-report';
export { processWebhook } from './process-webhook';

// Add more function exports as you create them
`,
      overwrite: false,
    },
    
    // Example job functions
    {
      path: 'src/lib/inngest/functions/send-welcome-email.ts',
      template: `import { inngest } from '../client';

export const sendWelcomeEmail = inngest.createFunction(
  {
    id: 'send-welcome-email',
    name: 'Send Welcome Email',
    retries: {{options.defaultRetries}},
    {{#if options.enableBatching}}
    batchEvents: {
      maxSize: {{options.batchSize}},
      timeout: '5s',
    },
    {{/if}}
  },
  { event: 'user/created' },
  async ({ event, step }) => {
    // Step 1: Validate user data
    const user = await step.run('validate-user', async () => {
      if (!event.data.email) {
        throw new Error('User email is required');
      }
      
      return {
        id: event.data.userId,
        email: event.data.email,
        name: event.data.name || 'User',
      };
    });

    // Step 2: Send welcome email
    const emailResult = await step.run('send-email', async () => {
      // Replace with your email service
      console.log(\`Sending welcome email to \${user.email}\`);
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        messageId: \`msg_\${Date.now()}\`,
        to: user.email,
        subject: 'Welcome to our platform!',
        sentAt: new Date().toISOString(),
      };
    });

    // Step 3: Track email sent event
    await step.sendEvent('email-sent', {
      name: 'email/sent',
      data: {
        messageId: emailResult.messageId,
        to: emailResult.to,
        subject: emailResult.subject,
      },
    });

    // Step 4: Schedule follow-up email (optional)
    await step.sendEvent('schedule-followup', {
      name: 'email/send',
      data: {
        to: user.email,
        subject: 'How are you finding our platform?',
        template: 'followup',
        data: { name: user.name },
      },
      // Send 3 days later
      ts: Date.now() + (3 * 24 * 60 * 60 * 1000),
    });

    return {
      success: true,
      emailSent: emailResult,
      userId: user.id,
    };
  }
);
`,
      overwrite: false,
    },
    
    {
      path: 'src/lib/inngest/functions/process-user-data.ts',
      template: `import { inngest } from '../client';

export const processUserData = inngest.createFunction(
  {
    id: 'process-user-data',
    name: 'Process User Data',
    retries: {{options.defaultRetries}},
    concurrency: {
      limit: {{options.defaultConcurrency}},
    },
    rateLimit: {
      limit: {{options.rateLimitPerSecond}},
      period: '1s',
    },
  },
  { event: 'data/process' },
  async ({ event, step }) => {
    const { type, payload, priority = 'normal' } = event.data;

    // Step 1: Validate input data
    await step.run('validate-data', async () => {
      if (!type || !payload) {
        throw new Error('Data type and payload are required');
      }
      
      console.log(\`Processing \${type} data with priority: \${priority}\`);
    });

    // Step 2: Process based on type
    const result = await step.run('process-data', async () => {
      switch (type) {
        case 'user-analytics':
          return processUserAnalytics(payload);
        
        case 'user-preferences':
          return processUserPreferences(payload);
        
        case 'user-activity':
          return processUserActivity(payload);
        
        default:
          throw new Error(\`Unknown data type: \${type}\`);
      }
    });

    // Step 3: Store results
    await step.run('store-results', async () => {
      // Store processed data
      console.log('Storing processed data:', result);
      
      // Simulate database operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { stored: true, recordId: \`rec_\${Date.now()}\` };
    });

    // Step 4: Send notification if high priority
    if (priority === 'high') {
      await step.sendEvent('notify-completion', {
        name: 'notification/send',
        data: {
          userId: payload.userId,
          type: 'push',
          message: \`High priority \${type} processing completed\`,
          data: { result },
        },
      });
    }

    return {
      success: true,
      type,
      priority,
      processedAt: new Date().toISOString(),
      result,
    };
  }
);

// Helper functions
async function processUserAnalytics(payload: any) {
  // Simulate analytics processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { analytics: 'processed', events: payload.events?.length || 0 };
}

async function processUserPreferences(payload: any) {
  // Simulate preferences processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { preferences: 'updated', settings: payload.settings };
}

async function processUserActivity(payload: any) {
  // Simulate activity processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { activity: 'analyzed', score: Math.random() * 100 };
}
`,
      overwrite: false,
    },
    
    {
      path: 'src/lib/inngest/functions/send-notification.ts',
      template: `import { inngest } from '../client';

export const sendNotification = inngest.createFunction(
  {
    id: 'send-notification',
    name: 'Send Notification',
    retries: {{options.defaultRetries}},
  },
  { event: 'notification/send' },
  async ({ event, step }) => {
    const { userId, type, message, data } = event.data;

    // Step 1: Get user preferences
    const userPrefs = await step.run('get-user-preferences', async () => {
      // Simulate fetching user notification preferences
      return {
        push: true,
        sms: false,
        email: true,
        timezone: 'UTC',
      };
    });

    // Step 2: Check if user allows this notification type
    const canSend = await step.run('check-permissions', async () => {
      if (!userPrefs[type]) {
        throw new Error(\`User has disabled \${type} notifications\`);
      }
      return true;
    });

    // Step 3: Send notification based on type
    const result = await step.run('send-notification', async () => {
      switch (type) {
        case 'push':
          return sendPushNotification(userId, message, data);
        
        case 'sms':
          return sendSMSNotification(userId, message, data);
        
        case 'email':
          return sendEmailNotification(userId, message, data);
        
        default:
          throw new Error(\`Unsupported notification type: \${type}\`);
      }
    });

    // Step 4: Log notification sent
    await step.run('log-notification', async () => {
      console.log(\`Notification sent to user \${userId}:\`, result);
      
      // You could store this in your database
      return {
        logged: true,
        timestamp: new Date().toISOString(),
      };
    });

    return {
      success: true,
      userId,
      type,
      result,
      sentAt: new Date().toISOString(),
    };
  }
);

// Helper functions for different notification types
async function sendPushNotification(userId: string, message: string, data?: any) {
  // Simulate push notification
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    type: 'push',
    messageId: \`push_\${Date.now()}\`,
    delivered: true,
  };
}

async function sendSMSNotification(userId: string, message: string, data?: any) {
  // Simulate SMS sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    type: 'sms',
    messageId: \`sms_\${Date.now()}\`,
    delivered: true,
  };
}

async function sendEmailNotification(userId: string, message: string, data?: any) {
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    type: 'email',
    messageId: \`email_\${Date.now()}\`,
    delivered: true,
  };
}
`,
      overwrite: false,
    },
    
    {
      path: 'src/lib/inngest/functions/generate-daily-report.ts',
      template: `import { inngest } from '../client';

export const generateDailyReport = inngest.createFunction(
  {
    id: 'generate-daily-report',
    name: 'Generate Daily Report',
    retries: {{options.defaultRetries}},
  },
  // This function can be triggered by a cron schedule or manual event
  { event: 'schedule/daily-report' },
  async ({ event, step }) => {
    const { date, reportType } = event.data;

    // Step 1: Gather data for the report
    const reportData = await step.run('gather-data', async () => {
      console.log(\`Gathering data for \${reportType} report on \${date}\`);
      
      // Simulate data gathering
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return {
        users: {
          total: 1250,
          new: 45,
          active: 892,
        },
        revenue: {
          total: 15420.50,
          subscriptions: 12300.00,
          oneTime: 3120.50,
        },
        engagement: {
          pageViews: 25680,
          sessions: 8940,
          avgSessionDuration: 245, // seconds
        },
      };
    });

    // Step 2: Generate report content
    const report = await step.run('generate-report', async () => {
      const reportContent = {
        date,
        type: reportType,
        summary: {
          totalUsers: reportData.users.total,
          newUsers: reportData.users.new,
          revenue: reportData.revenue.total,
          engagement: reportData.engagement.sessions,
        },
        details: reportData,
        generatedAt: new Date().toISOString(),
      };

      // Simulate report generation processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return reportContent;
    });

    // Step 3: Save report
    const savedReport = await step.run('save-report', async () => {
      const reportId = \`report_\${date}_\${reportType}_\${Date.now()}\`;
      
      // Simulate saving to database/storage
      console.log(\`Saving report with ID: \${reportId}\`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        id: reportId,
        url: \`/reports/\${reportId}\`,
        saved: true,
      };
    });

    // Step 4: Notify stakeholders
    await step.sendEvent('notify-stakeholders', {
      name: 'email/send',
      data: {
        to: 'admin@company.com',
        subject: \`Daily Report Ready - \${date}\`,
        body: \`Your \${reportType} report for \${date} is ready. View it at: \${savedReport.url}\`,
        template: 'daily-report',
        data: {
          report,
          url: savedReport.url,
        },
      },
    });

    // Step 5: Schedule next report (if this is a recurring job)
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await step.sendEvent('schedule-next-report', {
      name: 'schedule/daily-report',
      data: {
        date: tomorrow.toISOString().split('T')[0],
        reportType,
      },
      // Schedule for tomorrow at 9 AM
      ts: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0, 0).getTime(),
    });

    return {
      success: true,
      reportId: savedReport.id,
      reportUrl: savedReport.url,
      date,
      type: reportType,
      generatedAt: new Date().toISOString(),
    };
  }
);
`,
      overwrite: false,
    },
    
    {
      path: 'src/lib/inngest/functions/process-webhook.ts',
      template: `import { inngest } from '../client';

export const processWebhook = inngest.createFunction(
  {
    id: 'process-webhook',
    name: 'Process Webhook',
    retries: {{options.defaultRetries}},
    concurrency: {
      limit: 50, // Higher concurrency for webhook processing
    },
  },
  { event: 'webhook/received' },
  async ({ event, step }) => {
    const { source, payload, headers } = event.data;

    // Step 1: Validate webhook signature (if applicable)
    await step.run('validate-webhook', async () => {
      console.log(\`Processing webhook from \${source}\`);
      
      // Add signature validation logic here based on the source
      switch (source) {
        case 'stripe':
          return validateStripeWebhook(payload, headers);
        case 'github':
          return validateGitHubWebhook(payload, headers);
        default:
          console.log(\`No validation configured for source: \${source}\`);
          return true;
      }
    });

    // Step 2: Process webhook based on source
    const result = await step.run('process-payload', async () => {
      switch (source) {
        case 'stripe':
          return processStripeWebhook(payload);
        
        case 'github':
          return processGitHubWebhook(payload);
        
        case 'shopify':
          return processShopifyWebhook(payload);
        
        default:
          return processGenericWebhook(source, payload);
      }
    });

    // Step 3: Send follow-up events if needed
    if (result.followUpEvents) {
      for (const followUpEvent of result.followUpEvents) {
        await step.sendEvent(\`followup-\${followUpEvent.name}\`, followUpEvent);
      }
    }

    // Step 4: Log webhook processing
    await step.run('log-webhook', async () => {
      console.log(\`Webhook processed successfully:\`, {
        source,
        result,
        processedAt: new Date().toISOString(),
      });
      
      return { logged: true };
    });

    return {
      success: true,
      source,
      result,
      processedAt: new Date().toISOString(),
    };
  }
);

// Webhook validation functions
function validateStripeWebhook(payload: any, headers: Record<string, string>): boolean {
  // Implement Stripe webhook signature validation
  console.log('Validating Stripe webhook signature');
  return true; // Simplified for example
}

function validateGitHubWebhook(payload: any, headers: Record<string, string>): boolean {
  // Implement GitHub webhook signature validation
  console.log('Validating GitHub webhook signature');
  return true; // Simplified for example
}

// Webhook processing functions
async function processStripeWebhook(payload: any) {
  const { type, data } = payload;
  
  switch (type) {
    case 'payment_intent.succeeded':
      return {
        action: 'payment_processed',
        paymentId: data.object.id,
        amount: data.object.amount,
        followUpEvents: [
          {
            name: 'email/send',
            data: {
              to: data.object.receipt_email,
              subject: 'Payment Confirmation',
              template: 'payment-success',
              data: { payment: data.object },
            },
          },
        ],
      };
    
    case 'customer.subscription.created':
      return {
        action: 'subscription_created',
        subscriptionId: data.object.id,
        customerId: data.object.customer,
        followUpEvents: [
          {
            name: 'user/updated',
            data: {
              userId: data.object.customer,
              changes: { subscription: data.object.id },
            },
          },
        ],
      };
    
    default:
      return {
        action: 'unhandled_stripe_event',
        eventType: type,
      };
  }
}

async function processGitHubWebhook(payload: any) {
  const { action, repository, pull_request } = payload;
  
  if (pull_request) {
    return {
      action: 'pull_request_event',
      prNumber: pull_request.number,
      repository: repository.full_name,
      followUpEvents: [
        {
          name: 'notification/send',
          data: {
            userId: 'admin',
            type: 'email',
            message: \`PR #\${pull_request.number} \${action} in \${repository.name}\`,
          },
        },
      ],
    };
  }
  
  return {
    action: 'generic_github_event',
    repository: repository?.full_name,
  };
}

async function processShopifyWebhook(payload: any) {
  // Process Shopify webhooks
  return {
    action: 'shopify_event_processed',
    orderId: payload.id,
  };
}

async function processGenericWebhook(source: string, payload: any) {
  // Generic webhook processing
  return {
    action: 'generic_webhook_processed',
    source,
    payloadKeys: Object.keys(payload),
  };
}
`,
      overwrite: false,
    },
    
    // API route for Inngest
    {
      path: 'src/app/api/inngest/route.ts',
      template: `import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';

// Import all your functions
import * as functions from '@/lib/inngest/functions';

// Create the handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: Object.values(functions),
  {{#if options.enableMonitoring}}
  streaming: true,
  {{/if}}
});
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Utility functions for sending events
    {
      path: 'src/lib/inngest/utils.ts',
      template: `import { inngest } from './client';
import type { EventNames, Events } from './events';

// Type-safe event sending
export async function sendEvent<T extends EventNames>(
  name: T,
  data: Events[T]['data'],
  options?: {
    ts?: number; // Timestamp for scheduling
    id?: string; // Custom event ID
  }
) {
  return inngest.send({
    name,
    data,
    ...options,
  });
}

// Batch event sending
export async function sendEvents(
  events: Array<{
    name: EventNames;
    data: any;
    ts?: number;
    id?: string;
  }>
) {
  return inngest.send(events);
}

// Common event helpers
export const eventHelpers = {
  // User events
  async userCreated(userId: string, email: string, name?: string) {
    return sendEvent('user/created', { userId, email, name });
  },

  async userUpdated(userId: string, changes: Record<string, any>) {
    return sendEvent('user/updated', { userId, changes });
  },

  async userDeleted(userId: string) {
    return sendEvent('user/deleted', { userId });
  },

  // Email events
  async sendEmail(to: string, subject: string, body: string, template?: string, data?: Record<string, any>) {
    return sendEvent('email/send', { to, subject, body, template, data });
  },

  // Notification events
  async sendNotification(
    userId: string, 
    type: 'push' | 'sms' | 'email', 
    message: string, 
    data?: Record<string, any>
  ) {
    return sendEvent('notification/send', { userId, type, message, data });
  },

  // Data processing events
  async processData(
    type: string, 
    payload: Record<string, any>, 
    priority?: 'low' | 'normal' | 'high'
  ) {
    return sendEvent('data/process', { type, payload, priority });
  },

  // Scheduled events
  async scheduleDailyReport(date: string, reportType: string) {
    return sendEvent('schedule/daily-report', { date, reportType });
  },

  // Webhook events
  async processWebhook(
    source: string, 
    payload: Record<string, any>, 
    headers: Record<string, string>
  ) {
    return sendEvent('webhook/received', { source, payload, headers });
  },
};

// Scheduling helpers
export const scheduleHelpers = {
  // Schedule an event for a specific time
  scheduleAt(date: Date, name: EventNames, data: any) {
    return sendEvent(name, data, { ts: date.getTime() });
  },

  // Schedule an event after a delay
  scheduleIn(delay: number, name: EventNames, data: any) {
    return sendEvent(name, data, { ts: Date.now() + delay });
  },

  // Common scheduling shortcuts
  scheduleInMinutes(minutes: number, name: EventNames, data: any) {
    return this.scheduleIn(minutes * 60 * 1000, name, data);
  },

  scheduleInHours(hours: number, name: EventNames, data: any) {
    return this.scheduleIn(hours * 60 * 60 * 1000, name, data);
  },

  scheduleInDays(days: number, name: EventNames, data: any) {
    return this.scheduleIn(days * 24 * 60 * 60 * 1000, name, data);
  },

  // Schedule daily at specific time
  scheduleDailyAt(hour: number, minute: number = 0) {
    const now = new Date();
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    return scheduledTime;
  },
};

// Development helpers
export const devHelpers = {
  // Test function execution
  async testFunction(functionId: string, eventData: any) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Test functions are only available in development');
    }
    
    console.log(\`Testing function: \${functionId}\`);
    console.log('Event data:', eventData);
    
    // In development, you might want to trigger the function directly
    // This is a simplified example - actual implementation would depend on your setup
    return { success: true, message: 'Function test triggered' };
  },

  // List all registered functions
  listFunctions() {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Function listing is only available in development');
    }
    
    // This would return information about registered functions
    return Object.keys(require('./functions'));
  },
};
`,
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/inngest-example.tsx',
      template: `'use client';

import { useState } from 'react';
import { eventHelpers, scheduleHelpers } from '@/lib/inngest/utils';

export function InngestExample() {
  const [userId, setUserId] = useState('user_123');
  const [email, setEmail] = useState('user@example.com');
  const [eventStatus, setEventStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendEvent = async (eventType: string) => {
    setLoading(true);
    setEventStatus(null);

    try {
      let result;

      switch (eventType) {
        case 'user-created':
          result = await eventHelpers.userCreated(userId, email, 'Test User');
          break;

        case 'send-email':
          result = await eventHelpers.sendEmail(
            email,
            'Test Email',
            'This is a test email from Inngest',
            'test-template',
            { userName: 'Test User' }
          );
          break;

        case 'send-notification':
          result = await eventHelpers.sendNotification(
            userId,
            'push',
            'Test notification message',
            { source: 'example' }
          );
          break;

        case 'process-data':
          result = await eventHelpers.processData(
            'user-analytics',
            { userId, events: ['login', 'page_view', 'click'] },
            'normal'
          );
          break;

        case 'schedule-report':
          result = await eventHelpers.scheduleDailyReport(
            new Date().toISOString().split('T')[0],
            'user-activity'
          );
          break;

        case 'delayed-email':
          // Schedule email for 1 minute from now
          result = await scheduleHelpers.scheduleInMinutes(
            1,
            'email/send',
            {
              to: email,
              subject: 'Delayed Email Test',
              body: 'This email was scheduled 1 minute ago!',
            }
          );
          break;

        default:
          throw new Error('Unknown event type');
      }

      setEventStatus(\`Event sent successfully! ID: \${result.ids?.[0] || 'N/A'}\`);
    } catch (error) {
      setEventStatus(\`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Inngest Background Jobs</h2>
      
      {/* User Input */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-medium mb-3">Test Data</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Event Triggers */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-medium mb-3">Trigger Events</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSendEvent('user-created')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            User Created
          </button>
          
          <button
            onClick={() => handleSendEvent('send-email')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Send Email
          </button>
          
          <button
            onClick={() => handleSendEvent('send-notification')}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            Send Notification
          </button>
          
          <button
            onClick={() => handleSendEvent('process-data')}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            Process Data
          </button>
          
          <button
            onClick={() => handleSendEvent('schedule-report')}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Generate Report
          </button>
          
          <button
            onClick={() => handleSendEvent('delayed-email')}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Delayed Email (1min)
          </button>
        </div>
      </div>

      {/* Status */}
      {eventStatus && (
        <div className={\`mb-6 p-4 rounded-lg \${
          eventStatus.includes('Error') 
            ? 'bg-red-50 text-red-800' 
            : 'bg-green-50 text-green-800'
        }\`}>
          {eventStatus}
        </div>
      )}

      {/* Information */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Events are sent to Inngest for background processing</li>
          <li>• Functions are executed asynchronously with automatic retries</li>
          <li>• Check your Inngest dashboard to see function executions</li>
          <li>• Functions can trigger other events and handle complex workflows</li>
          <li>• Scheduled events will execute at the specified time</li>
        </ul>
      </div>

      {/* Configuration Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-800 text-sm">
          ✅ Inngest is configured and ready to process background jobs!
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Dev Mode: {{options.enableDevMode}} | Retries: {{options.defaultRetries}} | Concurrency: {{options.defaultConcurrency}}
        </p>
      </div>
    </div>
  );
}
`,
      overwrite: false,
    },
  ],
  
  postInstall: `🚀 Inngest Background Jobs has been configured successfully!

Next steps:
1. Set up your Inngest account at https://www.inngest.com
2. Add your event key and signing key to environment variables
3. Start the Inngest dev server for local development
4. Create your first background job function

Documentation: https://www.inngest.com/docs`,
});

export default jobsInngestPlugin;