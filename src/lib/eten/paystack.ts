import crypto from "crypto";

/**
 * Minimal Paystack client for ETEN mentorship payments (Monetization M-2).
 *
 * V1 uses the redirect flow: we initialize a transaction server-side, send the
 * mentee to Paystack's hosted checkout, and treat the transaction as paid only
 * after the backend verifies it (webhook + verify call). All amounts are in
 * MINOR units (kobo/cents). Only the secret key is needed server-side.
 *
 * The layer is intentionally small and provider-shaped so a second provider
 * (e.g. Maplerad for payouts) can be added later without leaking Paystack
 * specifics into the rest of the app.
 */

const BASE = "https://api.paystack.co";

/**
 * Resolve the active Paystack secret key. PAYSTACK_MODE selects live vs test and
 * DEFAULTS TO TEST, so we never charge real cards unless live is chosen on
 * purpose. PAYSTACK_SECRET_KEY, if set, overrides the mode selection.
 *
 * Expected env:
 *   PAYSTACK_MODE=test|live        (optional; default test)
 *   PAYSTACK_TEST_SECRET_KEY=sk_test_...
 *   PAYSTACK_LIVE_SECRET_KEY=sk_live_...
 */
function resolveSecretKey(): string | undefined {
  if (process.env.PAYSTACK_SECRET_KEY) return process.env.PAYSTACK_SECRET_KEY;
  return process.env.PAYSTACK_MODE === "live"
    ? process.env.PAYSTACK_LIVE_SECRET_KEY
    : process.env.PAYSTACK_TEST_SECRET_KEY;
}

function secretKey(): string {
  const k = resolveSecretKey();
  if (!k) throw new Error("Paystack secret key is not set");
  return k;
}

/** True once a Paystack secret key is configured for the active mode. */
export function isPaystackConfigured(): boolean {
  return Boolean(resolveSecretKey());
}

export type InitInput = {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

export type InitResult = { authorizationUrl: string; reference: string };

/** Start a transaction; returns the hosted-checkout URL to redirect to. */
export async function paystackInitialize(
  input: InitInput,
): Promise<InitResult | { error: string }> {
  try {
    const res = await fetch(`${BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amountMinor,
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata ?? {},
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.status || !json?.data?.authorization_url) {
      return { error: json?.message ?? "Could not start the payment." };
    }
    return {
      authorizationUrl: json.data.authorization_url as string,
      reference: (json.data.reference as string) ?? input.reference,
    };
  } catch {
    return { error: "Could not reach the payment provider." };
  }
}

export type VerifyResult = {
  status: string; // Paystack txn status: 'success', 'failed', 'abandoned', ...
  reference: string;
  amountMinor: number;
  currency: string;
  channel: string | null; // -> payment_method
  providerTransactionId: string; // Paystack data.id
  feesMinor: number | null;
  paidAt: string | null;
};

/** Authoritative check of a transaction's real status with Paystack. */
export async function paystackVerify(
  reference: string,
): Promise<VerifyResult | { error: string }> {
  try {
    const res = await fetch(
      `${BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey()}` } },
    );
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.status || !json?.data) {
      return { error: json?.message ?? "Could not verify the payment." };
    }
    const d = json.data;
    return {
      status: String(d.status),
      reference: String(d.reference),
      amountMinor: Number(d.amount),
      currency: String(d.currency),
      channel: d.channel ? String(d.channel) : null,
      providerTransactionId: String(d.id),
      feesMinor: typeof d.fees === "number" ? d.fees : null,
      paidAt: d.paid_at ?? d.paidAt ?? null,
    };
  } catch {
    return { error: "Could not reach the payment provider." };
  }
}

/**
 * Verify a Paystack webhook signature. Paystack signs the raw body with
 * HMAC-SHA512 using the secret key and sends it in x-paystack-signature.
 */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  try {
    const hash = crypto
      .createHmac("sha512", secretKey())
      .update(rawBody)
      .digest("hex");
    const a = Buffer.from(hash);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
