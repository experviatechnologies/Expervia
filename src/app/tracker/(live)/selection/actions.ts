"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeTracker } from "@/lib/tracker/server/session";
import {
  auditTracker,
  logActivity,
  notifyPresales,
} from "@/lib/tracker/server/events";
import { sendTrackerEmail } from "@/lib/tracker/server/email";
import { fmtRange } from "@/lib/tracker/time";

/**
 * Selection and invitations, live (Phase 5, step 5.3; PRD FR-018, FR-019,
 * FR-032, section 8).
 *
 * The Sales Manager selects engineers (normally from the nominations; a
 * direct selection needs the policy to allow it and a written reason, and
 * tells the engineer's Pod Leaders). Each selected engineer is invited with a
 * response deadline and accepts or declines; a decline needs a reason and
 * sends the request back to selection for a replacement.
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;
type Result = { ok: true } | { error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECTABLE = [
  "open",
  "nominations_received",
  "selection",
  "awaiting_acceptance",
  "conflict",
];
const LIVE_SEAT = ["invitation_pending", "accepted", "confirmed"];

const names = async (admin: Admin, ids: string[]) => {
  const { data } = await admin
    .from("profiles")
    .select("member_id, full_name")
    .in("member_id", ids);
  return new Map(
    (data ?? []).map((p) => [
      p.member_id as string,
      (p.full_name as string) ?? "an engineer",
    ]),
  );
};

/** Lead and backup of every specialist pod the member belongs to. */
async function leadersOf(admin: Admin, memberId: string) {
  const { data: mine } = await admin
    .from("pod_memberships")
    .select("pod_id")
    .eq("member_id", memberId);
  const podIds = (mine ?? []).map((m) => m.pod_id as string);
  if (!podIds.length) return [];
  const { data } = await admin
    .from("pod_memberships")
    .select("member_id")
    .in("pod_id", podIds)
    .in("role_in_pod", ["lead", "co_lead"]);
  return (data ?? []).map((d) => d.member_id as string);
}

/** Request stage from its team: full team awaits acceptance, else selection. */
async function restage(
  admin: Admin,
  requestId: string,
  needed: number,
  status: string,
) {
  const { count } = await admin
    .from("presales_assignments")
    .select("id", { count: "exact", head: true })
    .eq("request_id", requestId)
    .in("status", LIVE_SEAT);
  const next = (count ?? 0) >= needed ? "awaiting_acceptance" : "selection";
  if (next !== status)
    await admin
      .from("presales_requests")
      .update({ status: next })
      .eq("id", requestId);
}

// ------------------------------------------------------------------ selection

export async function selectParticipants(
  requestId: string,
  memberIds: string[],
  rationale: string,
  overrideReason?: string,
): Promise<Result> {
  const auth = await authorizeTracker("sales_manager", "admin");
  if ("error" in auth) return auth;
  const me = auth.session.member.id;
  const admin = getSupabaseAdmin();

  const ids = Array.from(new Set(memberIds ?? [])).filter((x) => UUID.test(x));
  if (!UUID.test(requestId) || ids.length === 0)
    return { error: "Choose at least one engineer." };

  const [{ data: req }, { data: settings }] = await Promise.all([
    admin
      .from("presales_requests")
      .select(
        "id, ref, title, status, needed, response_hours, starts_at, ends_at, timezone, format, location, platform, owner_id",
      )
      .eq("id", requestId)
      .maybeSingle(),
    admin
      .from("presales_settings")
      .select("allow_direct_selection")
      .eq("id", true)
      .maybeSingle(),
  ]);
  if (!req) return { error: "Request not found." };
  if (!SELECTABLE.includes(req.status))
    return { error: "Engineers can't be selected at this stage." };

  const [
    { data: seats },
    { data: noms },
    { data: people },
    { data: optedOut },
  ] = await Promise.all([
    admin
      .from("presales_assignments")
      .select("member_id, status")
      .eq("request_id", requestId),
    admin
      .from("presales_nominations")
      .select("id, member_id, status")
      .eq("request_id", requestId)
      .eq("status", "submitted"),
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
  ]);
  const live = (seats ?? []).filter((s) =>
    LIVE_SEAT.includes(s.status as string),
  );
  if (live.length + ids.length > (req.needed as number)) {
    return {
      error: `This meeting needs ${req.needed}; ${live.length} already selected.`,
    };
  }
  if (ids.some((id) => live.some((s) => s.member_id === id)))
    return { error: "One of these engineers is already on the team." };
  if (
    ids.some(
      (id) =>
        !(people ?? []).some((p) => p.id === id) ||
        (optedOut ?? []).some((o) => o.member_id === id),
    )
  ) {
    return { error: "Select active engineers who take part in presales." };
  }

  const nominationFor = new Map(
    (noms ?? []).map((n) => [n.member_id as string, n.id as string]),
  );
  const direct = ids.filter((id) => !nominationFor.has(id));
  const why = (overrideReason ?? "").trim().slice(0, 500);
  if (direct.length) {
    if (!settings?.allow_direct_selection)
      return {
        error:
          "Selecting engineers who weren't nominated is switched off in the policies.",
      };
    if (!why)
      return {
        error: "Give a reason for selecting someone who wasn't nominated.",
      };
  }

  const dueAt = new Date(
    Date.now() + (req.response_hours as number) * 3_600_000,
  ).toISOString();
  const { error } = await admin.from("presales_assignments").insert(
    ids.map((member_id) => ({
      request_id: requestId,
      member_id,
      nomination_id: nominationFor.get(member_id) ?? null,
      is_direct_selection: !nominationFor.has(member_id),
      status: "invitation_pending",
      due_at: dueAt,
    })),
  );
  if (error) return { error: "Couldn't send the invitations. Try again." };

  const nominatedIds = ids
    .map((id) => nominationFor.get(id))
    .filter(Boolean) as string[];
  if (nominatedIds.length)
    await admin
      .from("presales_nominations")
      .update({ status: "selected" })
      .in("id", nominatedIds);
  // A full team closes the remaining nominations.
  if (live.length + ids.length >= (req.needed as number)) {
    await admin
      .from("presales_nominations")
      .update({ status: "not_selected" })
      .eq("request_id", requestId)
      .eq("status", "submitted");
  }
  const extra: Record<string, unknown> = {};
  if (rationale?.trim()) extra.rationale = rationale.trim().slice(0, 1000);
  if (direct.length)
    Object.assign(extra, {
      override_reason: why,
      override_by: me,
      override_at: new Date().toISOString(),
    });
  if (Object.keys(extra).length)
    await admin.from("presales_requests").update(extra).eq("id", requestId);
  await restage(admin, requestId, req.needed as number, req.status as string);

  const who = await names(admin, ids);
  for (const id of ids)
    await logActivity(
      requestId,
      me,
      `Selected ${who.get(id)} and sent an invitation`,
    );
  await auditTracker({
    actorId: me,
    action: "participants_selected",
    targetType: "request",
    targetId: requestId,
    metadata: { members: ids, direct },
  });
  if (direct.length) {
    await auditTracker({
      actorId: me,
      action: "direct_selection",
      targetType: "request",
      targetId: requestId,
      reason: why,
      metadata: { members: direct },
    });
    for (const id of direct) {
      await notifyPresales({
        recipients: await leadersOf(admin, id),
        actorId: me,
        event: "direct_selection",
        requestId,
      });
    }
  }

  await notifyPresales({
    recipients: ids,
    actorId: me,
    event: "invited",
    requestId,
  });
  const where =
    req.format === "online"
      ? (req.platform as string) || "Online"
      : (req.location as string) || "In person";
  await sendTrackerEmail({
    recipientIds: ids,
    subject: `Invitation: ${req.title} (${req.ref})`,
    heading: `You've been selected for ${req.title}`,
    body: `When: ${fmtRange(req.starts_at as string, req.ends_at as string, req.timezone as string)}\nWhere: ${where}\nPlease accept or decline by ${new Date(dueAt).toLocaleString("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })} WAT.`,
    path: `/tracker/meetings`,
    cta: "Accept or decline",
  });
  revalidatePath("/tracker", "layout");
  return { ok: true };
}

// ------------------------------------------------------------------ responses

export async function respondToInvitation(
  assignmentId: string,
  accept: boolean,
  reason?: string,
): Promise<Result> {
  const auth = await authorizeTracker();
  if ("error" in auth) return auth;
  const me = auth.session.member.id;
  if (!UUID.test(assignmentId)) return { error: "Invitation not found." };
  const admin = getSupabaseAdmin();

  const { data: seat } = await admin
    .from("presales_assignments")
    .select("id, request_id, member_id, status, nomination_id")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!seat || seat.member_id !== me) return { error: "Invitation not found." };
  if (seat.status !== "invitation_pending")
    return { error: "You have already responded to this invitation." };
  const why = (reason ?? "").trim().slice(0, 500);
  if (!accept && !why) return { error: "Give a reason for declining." };

  const { data: req } = await admin
    .from("presales_requests")
    .select("id, ref, title, status, needed, owner_id")
    .eq("id", seat.request_id)
    .maybeSingle();
  if (!req || ["cancelled", "completed"].includes(req.status))
    return { error: "This meeting is no longer active." };

  const { error } = await admin
    .from("presales_assignments")
    .update({
      status: accept ? "accepted" : "declined",
      responded_at: new Date().toISOString(),
      decline_reason: accept ? null : why,
    })
    .eq("id", assignmentId)
    .eq("status", "invitation_pending");
  if (error) return { error: "Couldn't save your response. Try again." };

  const { data: prof } = await admin
    .from("profiles")
    .select("full_name")
    .eq("member_id", me)
    .maybeSingle();
  const name = (prof?.full_name as string) ?? "An engineer";
  if (accept) {
    await logActivity(req.id as string, me, `${name} accepted the invitation`);
    await notifyPresales({
      recipients: [req.owner_id as string],
      actorId: me,
      event: "invite_accepted",
      requestId: req.id as string,
    });
  } else {
    await logActivity(
      req.id as string,
      me,
      `${name} declined the invitation: ${why}`,
    );
    // A seat is free again: the decliner's nomination is replaced and the
    // nominations closed when the team filled up reopen, so a nominee can
    // be picked as the replacement without an override.
    if (seat.nomination_id) {
      await admin
        .from("presales_nominations")
        .update({ status: "replaced" })
        .eq("id", seat.nomination_id);
    }
    await admin
      .from("presales_nominations")
      .update({ status: "submitted" })
      .eq("request_id", seat.request_id)
      .eq("status", "not_selected");
    await restage(
      admin,
      req.id as string,
      req.needed as number,
      req.status as string,
    );
    const recipients = [
      req.owner_id as string,
      ...(await leadersOf(admin, me)),
    ];
    await notifyPresales({
      recipients,
      actorId: me,
      event: "invite_declined",
      requestId: req.id as string,
    });
    await sendTrackerEmail({
      recipientIds: recipients.filter((r) => r !== me),
      subject: `Declined: ${req.title} (${req.ref})`,
      heading: `${name} declined ${req.title}`,
      body: `Reason: ${why}\nA replacement is needed for ${req.ref}.`,
      path: `/tracker/requests/${req.id}?tab=nominations`,
      cta: "Find a replacement",
    });
  }
  revalidatePath("/tracker", "layout");
  return { ok: true };
}
