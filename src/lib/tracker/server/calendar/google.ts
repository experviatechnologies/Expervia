import "server-only";
import { tokenKeyConfigured } from "./crypto";
import {
  CalendarAuthError,
  CalendarScopeError,
  type BusyPeriod,
  type CalendarAdapter,
  type CalendarEventInput,
  type TokenSet,
} from "./types";

/**
 * Google Calendar through Google OAuth 2.0 (web server flow with PKCE) and
 * the Calendar API v3, on the member's primary calendar.
 *
 * Env (Vercel):
 *   GOOGLE_CLIENT_ID      OAuth client ID (type "Web application")
 *   GOOGLE_CLIENT_SECRET  Its client secret
 *
 * Scope: calendar.events (read event times for free/busy, and write the ETEN
 * meeting events the tracker creates), plus openid and email for the
 * account's address. Only id, status, transparency, start and end are ever
 * requested when reading.
 */

const CAL_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const SCOPES = ["openid", "email", CAL_SCOPE];
const API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

async function tokenRequest(
  body: Record<string, string>,
): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      ...body,
    }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !json.access_token) {
    // invalid_grant: "Token has been expired or revoked." Reconnect needed.
    if (json.error === "invalid_grant") {
      throw new CalendarAuthError(
        json.error_description ?? "Authorisation expired.",
        /revoked/i.test(json.error_description ?? "") ? "revoked" : "expired",
      );
    }
    throw new Error(
      `Google token request failed: ${json.error ?? res.status} ${json.error_description ?? ""}`.trim(),
    );
  }
  return json;
}

function toTokenSet(t: TokenResponse, previousRefresh?: string): TokenSet {
  return {
    accessToken: t.access_token!,
    // Google normally keeps the same refresh token on refresh.
    refreshToken: t.refresh_token ?? previousRefresh ?? null,
    expiresAt: new Date(Date.now() + ((t.expires_in ?? 3600) - 60) * 1000),
    scopes: (t.scope ?? "").split(" ").filter(Boolean),
  };
}

/** The email claim from the ID token, received directly from Google over TLS. */
function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"),
    ) as { email?: string };
    return payload.email ?? null;
  } catch {
    return null;
  }
}

async function api(
  accessToken: string,
  url: string,
  init: { method: string; body?: unknown },
): Promise<Response> {
  const res = await fetch(url, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (res.status === 401) {
    throw new CalendarAuthError("Google rejected the access token.", "expired");
  }
  return res;
}

async function apiError(res: Response, what: string): Promise<Error> {
  const body = (await res.json().catch(() => ({}))) as {
    error?: { status?: string; message?: string };
  };
  return new Error(
    `Google calendar ${what} failed: ${res.status} ${body.error?.status ?? ""}`.trim(),
  );
}

/**
 * Google lets the client choose an event id (base32hex: 0-9 and a-v), which
 * makes creates idempotent: the seat's uuid key, without dashes, is valid.
 */
const eventIdFor = (key: string) =>
  `eten${key.replace(/-/g, "").toLowerCase()}`;

const eventBody = (ev: CalendarEventInput) => ({
  summary: ev.subject,
  description: ev.body,
  start: { dateTime: new Date(ev.startUtc).toISOString(), timeZone: "UTC" },
  end: { dateTime: new Date(ev.endUtc).toISOString(), timeZone: "UTC" },
  location: ev.location ?? "",
  transparency: "opaque",
  // Restores an event the member had deleted.
  status: "confirmed",
  reminders: {
    useDefault: false,
    overrides: [{ method: "popup", minutes: 30 }],
  },
});

type GoogleEvent = {
  id?: string;
  status?: string;
  transparency?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

/** All-day events carry a date only; treated as the whole UTC day. */
const instant = (t?: { dateTime?: string; date?: string }) =>
  t?.dateTime
    ? new Date(t.dateTime).toISOString()
    : t?.date
      ? new Date(`${t.date}T00:00:00Z`).toISOString()
      : null;

export const google: CalendarAdapter = {
  id: "google",
  label: "Google Calendar",
  configured: () =>
    Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) &&
    tokenKeyConfigured(),

  authorizeUrl({ redirectUri, state, codeChallenge }) {
    const q = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      response_type: "code",
      redirect_uri: redirectUri,
      scope: SCOPES.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      // A refresh token, so checks keep working without signing in again.
      access_type: "offline",
      prompt: "consent select_account",
      include_granted_scopes: "true",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
  },

  async exchangeCode({ code, redirectUri, codeVerifier }) {
    const t = await tokenRequest({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });
    const tokens = toTokenSet(t);
    if (!tokens.scopes.includes(CAL_SCOPE)) {
      throw new CalendarScopeError("Calendar access was not granted.");
    }
    return { ...tokens, accountEmail: emailFromIdToken(t.id_token) };
  },

  async refresh(refreshToken) {
    const t = await tokenRequest({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
    return toTokenSet(t, refreshToken);
  },

  async busy(accessToken, fromUtc, toUtc) {
    const out: BusyPeriod[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < 10; page++) {
      const q = new URLSearchParams({
        timeMin: fromUtc.toISOString(),
        timeMax: toUtc.toISOString(),
        singleEvents: "true",
        maxResults: "2500",
        fields: "items(id,status,transparency,start,end),nextPageToken",
      });
      if (pageToken) q.set("pageToken", pageToken);
      const res = await api(accessToken, `${API}?${q}`, { method: "GET" });
      if (!res.ok) throw await apiError(res, "read");
      const json = (await res.json()) as {
        items?: GoogleEvent[];
        nextPageToken?: string;
      };
      for (const ev of json.items ?? []) {
        // "transparent" = shown as free; cancelled instances are skipped.
        if (ev.status === "cancelled" || ev.transparency === "transparent")
          continue;
        const s = instant(ev.start);
        const e = instant(ev.end);
        if (s && e) out.push({ startUtc: s, endUtc: e, eventId: ev.id });
      }
      pageToken = json.nextPageToken;
      if (!pageToken) break;
    }
    return out;
  },

  async createEvent(accessToken, event, idempotencyKey) {
    const id = eventIdFor(idempotencyKey);
    const res = await api(accessToken, API, {
      method: "POST",
      body: { ...eventBody(event), id },
    });
    if (res.status === 409) {
      // Already created by an earlier attempt (or deleted by the member):
      // bring that same event up to date instead of adding another.
      const patched = await api(accessToken, `${API}/${id}`, {
        method: "PATCH",
        body: eventBody(event),
      });
      if (!patched.ok) throw await apiError(patched, "create");
      return id;
    }
    if (!res.ok) throw await apiError(res, "create");
    return ((await res.json()) as { id?: string }).id ?? id;
  },

  async updateEvent(accessToken, eventId, event) {
    const res = await api(
      accessToken,
      `${API}/${encodeURIComponent(eventId)}`,
      {
        method: "PATCH",
        body: eventBody(event),
      },
    );
    if (res.status === 404 || res.status === 410) return false;
    if (!res.ok) throw await apiError(res, "update");
    return true;
  },

  async deleteEvent(accessToken, eventId) {
    const res = await api(
      accessToken,
      `${API}/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
      },
    );
    if (res.status === 404 || res.status === 410) return;
    if (!res.ok) throw await apiError(res, "delete");
  },
};
