import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { decryptToken, encryptToken } from "./crypto";
import { microsoft } from "./microsoft";
import {
  CalendarAuthError,
  type CalendarAdapter,
  type CalendarProviderId,
  type TokenSet,
} from "./types";

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
  if (expiresAt > Date.now()) {
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
