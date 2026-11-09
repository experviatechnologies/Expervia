import { verifyUnsubscribe, recordUnsubscribe } from "@/lib/email-unsubscribe";

/**
 * One-click unsubscribe (RFC 8058). Gmail and other inboxes POST here when
 * someone presses their own "Unsubscribe" button on an admin broadcast; the
 * address and its signature are in the query string. A GET (someone opening
 * the link) goes to the confirmation page instead, so link scanners that
 * prefetch URLs can't unsubscribe anyone.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("e") ?? "").toLowerCase();
  const token = url.searchParams.get("t") ?? "";
  if (!verifyUnsubscribe(email, token)) {
    return new Response("Invalid unsubscribe link.", { status: 400 });
  }
  const saved = await recordUnsubscribe(email, "one_click");
  return saved
    ? new Response("Unsubscribed.", { status: 200 })
    : new Response("Please try again later.", { status: 500 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = new URL("/unsubscribe", url.origin);
  page.search = url.search;
  return Response.redirect(page, 303);
}
