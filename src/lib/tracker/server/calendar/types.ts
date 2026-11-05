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
  /**
   * Busy periods between two instants (UTC), times only. Throws
   * CalendarAuthError when the token is rejected.
   */
  busy(accessToken: string, fromUtc: Date, toUtc: Date): Promise<BusyPeriod[]>;
  /**
   * Create an event in the member's own calendar. `idempotencyKey` stops a
   * retried create from adding a second copy. Returns the provider's id.
   */
  createEvent(
    accessToken: string,
    event: CalendarEventInput,
    idempotencyKey: string,
  ): Promise<string>;
  /** Update an event; false when it no longer exists (deleted by the member). */
  updateEvent(
    accessToken: string,
    eventId: string,
    event: CalendarEventInput,
  ): Promise<boolean>;
  /** Delete an event; an event that is already gone counts as done. */
  deleteEvent(accessToken: string, eventId: string): Promise<void>;
};

/** eventId lets ETEN's own meeting events be told apart from other busy time. */
export type BusyPeriod = { startUtc: string; endUtc: string; eventId?: string };

export type CalendarEventInput = {
  subject: string;
  /** Plain text. */
  body: string;
  startUtc: string;
  endUtc: string;
  location?: string;
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

/**
 * The member signed in but did not grant calendar access (Google lets people
 * untick individual permissions on the consent screen).
 */
export class CalendarScopeError extends Error {}
