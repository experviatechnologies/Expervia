import "server-only";

/**
 * Provider-independent calendar layer (PRD section 9). Each provider
 * (Microsoft now, Google in step 8.4) implements this interface; the rest of
 * the tracker never talks to a provider directly.
 */

export type CalendarProviderId = "microsoft" | "google";

export type TokenSet = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scopes: string[];
};

export type CalendarAdapter = {
  id: CalendarProviderId;
  label: string;
  /** Client id, secret and token key are all set. */
  configured(): boolean;
  /** Where to send the member to sign in and consent. */
  authorizeUrl(params: {
    redirectUri: string;
    state: string;
    codeChallenge: string;
  }): string;
  /** Swap the code from the callback for tokens and the account's email. */
  exchangeCode(params: {
    code: string;
    redirectUri: string;
    codeVerifier: string;
  }): Promise<TokenSet & { accountEmail: string | null }>;
  /** A fresh access token from the refresh token. */
  refresh(refreshToken: string): Promise<TokenSet>;
};

/** A provider rejected the grant: the member must reconnect. */
export class CalendarAuthError extends Error {
  constructor(
    message: string,
    readonly reason: "expired" | "revoked",
  ) {
    super(message);
  }
}
