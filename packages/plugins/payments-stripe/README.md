# Stripe Payments Plugin

This plugin integrates Stripe payments with your Scaforge project, providing secure payment processing, subscription management, and webhook handling.

## Features

- Stripe Elements integration
- Payment Intent and Setup Intent support
- Subscription management
- Webhook handling
- Customer management
- Invoice generation
- Payment method management

## Installation

```bash
npx scaforge add payments-stripe
```

## Configuration

The plugin will prompt you for:
- Stripe publishable key
- Stripe secret key
- Webhook endpoint secret
- Currency settings

## Usage

```typescript
import { stripe } from '@/lib/stripe/client';

// Create a payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
});

// Use Stripe Elements in your components
import { StripeCheckout } from '@/components/stripe/checkout';
```

## Environment Variables

Add these to your `.env.local`:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```