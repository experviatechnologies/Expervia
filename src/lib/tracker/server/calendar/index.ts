import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { decryptToken, encryptToken } from "./crypto";
import { microsoft } from "./microsoft";
import {
  CalendarAuthError,
  type CalendarAdapter,
  type BusyPeriod,
  type CalendarProviderId,
  type TokenSet,
} from "./types";

export type { BusyPeriod } from "./types";

/**
 * Calendar connections: the one place that stores, reads and refreshes a
 * member's OAuth tokens. Tokens never leave the server.
 */

const ADAPTERS: Partial<Record<CalendarProviderId, CalendarAdapter>> = {
  microsoft,
};

export function calendarAdapter(id: string): CalendarAdapter | null {
  return ADAPTERS[id as CalendarProviderId] ?? null;
}

export function calendarConfigured(id: CalendarProviderId): boolean {
  return ADAPTERS[id]?.configured() ?? false;
}

/** PKCE verifier and its S256 challenge, plus a random state value. */
export function oauthSecrets() {
  const verifier = randomBytes(32).toString("base64url");
  return {
    state: randomBytes(24).toString("base64url"),
    verifier,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
  };
}

export async function saveConnection(params: {
  memberId: string;
  provider: CalendarProviderId;
  tokens: TokenSet;
  accountEmail: string | null;
}): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("presales_calendar_connections")
    .upsert(
      {
        member_id: params.memberId,
        provider: params.provider,
        status: "connected",
        account_email: params.accountEmail,
        access_token_enc: encryptToken(params.tokens.accessToken),
        refresh_token_enc: params.tokens.refreshToken
          ? encryptToken(params.tokens.refreshToken)
          : null,
        token_expires_at: params.tokens.expiresAt.toISOString(),
        scopes: params.tokens.scopes,
        last_error: null,
        last_checked_at: new Date().toISOString(),
        connected_at: new Date().toISOString(),
      },
      { onConflict: "member_id" },
    );
  if (error)
    throw new Error(`Couldn't save the calendar connection: ${error.message}`);
}

export async function deleteConnection(memberId: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("presales_calendar_connections")
    .delete()
    .eq("member_id", memberId)
    .select("member_id");
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

/**
 * A working access token for this member's calendar, refreshed when needed.
 * Marks the connection expired or revoked when the provider rejects it, and
 * returns null; callers then treat the calendar as unverified (never free).
 */
export async function accessTokenFor(
  memberId: string,
  opts: { forceRefresh?: boolean } = {},
): Promise<{ provider: CalendarAdapter; token: string } | null> {
  const admin = getSupabaseAdmin();
  const { data: row } = await admin
    .from("presales_calendar_connections")
    .select(
      "provider, status, access_token_enc, refresh_token_enc, token_expires_at",
    )
    .eq("member_id", memberId)
    .maybeSingle();
  if (!row || row.status !== "connected") return null;
  const provider = calendarAdapter(row.provider as string);
  if (!provider?.configured()) return null;

  const expiresAt = row.token_expires_at
    ? Date.parse(row.token_expires_at as string)
    : 0;
  if (expiresAt > Date.now() && !opts.forceRefresh) {
    return { provider, token: decryptToken(row.access_token_enc as string) };
  }

  const mark = (status: string, lastError: string) =>
    admin
      .from("presales_calendar_connections")
      .update({ status, last_error: lastError.slice(0, 500) })
      .eq("member_id", memberId);

  if (!row.refresh_token_enc) {
    await mark("expired", "No refresh token; please reconnect.");
    return null;
  }
  try {
    const t = await provider.refresh(
      decryptToken(row.refresh_token_enc as string),
    );
    await admin
      .from("presales_calendar_connections")
      .update({
        access_token_enc: encryptToken(t.accessToken),
        refresh_token_enc: t.refreshToken ? encryptToken(t.refreshToken) : null,
        token_expires_at: t.expiresAt.toISOString(),
        last_error: null,
        last_checked_at: new Date().toISOString(),
      })
      .eq("member_id", memberId);
    return { provider, token: t.accessToken };
  } catch (e) {
    if (e instanceof CalendarAuthError) {
      await mark(e.reason, e.message);
    } else {
      // Network or provider hiccup: keep the connection, note the error, and
      // treat this check as unverified. The next check tries again.
      await admin
        .from("presales_calendar_connections")
        .update({
          last_error: (e instanceof Error ? e.message : "Unknown error").slice(
            0,
            500,
          ),
        })
        .eq("member_id", memberId);
    }
    return null;
  }
}

// ------------------------------------------------------------------ free/busy

/** How far ahead the scheduled sync reads, and how long a sync stays fresh. */
export const BUSY_AHEAD_DAYS = 28;
export const BUSY_FRESH_MS = 60 * 60_000;

/**
 * Read busy times live. ok:false means the calendar could not be checked
 * (not connected, expired, provider error): the caller must then treat the
 * member as unverified, never as free.
 */
export async function readBusy(
  memberId: string,
  fromUtc: Date,
  toUtc: Date,
): Promise<{ ok: true; busy: BusyPeriod[] } | { ok: false }> {
  const admin = getSupabaseAdmin();
  for (let attempt = 0; attempt < 2; attempt++) {
    const auth = await accessTokenFor(memberId, { forceRefresh: attempt > 0 });
    if (!auth) return { ok: false };
    try {
      const busy = await auth.provider.busy(auth.token, fromUtc, toUtc);
      await admin
        .from("presales_calendar_connections")
        .update({ last_error: null, last_checked_at: new Date().toISOString() })
        .eq("member_id", memberId);
      return { ok: true, busy };
    } catch (e) {
      // A rejected token: refresh once and retry before giving up (the
      // refresh marks the connection expired if that fails too).
      if (e instanceof CalendarAuthError && attempt === 0) continue;
      await admin
        .from("presales_calendar_connections")
        .update({
          last_error: (e instanceof Error ? e.message : "Unknown error").slice(
            0,
            500,
          ),
          last_checked_at: new Date().toISOString(),
        })
        .eq("member_id", memberId);
      return { ok: false };
    }
  }
  return { ok: false };
}

/** Read and store one member's busy times for the next BUSY_AHEAD_DAYS. */
export async function syncBusyFor(memberId: string): Promise<boolean> {
  const from = new Date();
  const to = new Date(from.getTime() + BUSY_AHEAD_DAYS * 86_400_000);
  const res = await readBusy(memberId, from, to);
  if (!res.ok) return false;
  const { error } = await getSupabaseAdmin()
    .from("presales_calendar_connections")
    .update({
      busy: res.busy.map((b) => ({ s: b.startUtc, e: b.endUtc })),
      busy_until: to.toISOString(),
      busy_synced_at: from.toISOString(),
    })
    .eq("member_id", memberId);
  return !error;
}

/**
 * The scheduled sync: every connected calendar, a few at a time. Returns
 * counts for the job log.
 */
export async function syncAllBusy(): Promise<Record<string, number>> {
  const { data, error } = await getSupabaseAdmin()
    .from("presales_calendar_connections")
    .select("member_id")
    .eq("status", "connected");
  // 42P01/42703: migrations 54/55 not run yet, so nothing to sync.
  if (error?.code === "42P01" || error?.code === "42703") return {};
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((r) => r.member_id as string);
  let synced = 0;
  let failed = 0;
  for (let i = 0; i < ids.length; i += 5) {
    const results = await Promise.all(ids.slice(i, i + 5).map(syncBusyFor));
    for (const ok of results) {
      if (ok) synced++;
      else failed++;
    }
  }
  return { calendars_synced: synced, calendars_failed: failed };
}
