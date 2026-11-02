"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  authorizeTracker,
  hasRole,
  type TrackerSession,
} from "@/lib/tracker/server/session";
import {
  auditTracker,
  logActivity,
  notifyPresales,
} from "@/lib/tracker/server/events";
import { sendTrackerEmail } from "@/lib/tracker/server/email";

/**
 * Pod Leader nominations, live (Phase 5, step 5.2; PRD FR-016, section 8).
 *
 * A pod's Lead or backup leader (or an admin, for support) nominates
 * engineers from that pod for a request routed to it, records that no one is
 * suitable, or withdraws a nomination that hasn't been selected yet. The
 * request's Sales Manager is told in the app and by email.
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;
type Result = { ok: true } | { error: string };

const OPEN_FOR_NOMINATIONS = ["open", "nominations_received", "selection"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The caller may act for this pod: its Lead/backup, or an admin. */
function leadsPod(session: TrackerSession, podId: string) {
  return session.ledPodIds.includes(podId) || hasRole(session, "admin");
}

/** Load a request routed to the pod and still taking nominations. */
async function routedRequest(admin: Admin, requestId: string, podId: string) {
  if (!UUID.test(requestId) || !UUID.test(podId))
    return { error: "Request not found." } as const;
  const [{ data: req }, { data: route }, { data: pod }] = await Promise.all([
    admin
      .from("presales_requests")
      .select("id, ref, title, status, owner_id, access")
      .eq("id", requestId)
      .maybeSingle(),
    admin
      .from("presales_request_pods")
      .select("status")
      .eq("request_id", requestId)
      .eq("pod_id", podId)
      .maybeSingle(),
    admin.from("pods").select("name").eq("id", podId).maybeSingle(),
  ]);
  if (!req || !route)
    return { error: "This request is not routed to your pod." } as const;
  if (req.access === "restricted")
    return { error: "This request is restricted to Sales." } as const;
  if (!OPEN_FOR_NOMINATIONS.includes(req.status))
    return { error: "Nominations are closed for this request." } as const;
  return { req, route, podName: (pod?.name as string) ?? "Your pod" } as const;
}

async function tellOwner(params: {
  ownerId: string;
  actorId: string;
  requestId: string;
  ref: string;
  title: string;
  event: "nominations_submitted" | "none_suitable";
  body: string;
}) {
  await notifyPresales({
    recipients: [params.ownerId],
    actorId: params.actorId,
    event: params.event,
    requestId: params.requestId,
  });
  await sendTrackerEmail({
    recipientIds: params.ownerId === params.actorId ? [] : [params.ownerId],
    subject: `${params.event === "none_suitable" ? "No suitable candidate" : "Nominations"} for ${params.ref}`,
    heading: params.title,
    body: params.body,
    path: `/tracker/requests/${params.requestId}?tab=nominations`,
    cta:
      params.event === "none_suitable"
        ? "Open the request"
        : "Compare candidates",
  });
}

export async function nominate(
  requestId: string,
  podId: string,
  picks: { memberId: string; justification: string }[],
): Promise<Result> {
  const auth = await authorizeTracker();
  if ("error" in auth) return auth;
  const { session } = auth;
  if (!leadsPod(session, podId))
    return { error: "Only this pod's leaders can nominate from it." };
  if (!Array.isArray(picks) || picks.length === 0)
    return { error: "Choose at least one engineer." };
  if (picks.length > 20)
    return { error: "Nominate up to 20 engineers at a time." };
  const cleaned = picks.map((p) => ({
    memberId: String(p.memberId),
    justification: String(p.justification ?? "")
      .trim()
      .slice(0, 500),
  }));
  if (cleaned.some((p) => !p.justification))
    return { error: "Add a short justification for each engineer." };

  const admin = getSupabaseAdmin();
  const found = await routedRequest(admin, requestId, podId);
  if ("error" in found) return { error: found.error as string };
  const { req, podName } = found;

  // Nominees: active, activated members of this pod who haven't stepped back.
  const ids = Array.from(new Set(cleaned.map((p) => p.memberId))).filter((x) =>
    UUID.test(x),
  );
  if (ids.length !== cleaned.length)
    return { error: "Each engineer can be nominated once." };
  const [
    { data: inPod },
    { data: members },
    { data: optedOut },
    { data: already },
  ] = await Promise.all([
    admin
      .from("pod_memberships")
      .select("member_id")
      .eq("pod_id", podId)
      .in("member_id", ids),
    admin
      .from("members")
      .select("id")
      .in("id", ids)
      .eq("status", "active")
      .not("claimed_at", "is", null),
    admin
      .from("presales_profiles")
      .select("member_id")
      .in("member_id", ids)
      .eq("opted_in", false),
    admin
      .from("presales_nominations")
      .select("member_id")
      .eq("request_id", requestId)
      .in("member_id", ids)
      .neq("status", "withdrawn"),
  ]);
  const ok = (id: string) =>
    (inPod ?? []).some((r) => r.member_id === id) &&
    (members ?? []).some((r) => r.id === id) &&
    !(optedOut ?? []).some((r) => r.member_id === id);
  if (ids.some((id) => !ok(id)))
    return {
      error: "Nominate active members of your pod who take part in presales.",
    };
  if ((already ?? []).length)
    return {
      error: "One of these engineers is already nominated for this request.",
    };

  const me = session.member.id;
  const { error } = await admin.from("presales_nominations").insert(
    cleaned.map((p) => ({
      request_id: requestId,
      pod_id: podId,
      member_id: p.memberId,
      nominated_by: me,
      justification: p.justification,
    })),
  );
  if (error) return { error: "Couldn't save the nominations. Try again." };

  await admin
    .from("presales_request_pods")
    .update({
      status: "nominated",
      responded_at: new Date().toISOString(),
      responded_by: me,
    })
    .eq("request_id", requestId)
    .eq("pod_id", podId);
  if (req.status === "open") {
    await admin
      .from("presales_requests")
      .update({ status: "nominations_received" })
      .eq("id", requestId);
  }

  const { data: names } = await admin
    .from("profiles")
    .select("member_id, full_name")
    .in("member_id", ids);
  const label = (names ?? []).map((n) => n.full_name).join(", ");
  await logActivity(requestId, me, `${podName} nominated ${label}`);
  await auditTracker({
    actorId: me,
    action: "nominated",
    targetType: "request",
    targetId: requestId,
    metadata: { pod_id: podId, members: ids },
  });
  await tellOwner({
    ownerId: req.owner_id as string,
    actorId: me,
    requestId,
    ref: req.ref as string,
    title: req.title as string,
    event: "nominations_submitted",
    body: `${podName} nominated ${ids.length} engineer${ids.length > 1 ? "s" : ""} for ${req.ref}: ${label}.`,
  });
  revalidatePath("/tracker", "layout");
  return { ok: true };
}

export async function markNoneSuitable(
  requestId: string,
  podId: string,
  reason: string,
): Promise<Result> {
  const auth = await authorizeTracker();
  if ("error" in auth) return auth;
  const { session } = auth;
  if (!leadsPod(session, podId))
    return { error: "Only this pod's leaders can respond for it." };
  const why = String(reason ?? "")
    .trim()
    .slice(0, 500);
  if (!why) return { error: "Give a reason." };

  const admin = getSupabaseAdmin();
  const found = await routedRequest(admin, requestId, podId);
  if ("error" in found) return { error: found.error as string };
  const { req, route, podName } = found;
  if (route.status === "nominated")
    return {
      error: "Your pod has already nominated engineers. Withdraw them first.",
    };

  const me = session.member.id;
  const { error } = await admin
    .from("presales_request_pods")
    .update({
      status: "none_suitable",
      note: why,
      responded_at: new Date().toISOString(),
      responded_by: me,
    })
    .eq("request_id", requestId)
    .eq("pod_id", podId);
  if (error) return { error: "Couldn't save your response. Try again." };

  await logActivity(
    requestId,
    me,
    `${podName}: no suitable candidate (${why})`,
  );
  await tellOwner({
    ownerId: req.owner_id as string,
    actorId: me,
    requestId,
    ref: req.ref as string,
    title: req.title as string,
    event: "none_suitable",
    body: `${podName} has no suitable candidate for ${req.ref}.\nReason: ${why}`,
  });
  revalidatePath("/tracker", "layout");
  return { ok: true };
}

export async function withdrawNomination(
  nominationId: string,
): Promise<Result> {
  const auth = await authorizeTracker();
  if ("error" in auth) return auth;
  const { session } = auth;
  if (!UUID.test(nominationId)) return { error: "Nomination not found." };
  const admin = getSupabaseAdmin();
  const { data: nom } = await admin
    .from("presales_nominations")
    .select("id, request_id, pod_id, member_id, status")
    .eq("id", nominationId)
    .maybeSingle();
  if (!nom) return { error: "Nomination not found." };
  if (!leadsPod(session, nom.pod_id as string))
    return { error: "Only this pod's leaders can withdraw its nominations." };
  if (nom.status !== "submitted")
    return {
      error: "Only nominations that haven't been selected can be withdrawn.",
    };

  const { error } = await admin
    .from("presales_nominations")
    .update({ status: "withdrawn" })
    .eq("id", nominationId);
  if (error) return { error: "Couldn't withdraw the nomination. Try again." };

  // Step statuses back when nothing is left.
  const { data: live } = await admin
    .from("presales_nominations")
    .select("pod_id")
    .eq("request_id", nom.request_id)
    .neq("status", "withdrawn");
  if (!(live ?? []).some((n) => n.pod_id === nom.pod_id)) {
    await admin
      .from("presales_request_pods")
      .update({ status: "awaiting", responded_at: null, responded_by: null })
      .eq("request_id", nom.request_id)
      .eq("pod_id", nom.pod_id);
  }
  if (!(live ?? []).length) {
    await admin
      .from("presales_requests")
      .update({ status: "open" })
      .eq("id", nom.request_id)
      .eq("status", "nominations_received");
  }

  const { data: who } = await admin
    .from("profiles")
    .select("full_name")
    .eq("member_id", nom.member_id)
    .maybeSingle();
  await logActivity(
    nom.request_id as string,
    session.member.id,
    `Withdrew the nomination of ${who?.full_name ?? "an engineer"}`,
  );
  revalidatePath("/tracker", "layout");
  return { ok: true };
}
