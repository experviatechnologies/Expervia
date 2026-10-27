import "server-only";

/**
 * Minimal FX helper for the public booking page (PB-3). Fetches live rates from
 * a provider that covers the currencies ETEN prices in (NGN/USD/GHS/KES/ZAR),
 * caches them in memory for an hour, and serves a stale rate if a refresh
 * fails. Provider-agnostic: override the base URL with FX_RATES_URL as long as
 * it answers `${BASE}/${CODE}` with a JSON body carrying `rates` (or
 * `conversion_rates`). Defaults to the free, no-key open.er-api.com endpoint.
 *
 * All ETEN currencies use two-decimal minor units, so a minor-unit amount
 * converts with the same multiplier as the major amount.
 */

const BASE_URL = (
  process.env.FX_RATES_URL ?? "https://open.er-api.com/v6/latest"
).replace(/\/$/, "");
const TTL_MS = 60 * 60 * 1000; // 1 hour

type CacheEntry = { rates: Record<string, number>; fetchedAt: number };
const cache = new Map<string, CacheEntry>();

async function getRates(base: string): Promise<Record<string, number> | null> {
  const code = base.toUpperCase();
  const hit = cache.get(code);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) return hit.rates;

  try {
    const res = await fetch(`${BASE_URL}/${code}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return hit?.rates ?? null; // serve stale on a bad response
    const json = (await res.json()) as {
      rates?: Record<string, number>;
      conversion_rates?: Record<string, number>;
    };
    const rates = json.rates ?? json.conversion_rates;
    if (!rates || typeof rates !== "object") return hit?.rates ?? null;
    cache.set(code, { rates, fetchedAt: Date.now() });
    return rates;
  } catch {
    return hit?.rates ?? null; // network/timeout: serve stale if we have it
  }
}

/** Live `to`-per-`from` rate, or null when unavailable. 1 for same currency. */
export async function getFxRate(
  from: string,
  to: string,
): Promise<number | null> {
  if (from.toUpperCase() === to.toUpperCase()) return 1;
  const rates = await getRates(from);
  const rate = rates?.[to.toUpperCase()];
  return rate && rate > 0 ? rate : null;
}

/**
 * Convert a minor-unit amount from one ETEN currency to another using the live
 * rate. Returns null if no rate is available (caller must then refuse rather
 * than guess at a price). Same-currency is a pass-through.
 */
export async function convertMinor(
  amountMinor: number,
  from: string,
  to: string,
): Promise<number | null> {
  if (from.toUpperCase() === to.toUpperCase()) return Math.round(amountMinor);
  const rate = await getFxRate(from, to);
  if (rate == null) return null;
  return Math.round(amountMinor * rate);
}
