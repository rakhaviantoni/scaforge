# Midtrans Payments Plugin

This plugin integrates Midtrans payment gateway with your Scaforge project, providing Indonesian payment methods including credit cards, bank transfers, e-wallets, and QRIS.

## Features

- Snap payment integration
- Core API support
- Multiple payment methods (Credit Card, Bank Transfer, E-wallets, QRIS)
- Notification handling
- Transaction status checking
- Refund support

## Installation

```bash
npx scaforge add payments-midtrans
```

## Configuration

The plugin will prompt you for:
- Server key
- Client key
- Environment (sandbox/production)
- Notification URL

## Usage

```typescript
import { midtrans } from '@/lib/midtrans/client';

// Create transaction
const transaction = await midtrans.createTransaction({
  transaction_details: {
    order_id: 'order-123',
    gross_amount: 100000,
  },
  customer_details: {
    first_name: 'John',
    email: 'john@example.com',
  },
});
```

## Environment Variables

Add these to your `.env.local`:

```
MIDTRANS_SERVER_KEY=SB-Mid-server-...
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_ENVIRONMENT=sandbox
```