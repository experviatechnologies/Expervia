/**
 * Only same-site paths are honoured as a post-sign-in destination, so a
 * crafted ?next= can never send someone to another site.
 */
export function safeNext(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  return next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
    ? next
    : fallback;
}
