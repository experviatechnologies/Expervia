import "server-only";
import { tokenKeyConfigured } from "./crypto";
import {
  CalendarAuthError,
  type CalendarAdapter,
  type TokenSet,
} from "./types";

/**
 * Microsoft Outlook / Microsoft 365 calendars through the Microsoft identity
 * platform (OAuth 2.0 authorization code flow with PKCE) and Microsoft Graph.
 *
 * Env (Vercel):
 *   MICROSOFT_CLIENT_ID      Application (client) ID of the Entra app
 *   MICROSOFT_CLIENT_SECRET  A client secret value for that app
 *   MICROSOFT_TENANT         Optional; defaults to "common" (work, school
 *                            and personal Microsoft accounts)
 *
 * Scopes: Calendars.ReadWrite (read free/busy, write the ETEN meeting events
 * the tracker creates), User.Read (the account's email), offline_access (a
 * refresh token so checks keep working without signing in again).
 */

const SCOPES = [
  "openid",
  "email",
  "offline_access",
  "User.Read",
  "Calendars.ReadWrite",
];

const tenant = () => process.env.MICROSOFT_TENANT || "common";
const authority = () =>
  `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0`;

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
  const res = await fetch(`${authority()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
      client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
      ...body,
    }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !json.access_token) {
    // invalid_grant: the refresh token was revoked, expired or the password
    // changed. The member has to connect again.
    if (
      json.error === "invalid_grant" ||
      json.error === "interaction_required"
    ) {
      throw new CalendarAuthError(
        json.error_description?.split("\r\n")[0] ?? "Authorisation expired.",
        /revoked|AADSTS50173/i.test(json.error_description ?? "")
          ? "revoked"
          : "expired",
      );
    }
    throw new Error(
      `Microsoft token request failed: ${json.error ?? res.status} ${json.error_description?.split("\r\n")[0] ?? ""}`.trim(),
    );
  }
  return json;
}

function toTokenSet(t: TokenResponse, previousRefresh?: string): TokenSet {
  return {
    accessToken: t.access_token!,
    // Microsoft usually rotates the refresh token; keep the old one if not.
    refreshToken: t.refresh_token ?? previousRefresh ?? null,
    expiresAt: new Date(Date.now() + ((t.expires_in ?? 3600) - 60) * 1000),
    scopes: (t.scope ?? "").split(" ").filter(Boolean),
  };
}

/**
 * The email claim from the ID token. It came straight from Microsoft's token
 * endpoint over TLS in this request, so it is used without re-verifying the
 * signature (OpenID Connect Core 3.1.3.7).
 */
function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"),
    ) as { email?: string; preferred_username?: string };
    return payload.email ?? payload.preferred_username ?? null;
  } catch {
    return null;
  }
}

export const microsoft: CalendarAdapter = {
  id: "microsoft",
  label: "Microsoft Outlook",
  configured: () =>
    Boolean(
      process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET,
    ) && tokenKeyConfigured(),

  authorizeUrl({ redirectUri, state, codeChallenge }) {
    const q = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
      response_type: "code",
      redirect_uri: redirectUri,
      response_mode: "query",
      scope: SCOPES.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    });
    return `${authority()}/authorize?${q}`;
  },

  async exchangeCode({ code, redirectUri, codeVerifier }) {
    const t = await tokenRequest({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      scope: SCOPES.join(" "),
    });
    return { ...toTokenSet(t), accountEmail: emailFromIdToken(t.id_token) };
  },

  async refresh(refreshToken) {
    const t = await tokenRequest({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: SCOPES.join(" "),
    });
    return toTokenSet(t, refreshToken);
  },
};
