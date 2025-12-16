/**
 * Stripe Payments Plugin for Scaforge
 * Secure payment processing with Stripe
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const paymentsStripePlugin = definePlugin({
  name: 'payments-stripe',
  displayName: 'Stripe Payments',
  category: 'payments',
  description: 'Secure payment processing with Stripe',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'stripe': '^14.15.0',
      '@stripe/stripe-js': '^2.4.0',
      '@stripe/react-stripe-js': '^2.4.0',
    },
  },
  
  configSchema: z.object({
    currency: z.string().default('usd'),
    automaticTax: z.boolean().default(false),
    captureMethod: z.enum(['automatic', 'manual']).default('automatic'),
    enableCustomerPortal: z.boolean().default(true),
    webhookEvents: z.array(z.string()).default([
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
    ]),
  }),
  
  envVars: [
    {
      name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      description: 'Stripe publishable key',
      required: true,
    },
    {
      name: 'STRIPE_SECRET_KEY',
      description: 'Stripe secret key',
      required: true,
      secret: true,
    },
    {
      name: 'STRIPE_WEBHOOK_SECRET',
      description: 'Stripe webhook endpoint secret',
      required: true,
      secret: true,
    },
  ],
  
  files: [
    // Stripe client configuration
    {
      path: 'src/lib/stripe/client.ts',
      template: `import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Helper functions
export async function createPaymentIntent(
  amount: number,
  currency: string = '{{options.currency}}',
  metadata?: Record<string, string>
) {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
    capture_method: '{{options.captureMethod}}',
    metadata,
  });
}

export async function createCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
) {
  return await stripe.customers.create({
    email,
    name,
    metadata,
  });
}

export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata?: Record<string, string>
) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata,
  });
}
`,
      overwrite: false,
    },
    
    // Client-side Stripe configuration
    {
      path: 'src/lib/stripe/config.ts',
      template: `import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  currency: '{{options.currency}}',
  automaticTax: {{options.automaticTax}},
};
`,
      overwrite: false,
    },
    
    // Webhook handler
    {
      path: 'src/app/api/webhooks/stripe/route.ts',
      template: `import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        // Handle successful payment
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        // Handle failed payment
        break;
      }
      
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);
        // Handle new subscription
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);
        // Handle subscription update
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription cancelled:', subscription.id);
        // Handle subscription cancellation
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);
        // Handle successful invoice payment
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoice.id);
        // Handle failed invoice payment
        break;
      }
      
      default:
        console.log(\`Unhandled event type: \${event.type}\`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Payment Intent API route
    {
      path: 'src/app/api/stripe/payment-intent/route.ts',
      template: `import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe/client';

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, metadata } = await req.json();

    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: 'Amount must be at least 50 cents' },
        { status: 400 }
      );
    }

    const paymentIntent = await createPaymentIntent(
      amount,
      currency || '{{options.currency}}',
      metadata
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Subscription API route
    {
      path: 'src/app/api/stripe/subscription/route.ts',
      template: `import { NextRequest, NextResponse } from 'next/server';
import { createCustomer, createSubscription } from '@/lib/stripe/client';

export async function POST(req: NextRequest) {
  try {
    const { email, name, priceId, metadata } = await req.json();

    if (!email || !priceId) {
      return NextResponse.json(
        { error: 'Email and priceId are required' },
        { status: 400 }
      );
    }

    // Create or get customer
    const customer = await createCustomer(email, name, metadata);
    
    // Create subscription
    const subscription = await createSubscription(
      customer.id,
      priceId,
      metadata
    );

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      customerId: customer.id,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Stripe Elements provider
    {
      path: 'src/components/stripe/provider.tsx',
      template: `'use client';

import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe/config';

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
  options?: any;
}

export function StripeProvider({ 
  children, 
  clientSecret, 
  options = {} 
}: StripeProviderProps) {
  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px',
      },
    },
    ...options,
  };

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      {children}
    </Elements>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Payment form component
    {
      path: 'src/components/stripe/payment-form.tsx',
      template: `'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

interface PaymentFormProps {
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: any) => void;
  submitText?: string;
  className?: string;
}

export function PaymentForm({
  onSuccess,
  onError,
  submitText = 'Pay now',
  className = '',
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/payment/success',
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'An unexpected error occurred.');
      onError?.(error);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment succeeded!');
      onSuccess?.(paymentIntent);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className={\`space-y-6 \${className}\`}>
      <PaymentElement />
      
      {message && (
        <div className={\`p-3 rounded-md \${
          message.includes('succeeded') 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }\`}>
          {message}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : submitText}
      </button>
    </form>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Checkout component
    {
      path: 'src/components/stripe/checkout.tsx',
      template: `'use client';

import { useState } from 'react';
import { StripeProvider } from './provider';
import { PaymentForm } from './payment-form';

interface CheckoutProps {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: any) => void;
}

export function StripeCheckout({
  amount,
  currency = '{{options.currency}}',
  description,
  metadata,
  onSuccess,
  onError,
}: CheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          metadata: {
            ...metadata,
            description,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Checkout</h2>
        
        {description && (
          <p className="text-gray-600 mb-4">{description}</p>
        )}
        
        <div className="mb-4">
          <span className="text-2xl font-bold">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency.toUpperCase(),
            }).format(amount / 100)}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md">
            {error}
          </div>
        )}

        <button
          onClick={createPaymentIntent}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Continue to Payment'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
      
      <StripeProvider clientSecret={clientSecret}>
        <PaymentForm
          onSuccess={onSuccess}
          onError={onError}
          submitText={\`Pay \${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
          }).format(amount / 100)}\`}
        />
      </StripeProvider>
    </div>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/stripe-example.tsx',
      template: `'use client';

import { useState } from 'react';
import { StripeCheckout } from '@/components/stripe/checkout';

export function StripeExample() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handlePaymentSuccess = (paymentIntent: any) => {
    console.log('Payment succeeded:', paymentIntent);
    setPaymentStatus('success');
    setShowCheckout(false);
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment failed:', error);
    setPaymentStatus('error');
  };

  if (showCheckout) {
    return (
      <div className="p-6">
        <button
          onClick={() => setShowCheckout(false)}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back
        </button>
        
        <StripeCheckout
          amount={2000} // $20.00
          currency="{{options.currency}}"
          description="Example product purchase"
          metadata={{
            productId: 'example-product',
            userId: 'example-user',
          }}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Stripe Payments</h2>
      
      {paymentStatus === 'success' && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md">
          ✅ Payment completed successfully!
        </div>
      )}
      
      {paymentStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md">
          ❌ Payment failed. Please try again.
        </div>
      )}
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Example Product</h3>
          <p className="text-gray-600 text-sm mb-3">
            This is a demo product to test Stripe integration.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">$20.00</span>
            <button
              onClick={() => setShowCheckout(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Buy Now
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>✅ Stripe is configured and ready to accept payments!</p>
          <p className="mt-1">
            Test with card: 4242 4242 4242 4242
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
  ],
  
  postInstall: `🚀 Stripe Payments has been configured successfully!

Next steps:
1. Set up your Stripe account:
   - Visit https://dashboard.stripe.com
   - Get your API keys from the Developers section
   - Add them to your environment variables

2. Configure webhooks:
   - Add webhook endpoint: /api/webhooks/stripe
   - Select events: {{options.webhookEvents.join(', ')}}
   - Copy the webhook secret to your environment

3. Test payments:
   - Use test card: 4242 4242 4242 4242
   - Any future expiry date and CVC

Example usage:
\`\`\`tsx
import { StripeCheckout } from '@/components/stripe/checkout';

<StripeCheckout
  amount={2000} // $20.00
  currency="{{options.currency}}"
  description="Product purchase"
  onSuccess={(paymentIntent) => console.log('Success!', paymentIntent)}
/>
\`\`\`

Documentation: https://stripe.com/docs`,
});

export default paymentsStripePlugin;