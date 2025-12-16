/**
 * Midtrans Payments Plugin for Scaforge
 * Indonesian payment gateway with multiple payment methods
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const paymentsMidtransPlugin = definePlugin({
  name: 'payments-midtrans',
  displayName: 'Midtrans Payments',
  category: 'payments',
  description: 'Indonesian payment gateway with multiple payment methods',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'midtrans-client': '^1.3.1',
    },
  },
  
  configSchema: z.object({
    environment: z.enum(['sandbox', 'production']).default('sandbox'),
    enabledPayments: z.array(z.string()).default([
      'credit_card',
      'bca_va',
      'bni_va',
      'bri_va',
      'echannel',
      'gopay',
      'shopeepay',
      'qris',
    ]),
    creditCard: z.object({
      secure: z.boolean().default(true),
      saveCard: z.boolean().default(false),
    }).optional(),
  }),
  
  envVars: [
    {
      name: 'MIDTRANS_SERVER_KEY',
      description: 'Midtrans server key',
      required: true,
      secret: true,
    },
    {
      name: 'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY',
      description: 'Midtrans client key',
      required: true,
    },
    {
      name: 'MIDTRANS_ENVIRONMENT',
      description: 'Midtrans environment (sandbox/production)',
      required: false,
      default: 'sandbox',
    },
  ],
  
  files: [
    // Midtrans client configuration
    {
      path: 'src/lib/midtrans/client.ts',
      template: `import { CoreApi, Snap } from 'midtrans-client';

const isProduction = process.env.MIDTRANS_ENVIRONMENT === 'production';

export const snap = new Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
});

export const coreApi = new CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
});

// Transaction types
export interface MidtransTransaction {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    billing_address?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      country_code?: string;
    };
    shipping_address?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      country_code?: string;
    };
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
    brand?: string;
    category?: string;
    merchant_name?: string;
  }>;
  enabled_payments?: string[];
  credit_card?: {
    secure?: boolean;
    save_card?: boolean;
    channel?: string;
    bank?: string;
  };
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
}

// Helper functions
export async function createTransaction(params: MidtransTransaction) {
  const transaction = {
    ...params,
    enabled_payments: params.enabled_payments || {{JSON.stringify options.enabledPayments}},
    {{#if options.creditCard}}
    credit_card: {
      secure: {{options.creditCard.secure}},
      save_card: {{options.creditCard.saveCard}},
      ...params.credit_card,
    },
    {{/if}}
  };

  return await snap.createTransaction(transaction);
}

export async function getTransactionStatus(orderId: string) {
  return await coreApi.transaction.status(orderId);
}

export async function approveTransaction(orderId: string) {
  return await coreApi.transaction.approve(orderId);
}

export async function cancelTransaction(orderId: string) {
  return await coreApi.transaction.cancel(orderId);
}

export async function expireTransaction(orderId: string) {
  return await coreApi.transaction.expire(orderId);
}

export async function refundTransaction(orderId: string, amount?: number, reason?: string) {
  const params: any = {};
  if (amount) params.amount = amount;
  if (reason) params.reason = reason;
  
  return await coreApi.transaction.refund(orderId, params);
}
`,
      overwrite: false,
    },
    
    // Client-side configuration
    {
      path: 'src/lib/midtrans/config.ts',
      template: `export const midtransConfig = {
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
  environment: process.env.MIDTRANS_ENVIRONMENT || '{{options.environment}}',
  snapUrl: process.env.MIDTRANS_ENVIRONMENT === 'production' 
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.stg.midtrans.com/snap/snap.js',
};

// Load Snap.js script
export function loadMidtransScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).snap) {
      resolve((window as any).snap);
      return;
    }

    const script = document.createElement('script');
    script.src = midtransConfig.snapUrl;
    script.setAttribute('data-client-key', midtransConfig.clientKey);
    
    script.onload = () => {
      resolve((window as any).snap);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Midtrans Snap script'));
    };
    
    document.head.appendChild(script);
  });
}
`,
      overwrite: false,
    },
    
    // Notification handler
    {
      path: 'src/app/api/webhooks/midtrans/route.ts',
      template: `import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getTransactionStatus } from '@/lib/midtrans/client';

const serverKey = process.env.MIDTRANS_SERVER_KEY!;

function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signature: string
): boolean {
  const hash = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');
  
  return hash === signature;
}

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();
    
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = notification;

    // Verify signature
    if (!verifySignature(order_id, status_code, gross_amount, signature_key)) {
      console.error('Invalid signature for order:', order_id);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Get transaction status from Midtrans
    const transactionStatus = await getTransactionStatus(order_id);
    
    console.log('Midtrans notification:', {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
    });

    // Handle different transaction statuses
    switch (transaction_status) {
      case 'capture':
        if (fraud_status === 'accept') {
          // Payment successful
          console.log('Payment captured successfully:', order_id);
          // Update your database here
        } else if (fraud_status === 'challenge') {
          // Payment is challenged, review needed
          console.log('Payment challenged:', order_id);
          // Handle challenged payment
        } else {
          // Payment denied
          console.log('Payment denied:', order_id);
          // Handle denied payment
        }
        break;
        
      case 'settlement':
        // Payment settled
        console.log('Payment settled:', order_id);
        // Update your database here
        break;
        
      case 'pending':
        // Payment pending (e.g., bank transfer)
        console.log('Payment pending:', order_id);
        // Update your database here
        break;
        
      case 'deny':
        // Payment denied
        console.log('Payment denied:', order_id);
        // Handle denied payment
        break;
        
      case 'cancel':
      case 'expire':
        // Payment cancelled or expired
        console.log('Payment cancelled/expired:', order_id);
        // Handle cancelled/expired payment
        break;
        
      case 'refund':
        // Payment refunded
        console.log('Payment refunded:', order_id);
        // Handle refunded payment
        break;
        
      default:
        console.log(\`Unknown transaction status: \${transaction_status}\`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing Midtrans notification:', error);
    return NextResponse.json(
      { error: 'Notification processing failed' },
      { status: 500 }
    );
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Transaction API route
    {
      path: 'src/app/api/midtrans/transaction/route.ts',
      template: `import { NextRequest, NextResponse } from 'next/server';
import { createTransaction } from '@/lib/midtrans/client';
import type { MidtransTransaction } from '@/lib/midtrans/client';

export async function POST(req: NextRequest) {
  try {
    const transactionData: MidtransTransaction = await req.json();

    if (!transactionData.transaction_details?.order_id || 
        !transactionData.transaction_details?.gross_amount) {
      return NextResponse.json(
        { error: 'order_id and gross_amount are required' },
        { status: 400 }
      );
    }

    const transaction = await createTransaction(transactionData);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionData.transaction_details.order_id,
    });
  } catch (error) {
    console.error('Error creating Midtrans transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Transaction status API route
    {
      path: 'src/app/api/midtrans/status/[orderId]/route.ts',
      template: `import { NextRequest, NextResponse } from 'next/server';
import { getTransactionStatus } from '@/lib/midtrans/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const status = await getTransactionStatus(orderId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting transaction status:', error);
    return NextResponse.json(
      { error: 'Failed to get transaction status' },
      { status: 500 }
    );
  }
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Midtrans payment component
    {
      path: 'src/components/midtrans/payment.tsx',
      template: `'use client';

import { useState, useEffect } from 'react';
import { loadMidtransScript } from '@/lib/midtrans/config';

interface MidtransPaymentProps {
  orderId: string;
  amount: number;
  customerDetails?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  itemDetails?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  onSuccess?: (result: any) => void;
  onPending?: (result: any) => void;
  onError?: (result: any) => void;
  onClose?: () => void;
}

export function MidtransPayment({
  orderId,
  amount,
  customerDetails,
  itemDetails,
  onSuccess,
  onPending,
  onError,
  onClose,
}: MidtransPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load Midtrans script
      const snap = await loadMidtransScript();

      // Create transaction
      const response = await fetch('/api/midtrans/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: orderId,
            gross_amount: amount,
          },
          customer_details: customerDetails,
          item_details: itemDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      // Open Snap payment popup
      snap.pay(data.token, {
        onSuccess: (result: any) => {
          console.log('Payment success:', result);
          onSuccess?.(result);
        },
        onPending: (result: any) => {
          console.log('Payment pending:', result);
          onPending?.(result);
        },
        onError: (result: any) => {
          console.error('Payment error:', result);
          onError?.(result);
        },
        onClose: () => {
          console.log('Payment popup closed');
          onClose?.();
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError?.({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Processing...' : \`Pay \${new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
        }).format(amount)}\`}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <p>Secure payment powered by Midtrans</p>
        <p>Supports Credit Card, Bank Transfer, E-wallets, and QRIS</p>
      </div>
    </div>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
    
    // Example usage component
    {
      path: 'src/components/examples/midtrans-example.tsx',
      template: `'use client';

import { useState } from 'react';
import { MidtransPayment } from '@/components/midtrans/payment';

export function MidtransExample() {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'pending' | 'error'>('idle');
  const [orderId] = useState(\`order-\${Date.now()}\`);

  const handlePaymentSuccess = (result: any) => {
    console.log('Payment succeeded:', result);
    setPaymentStatus('success');
  };

  const handlePaymentPending = (result: any) => {
    console.log('Payment pending:', result);
    setPaymentStatus('pending');
  };

  const handlePaymentError = (result: any) => {
    console.error('Payment failed:', result);
    setPaymentStatus('error');
  };

  const resetPayment = () => {
    setPaymentStatus('idle');
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Midtrans Payments</h2>
      
      {paymentStatus === 'success' && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md">
          ✅ Payment completed successfully!
          <button
            onClick={resetPayment}
            className="ml-2 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}
      
      {paymentStatus === 'pending' && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-md">
          ⏳ Payment is pending. Please complete the payment.
          <button
            onClick={resetPayment}
            className="ml-2 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}
      
      {paymentStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md">
          ❌ Payment failed. Please try again.
          <button
            onClick={resetPayment}
            className="ml-2 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}
      
      {paymentStatus === 'idle' && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Contoh Produk</h3>
            <p className="text-gray-600 text-sm mb-3">
              Ini adalah produk demo untuk menguji integrasi Midtrans.
            </p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                }).format(100000)}
              </span>
            </div>
            
            <MidtransPayment
              orderId={orderId}
              amount={100000}
              customerDetails={{
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                phone: '+62812345678',
              }}
              itemDetails={[
                {
                  id: 'item-1',
                  price: 100000,
                  quantity: 1,
                  name: 'Contoh Produk',
                },
              ]}
              onSuccess={handlePaymentSuccess}
              onPending={handlePaymentPending}
              onError={handlePaymentError}
            />
          </div>
          
          <div className="text-sm text-gray-500">
            <p>✅ Midtrans is configured and ready!</p>
            <p className="mt-1">
              Supports: Credit Card, Bank Transfer, GoPay, ShopeePay, QRIS
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
`,
      condition: { template: 'nextjs' },
      overwrite: false,
    },
  ],
  
  postInstall: `🚀 Midtrans Payments has been configured successfully!

Next steps:
1. Set up your Midtrans account:
   - Visit https://dashboard.midtrans.com
   - Get your Server Key and Client Key
   - Add them to your environment variables

2. Configure notification URL:
   - Set notification URL: /api/webhooks/midtrans
   - Enable notification for transaction status changes

3. Test payments:
   - Use sandbox environment for testing
   - Test with various payment methods

Supported payment methods:
- Credit Card (Visa, MasterCard, JCB, Amex)
- Bank Transfer (BCA, BNI, BRI, Mandiri, Permata)
- E-wallets (GoPay, ShopeePay, DANA, LinkAja, OVO)
- QRIS (Quick Response Code Indonesian Standard)
- Convenience Store (Indomaret, Alfamart)

Example usage:
\`\`\`tsx
import { MidtransPayment } from '@/components/midtrans/payment';

<MidtransPayment
  orderId="order-123"
  amount={100000} // IDR 100,000
  customerDetails={{
    first_name: 'John',
    email: 'john@example.com',
  }}
  onSuccess={(result) => console.log('Success!', result)}
/>
\`\`\`

Documentation: https://docs.midtrans.com`,
});

export default paymentsMidtransPlugin;