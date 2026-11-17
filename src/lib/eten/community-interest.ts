/**
 * Communities a visitor can signal interest in when they arrive at /join from
 * a community landing page (e.g. /join?community=women-in-tech). The slug is
 * stored on the new account's auth user metadata as `community_interest`, so
 * members can be segmented later without a new table. Client-safe.
 */
export const COMMUNITY_INTERESTS = {
  "women-in-tech": "ETEN Women in Tech",
} as const;

export type CommunityInterest = keyof typeof COMMUNITY_INTERESTS;

export function parseCommunityInterest(
  value: unknown,
): CommunityInterest | null {
  return typeof value === "string" && Object.hasOwn(COMMUNITY_INTERESTS, value)
    ? (value as CommunityInterest)
    : null;
}
