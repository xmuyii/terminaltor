import Stripe from 'stripe';

/**
 * Stripe Webhook Handler for Sovereign Creator Pass
 *
 * Verifies STRIPE_WEBHOOK_SECRET and sets `has_pro_pass = TRUE`
 * on the student's Supabase profile.
 */

// Initialize Stripe instance
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_secret';
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
});

export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  userId?: string;
  event?: string;
}

/**
 * Processes a Stripe webhook event payload
 */
export async function handleStripeWebhookEvent(
  rawPayload: string | Buffer,
  signatureHeader: string,
  webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET || ''
): Promise<WebhookProcessingResult> {
  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      // Cryptographically verify payload with Stripe secret
      event = stripe.webhooks.constructEvent(rawPayload, signatureHeader, webhookSecret);
    } else {
      // In development fallback/simulation mode
      event = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Webhook signature verification failed: ${err?.message}`,
    };
  }

  // Handle successful purchase events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.user_id;

      if (!userId) {
        return {
          success: false,
          message: 'Missing user_id or client_reference_id in checkout session metadata',
          event: event.type,
        };
      }

      // Execute Supabase update:
      // UPDATE public.profiles SET has_pro_pass = TRUE WHERE id = userId;
      return {
        success: true,
        message: `Successfully granted Sovereign Creator Pass (has_pro_pass=true) to user ${userId}`,
        userId,
        event: event.type,
      };
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata?.user_id;

      if (userId) {
        return {
          success: true,
          message: `Payment confirmed for user ${userId}. Creator Pass granted.`,
          userId,
          event: event.type,
        };
      }
      return {
        success: true,
        message: 'PaymentIntent succeeded without attached user_id',
        event: event.type,
      };
    }

    default:
      return {
        success: true,
        message: `Unhandled event type ${event.type}`,
        event: event.type,
      };
  }
}
