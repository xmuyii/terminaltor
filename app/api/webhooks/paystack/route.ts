import { handlePaystackWebhookEvent } from '../../../../src/api/webhooks/paystack';

/**
 * Next.js 14+ App Router Route Handler: POST /api/webhooks/paystack
 */
export async function POST(req: Request) {
  const signature = req.headers.get('x-paystack-signature') || '';

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing x-paystack-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await req.text();
  const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET || '';

  const result = await handlePaystackWebhookEvent(rawBody, signature, secret);

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ received: true, ...result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
