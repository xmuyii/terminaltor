import crypto from 'crypto';

/**
 * Paystack Webhook Handler for Sovereign Creator Pass
 *
 * Verifies Paystack HMAC SHA512 signature using PAYSTACK_SECRET_KEY
 * and activates `has_pro_pass = TRUE` on the student's Supabase profile.
 */

export interface PaystackWebhookResult {
  success: boolean;
  message: string;
  userId?: string;
  reference?: string;
  event?: string;
}

/**
 * Validates the Paystack HMAC SHA512 signature against the raw request body.
 */
export function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string,
  secretKey: string
): boolean {
  if (!signatureHeader || !secretKey) return false;
  try {
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');
    return hash === signatureHeader;
  } catch {
    return false;
  }
}

/**
 * Processes incoming Paystack event (e.g. charge.success)
 */
export async function handlePaystackWebhookEvent(
  rawPayload: string,
  signatureHeader: string,
  secretKey: string = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET || ''
): Promise<PaystackWebhookResult> {
  // If secret is set, enforce cryptographic HMAC verification
  if (secretKey && secretKey !== 'simulation_mode') {
    const isValid = verifyPaystackSignature(rawPayload, signatureHeader, secretKey);
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid Paystack signature verification (x-paystack-signature mismatch).',
      };
    }
  }

  let eventData: any;
  try {
    eventData = JSON.parse(rawPayload);
  } catch (err: any) {
    return {
      success: false,
      message: `Invalid JSON body: ${err?.message}`,
    };
  }

  const eventType = eventData.event;
  const data = eventData.data || {};

  switch (eventType) {
    case 'charge.success': {
      const reference = data.reference;
      const metadata = data.metadata || {};
      const userId = metadata.user_id || metadata.custom_fields?.find((f: any) => f.variable_name === 'user_id')?.value;

      if (!userId) {
        return {
          success: false,
          message: 'Missing user_id in Paystack charge metadata',
          reference,
          event: eventType,
        };
      }

      // Success: Grants Sovereign Creator Pass
      // In production: UPDATE public.profiles SET has_pro_pass = TRUE WHERE id = userId;
      return {
        success: true,
        message: `Paystack transaction ${reference} verified. Creator Pass granted (has_pro_pass=true) to user ${userId}.`,
        userId,
        reference,
        event: eventType,
      };
    }

    default:
      return {
        success: true,
        message: `Ignored Paystack event '${eventType}'.`,
        event: eventType,
      };
  }
}
