/**
 * Resend Email Plugin for Scaforge
 * Transactional emails with React Email templates
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const emailResendPlugin = definePlugin({
  name: 'email-resend',
  displayName: 'Resend Email',
  category: 'email',
  description: 'Transactional emails with React Email templates',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'resend': '^3.2.0',
      '@react-email/components': '^0.0.14',
      '@react-email/render': '^0.0.12',
    },
    devDependencies: {
      'react-email': '^2.0.0',
    },
  },
  
  configSchema: z.object({
    fromEmail: z.string().email('Must be a valid email address'),
    fromName: z.string().default('Your App'),
    replyTo: z.string().email().optional(),
    trackOpens: z.boolean().default(true),
    trackClicks: z.boolean().default(true),
  }),
  
  envVars: [
    {
      name: 'RESEND_API_KEY',
      description: 'Resend API key',
      required: true,
      secret: true,
    },
    {
      name: 'RESEND_FROM_EMAIL',
      description: 'Default sender email address',
      required: true,
    },
    {
      name: 'RESEND_FROM_NAME',
      description: 'Default sender name',
      required: false,
      default: 'Your App',
    },
  ],
  
  files: [
    // Resend client configuration
    {
      path: 'src/lib/resend/client.ts',
      template: `import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);

// Email configuration
export const emailConfig = {
  from: process.env.RESEND_FROM_EMAIL || '{{options.fromEmail}}',
  fromName: process.env.RESEND_FROM_NAME || '{{options.fromName}}',
  {{#if options.replyTo}}
  replyTo: '{{options.replyTo}}',
  {{/if}}
  trackOpens: {{options.trackOpens}},
  trackClicks: {{options.trackClicks}},
};

// Email types
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
  headers?: Record<string, string>;
}

// Helper functions
export async function sendEmail(options: EmailOptions) {
  const emailData = {
    from: options.from || \`\${emailConfig.fromName} <\${emailConfig.from}>\`,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text,
    react: options.react,
    replyTo: options.replyTo || emailConfig.replyTo,
    cc: options.cc,
    bcc: options.bcc,
    attachments: options.attachments,
    tags: options.tags,
    headers: options.headers,
  };

  return await resend.emails.send(emailData);
}

export async function sendBatchEmails(emails: EmailOptions[]) {
  const emailsData = emails.map(email => ({
    from: email.from || \`\${emailConfig.fromName} <\${emailConfig.from}>\`,
    to: Array.isArray(email.to) ? email.to : [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
    react: email.react,
    replyTo: email.replyTo || emailConfig.replyTo,
    cc: email.cc,
    bcc: email.bcc,
    attachments: email.attachments,
    tags: email.tags,
    headers: email.headers,
  }));

  return await resend.batch.send(emailsData);
}

export async function createAudience(name: string) {
  return await resend.audiences.create({ name });
}

export async function addContact(audienceId: string, email: string, firstName?: string, lastName?: string) {
  return await resend.contacts.create({
    audienceId,
    email,
    firstName,
    lastName,
  });
}
`,
      overwrite: false,
    },
    
    // Email API route
    {
      path: 'src/app/api/email/send/route.ts',
      template: `import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend/client';
import type { EmailOptions } from '@/lib/resend/client';

export async function POST(req: NextRequest) {
  try {
    const emailData: EmailOptions = await req.json();

    if (!emailData.to || !emailData.subject) {
      return NextResponse.json(
        { error: 'to and subject are required' },
        { status: 400 }
      );
    }

    if (!emailData.html && !emailData.text && !emailData.react) {
      return NextResponse.json(
        { error: 'html, text, or react content is required' },
        { status: 400 }
      );
    }

    const result = await sendEmail(emailData);

    return NextResponse.json({
      id: result.data?.id,
      success: true,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // React Email configuration
    {
      path: 'emails/components/layout.tsx',
      template: `import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EmailLayoutProps {
  preview: string;
  title: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, title, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{title}</Heading>
          </Section>
          <Section style={content}>
            {children}
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              © 2024 {{config.name}}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '32px 24px',
  borderBottom: '1px solid #e6ebf1',
};

const content = {
  padding: '24px',
};

const footer = {
  padding: '24px',
  borderTop: '1px solid #e6ebf1',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
  textAlign: 'center' as const,
};
`,
      overwrite: false,
    },
    
    // Welcome email template
    {
      path: 'emails/welcome.tsx',
      template: `import {
  Button,
  Link,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/layout';

interface WelcomeEmailProps {
  name: string;
  loginUrl?: string;
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview={\`Welcome to {{config.name}}, \${name}!\`}
      title="Welcome!"
    >
      <Text style={text}>
        Hi {name},
      </Text>
      
      <Text style={text}>
        Welcome to {{config.name}}! We're excited to have you on board.
      </Text>
      
      <Text style={text}>
        Your account has been successfully created and you can now start using our platform.
      </Text>
      
      {loginUrl && (
        <Section style={buttonContainer}>
          <Button style={button} href={loginUrl}>
            Get Started
          </Button>
        </Section>
      )}
      
      <Text style={text}>
        If you have any questions, feel free to reach out to our support team.
      </Text>
      
      <Text style={text}>
        Best regards,<br />
        The {{config.name}} Team
      </Text>
    </EmailLayout>
  );
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default WelcomeEmail;
`,
      overwrite: false,
    },
    
    // Password reset email template
    {
      path: 'emails/password-reset.tsx',
      template: `import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/layout';

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  expiresIn?: string;
}

export function PasswordResetEmail({ 
  name, 
  resetUrl, 
  expiresIn = '1 hour' 
}: PasswordResetEmailProps) {
  return (
    <EmailLayout
      preview="Reset your password"
      title="Password Reset"
    >
      <Text style={text}>
        Hi {name},
      </Text>
      
      <Text style={text}>
        We received a request to reset your password for your {{config.name}} account.
      </Text>
      
      <Text style={text}>
        Click the button below to reset your password:
      </Text>
      
      <Section style={buttonContainer}>
        <Button style={button} href={resetUrl}>
          Reset Password
        </Button>
      </Section>
      
      <Text style={text}>
        This link will expire in {expiresIn}. If you didn't request this password reset, 
        you can safely ignore this email.
      </Text>
      
      <Text style={text}>
        For security reasons, if you don't reset your password within {expiresIn}, 
        you'll need to request a new password reset.
      </Text>
      
      <Text style={text}>
        Best regards,<br />
        The {{config.name}} Team
      </Text>
    </EmailLayout>
  );
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

export default PasswordResetEmail;
`,
      overwrite: false,
    },
    
    // Email verification template
    {
      path: 'emails/email-verification.tsx',
      template: `import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/layout';

interface EmailVerificationProps {
  name: string;
  verificationUrl: string;
  verificationCode?: string;
}

export function EmailVerificationEmail({ 
  name, 
  verificationUrl,
  verificationCode 
}: EmailVerificationProps) {
  return (
    <EmailLayout
      preview="Verify your email address"
      title="Verify Your Email"
    >
      <Text style={text}>
        Hi {name},
      </Text>
      
      <Text style={text}>
        Thank you for signing up for {{config.name}}! To complete your registration, 
        please verify your email address.
      </Text>
      
      <Section style={buttonContainer}>
        <Button style={button} href={verificationUrl}>
          Verify Email Address
        </Button>
      </Section>
      
      {verificationCode && (
        <>
          <Text style={text}>
            Or enter this verification code manually:
          </Text>
          
          <Section style={codeContainer}>
            <Text style={code}>{verificationCode}</Text>
          </Section>
        </>
      )}
      
      <Text style={text}>
        If you didn't create an account with {{config.name}}, you can safely ignore this email.
      </Text>
      
      <Text style={text}>
        Best regards,<br />
        The {{config.name}} Team
      </Text>
    </EmailLayout>
  );
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#059669',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const codeContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
};

const code = {
  fontSize: '24px',
  fontWeight: '700',
  fontFamily: 'monospace',
  color: '#1f2937',
  letterSpacing: '4px',
  margin: '0',
};

export default EmailVerificationEmail;
`,
      overwrite: false,
    },
    
    // Email utilities
    {
      path: 'src/lib/resend/templates.ts',
      template: `import { sendEmail } from './client';
import { WelcomeEmail } from '../../../emails/welcome';
import { PasswordResetEmail } from '../../../emails/password-reset';
import { EmailVerificationEmail } from '../../../emails/email-verification';

// Template helper functions
export async function sendWelcomeEmail(
  to: string,
  name: string,
  loginUrl?: string
) {
  return await sendEmail({
    to,
    subject: 'Welcome to {{config.name}}!',
    react: WelcomeEmail({ name, loginUrl }),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
  expiresIn?: string
) {
  return await sendEmail({
    to,
    subject: 'Reset your password',
    react: PasswordResetEmail({ name, resetUrl, expiresIn }),
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  name: string,
  verificationUrl: string,
  verificationCode?: string
) {
  return await sendEmail({
    to,
    subject: 'Verify your email address',
    react: EmailVerificationEmail({ name, verificationUrl, verificationCode }),
  });
}

// Generic notification email
export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string,
  actionUrl?: string,
  actionText?: string
) {
  const html = \`
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">{{config.name}}</h1>
      <p style="color: #374151; font-size: 16px; line-height: 24px; margin-bottom: 20px;">\${message}</p>
      \${actionUrl && actionText ? \`
        <div style="text-align: center; margin: 32px 0;">
          <a href="\${actionUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">\${actionText}</a>
        </div>
      \` : ''}
      <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
        Best regards,<br>
        The {{config.name}} Team
      </p>
    </div>
  \`;

  return await sendEmail({
    to,
    subject,
    html,
  });
}
`,
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/resend-example.tsx',
      template: `'use client';

import { useState } from 'react';

export function ResendExample() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendTestEmail = async (type: 'welcome' | 'verification' | 'reset') => {
    if (!email || !name) {
      setError('Please fill in both email and name fields');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      let emailData;
      
      switch (type) {
        case 'welcome':
          emailData = {
            to: email,
            subject: 'Welcome to {{config.name}}!',
            html: \`
              <h1>Welcome, \${name}!</h1>
              <p>Thank you for joining {{config.name}}. We're excited to have you on board!</p>
              <p>This is a test welcome email sent via Resend.</p>
            \`,
          };
          break;
          
        case 'verification':
          emailData = {
            to: email,
            subject: 'Verify your email address',
            html: \`
              <h1>Email Verification</h1>
              <p>Hi \${name},</p>
              <p>Please verify your email address by clicking the button below:</p>
              <a href="#" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a>
              <p>This is a test verification email sent via Resend.</p>
            \`,
          };
          break;
          
        case 'reset':
          emailData = {
            to: email,
            subject: 'Reset your password',
            html: \`
              <h1>Password Reset</h1>
              <p>Hi \${name},</p>
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              <a href="#" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
              <p>This is a test password reset email sent via Resend.</p>
            \`,
          };
          break;
      }

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      setMessage(\`\${type.charAt(0).toUpperCase() + type.slice(1)} email sent successfully!\`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Resend Email</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="test@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>
        
        {message && (
          <div className="p-3 bg-green-50 text-green-800 rounded-md text-sm">
            ✅ {message}
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
            ❌ {error}
          </div>
        )}
        
        <div className="space-y-2">
          <button
            onClick={() => sendTestEmail('welcome')}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Sending...' : 'Send Welcome Email'}
          </button>
          
          <button
            onClick={() => sendTestEmail('verification')}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Sending...' : 'Send Verification Email'}
          </button>
          
          <button
            onClick={() => sendTestEmail('reset')}
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Sending...' : 'Send Password Reset Email'}
          </button>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>✅ Resend is configured and ready to send emails!</p>
          <p className="mt-1">
            Templates are built with React Email for better design.
          </p>
        </div>
      </div>
    </div>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // React Email configuration
    {
      path: '.react-email/package.json',
      template: `{
  "dependencies": {
    "@react-email/components": "0.0.14",
    "@react-email/render": "0.0.12",
    "react": "18.2.0"
  }
}
`,
      overwrite: false,
    },
  ],
  
  postInstall: `🚀 Resend Email has been configured successfully!

Next steps:
1. Set up your Resend account:
   - Visit https://resend.com
   - Create an API key
   - Add it to your environment variables

2. Configure your domain:
   - Add and verify your sending domain in Resend
   - Update RESEND_FROM_EMAIL with your domain

3. Customize email templates:
   - Edit templates in the emails/ directory
   - Use React Email components for better design
   - Preview templates with: npx react-email dev

Example usage:
\`\`\`tsx
import { sendWelcomeEmail } from '@/lib/resend/templates';

await sendWelcomeEmail(
  'user@example.com',
  'John Doe',
  'https://yourapp.com/login'
);
\`\`\`

React Email templates:
\`\`\`tsx
import { WelcomeEmail } from '@/emails/welcome';
import { sendEmail } from '@/lib/resend/client';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  react: WelcomeEmail({ name: 'John' }),
});
\`\`\`

Documentation: https://resend.com/docs`,
});

export default emailResendPlugin;