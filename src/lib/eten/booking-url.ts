/**
 * Public booking URL for a mentor, host-aware.
 *
 * The mentorship subdomain (NEXT_PUBLIC_MENTORSHIP_HOST) rewrites every path to
 * /mentorship/<path> (see next.config.ts), with /mentorship/* excluded. So the
 * route lives at /mentorship/m/<handle>, and:
 *   - on the subdomain we emit the short /m/<handle> (rewritten to it), and
 *   - elsewhere we emit the full /mentorship/m/<handle> (served directly).
 * Without a handle we fall back to the id link, which works on both.
 */
export function mentorBookingUrl(
  origin: string,
  handle: string | null | undefined,
  mentorId: string,
): string {
  const host = process.env.NEXT_PUBLIC_MENTORSHIP_HOST;
  const onSubdomain = Boolean(host && origin.includes(host));
  if (handle) {
    return onSubdomain
      ? `${origin}/m/${handle}`
      : `${origin}/mentorship/m/${handle}`;
  }
  return `${origin}/mentorship/book/${mentorId}`;
}
