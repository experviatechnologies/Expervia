"use server";

import { revalidatePath } from "next/cache";
import { authorizeTracker } from "@/lib/tracker/server/session";
import { deleteConnection } from "@/lib/tracker/server/calendar";
import { auditTracker } from "@/lib/tracker/server/events";

/**
 * Disconnect the caller's own calendar (Phase 8, step 8.1). The stored tokens
 * are deleted at once, so the tracker can no longer read or write it.
 * Connecting goes through /api/tracker/calendar/<provider>/start (a redirect
 * to the provider), not a server action.
 */
export async function disconnectCalendar(): Promise<
  { ok: true } | { error: string }
> {
  const auth = await authorizeTracker("member");
  if ("error" in auth) return auth;
  const id = auth.session.member.id;

  try {
    const removed = await deleteConnection(id);
    if (!removed) return { error: "No calendar is connected." };
  } catch {
    return { error: "Couldn't disconnect your calendar. Try again." };
  }

  await auditTracker({
    actorId: id,
    action: "calendar_disconnected",
    targetType: "member",
    targetId: id,
  });
  revalidatePath("/tracker", "layout");
  return { ok: true };
}
