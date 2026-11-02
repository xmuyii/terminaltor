import { handleStripeWebhookEvent } from '../../../../src/api/webhooks/stripe';

/**
 * Next.js 14+ App Router Route Handler: POST /api/webhooks/stripe
 */
export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';

  const result = await handleStripeWebhookEvent(rawBody, signature, secret);

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
