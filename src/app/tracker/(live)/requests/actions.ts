"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeTracker } from "@/lib/tracker/server/session";
import { loadReference } from "@/lib/tracker/server/data";
import {
  auditTracker,
  logActivity,
  notifyPresales,
} from "@/lib/tracker/server/events";
import { sendTrackerEmail } from "@/lib/tracker/server/email";
import { addWorkingHours } from "@/lib/tracker/policy";
import { TIMEZONES, fmtRange } from "@/lib/tracker/time";
import type { RequestInput } from "@/lib/tracker/store";

/**
 * Presales requests, live (Phase 5, step 5.1; PRD FR-014, FR-015, section 8).
 *
 * Sales Managers (and admins) create and manage requests. Submitting routes a
 * request to its pods with a nomination deadline counted in working hours and
 * tells each pod's Lead and backup leader, in the app and by email. Status
 * changes are also checked by the database trigger from migration 47.
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;
type Result<T = object> = ({ ok: true } & T) | { error: string };

const FORMATS = ["online", "physical", "hybrid"];
const ACCESS = ["standard", "confidential", "restricted"];
const SENIORITY = ["associate", "mid", "senior", "principal"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clip = (v: unknown, n: number) =>
  typeof v === "string" ? v.trim().slice(0, n) : "";

async function salesOnly() {
  const auth = await authorizeTracker("sales_manager", "admin");
  if ("error" in auth) return auth;
  return { session: auth.session, admin: getSupabaseAdmin() };
}

/** The Lead and backup leader of each pod (they receive nomination requests). */
async function podLeaders(admin: Admin, podIds: string[]) {
  if (!podIds.length) return [];
  const { data } = await admin
    .from("pod_memberships")
    .select("member_id, pod_id")
    .in("pod_id", podIds)
    .in("role_in_pod", ["lead", "co_lead"]);
  return (data ?? []) as { member_id: string; pod_id: string }[];
}

async function tellLeaders(
  admin: Admin,
  actorId: string,
  req: {
    id: string;
    ref: string;
    title: string;
    needed: number;
    startUtc: string;
    endUtc: string;
    timezone: string;
    urgency: string;
  },
  podIds: string[],
  deadline: string,
) {
  const leaders = await podLeaders(admin, podIds);
  const recipients = leaders.map((l) => l.member_id);
  await notifyPresales({
    recipients,
    actorId,
    event: "request_routed",
    requestId: req.id,
  });
  await sendTrackerEmail({
    recipientIds: recipients.filter((r) => r !== actorId),
    subject: `${req.urgency === "urgent" ? "Urgent: " : ""}Nominations needed for ${req.ref}`,
    heading: `Nominations needed: ${req.title}`,
    body: `${req.ref} needs ${req.needed} engineer${req.needed > 1 ? "s" : ""} from your pod.\nMeeting: ${fmtRange(req.startUtc, req.endUtc, req.timezone)}\nNominate by: ${new Date(deadline).toLocaleString("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })} WAT`,
    path: `/tracker/requests/${req.id}?tab=nominations`,
    cta: "Nominate engineers",
  });
}

// ------------------------------------------------------------------ create / edit

export async function saveRequest(
  input: RequestInput,
  submit: boolean,
  existingId?: string,
): Promise<Result<{ id: string }>> {
  const ctx = await salesOnly();
  if ("error" in ctx) return ctx;
  const { admin, session } = ctx;
  const me = session.member.id;
  const ref = await loadReference(admin);

  // Validate everything the form checks, again on the server.
  const title = clip(input.title, 200);
  const client = clip(input.client, 200);
  if (!title || !client)
    return { error: "Enter a meeting title and the client." };
  const start = new Date(input.startUtc);
  const end = new Date(input.endUtc);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    return { error: "Meeting start and end must be valid times." };
  if (end <= start) return { error: "Meeting end must be after the start." };
  if (end.getTime() - start.getTime() > 12 * 3_600_000)
    return { error: "Meetings longer than 12 hours are not supported." };
  if (
    !FORMATS.includes(input.format) ||
    !ACCESS.includes(input.access) ||
    !SENIORITY.includes(input.seniority)
  ) {
    return { error: "Check the format, access and seniority." };
  }
  if (!TIMEZONES.includes(input.timezone))
    return { error: "Choose a supported time zone." };
  const needed = Number(input.needed);
  if (!Number.isInteger(needed) || needed < 1 || needed > 20)
    return { error: "Participants needed must be between 1 and 20." };
  const responseHours =
    Number(input.responseHours) || ref.policies.responseHours;
  if (responseHours < 1 || responseHours > 336)
    return { error: "Invitation response time must be 1 to 336 hours." };
  const skillIds = Array.from(new Set(input.skillIds ?? [])).filter((s) =>
    ref.skills.some((k) => k.id === s),
  );
  const podIds = Array.from(new Set(input.podIds ?? [])).filter((p) =>
    ref.pods.some((x) => x.id === p),
  );
  const meetingTypeId = ref.meetingTypes.some(
    (t) => t.id === input.meetingTypeId,
  )
    ? input.meetingTypeId
    : null;
  if (submit) {
    if (!clip(input.objective, 4000))
      return { error: "Describe what the engineers should help achieve." };
    if (!meetingTypeId) return { error: "Choose a meeting type." };
    if (!skillIds.length) return { error: "Choose at least one skill." };
    if (!podIds.length)
      return { error: "Route the request to at least one pod." };
    if (input.format !== "online" && !clip(input.location, 300))
      return { error: "Enter the meeting location." };
    if (start.getTime() < Date.now())
      return { error: "The meeting must be in the future." };
  }

  // Nomination deadline: the custom one if valid, else the service level.
  const custom = new Date(input.deadline);
  const deadline =
    !Number.isNaN(custom.getTime()) &&
    custom.getTime() > Date.now() &&
    custom < start
      ? custom.toISOString()
      : addWorkingHours(
          Date.now(),
          input.urgency === "urgent"
            ? ref.policies.urgentHours
            : ref.policies.standardHours,
          ref.policies,
        ).toISOString();

  const row = {
    title,
    client,
    opportunity_ref: clip(input.opportunityRef, 100) || null,
    objective: clip(input.objective, 4000),
    meeting_type_id: meetingTypeId,
    access: input.access,
    seniority: input.seniority,
    needed,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    timezone: input.timezone,
    format: input.format,
    platform:
      input.format === "physical" ? null : clip(input.platform, 100) || null,
    join_link:
      input.format === "physical" ? null : clip(input.joinLink, 500) || null,
    location:
      input.format === "online" ? null : clip(input.location, 300) || null,
    tech_prep: clip(input.techPrep, 2000) || null,
    prep_notes: clip(input.prepNotes, 2000) || null,
    urgency: input.urgency === "urgent" ? "urgent" : "standard",
    response_hours: responseHours,
  };

  let id = existingId && UUID.test(existingId) ? existingId : "";
  let wasDraft = true;
  let refCode = "";
  if (id) {
    const { data: cur } = await admin
      .from("presales_requests")
      .select("id, status, ref")
      .eq("id", id)
      .maybeSingle();
    if (!cur) return { error: "Request not found." };
    if (["completed", "cancelled"].includes(cur.status))
      return { error: "Completed or cancelled requests can't be edited." };
    wasDraft = cur.status === "draft";
    // Check routing removals before writing anything, so a rejected edit
    // leaves the request untouched.
    const { data: nominatedPods } = await admin
      .from("presales_nominations")
      .select("pod_id")
      .eq("request_id", id)
      .neq("status", "withdrawn");
    if (
      (nominatedPods ?? []).some((n) => !podIds.includes(n.pod_id as string))
    ) {
      return {
        error:
          "A pod that has already nominated engineers can't be removed from the request.",
      };
    }
    refCode = cur.ref;
    const { error } = await admin
      .from("presales_requests")
      .update(row)
      .eq("id", id);
    if (error) return { error: "Couldn't save the request. Try again." };
    await logActivity(id, me, "Edited the request details");
  } else {
    const { data: created, error } = await admin
      .from("presales_requests")
      .insert({ ...row, ref: "", owner_id: me, status: "draft" })
      .select("id, ref")
      .single();
    if (error || !created)
      return { error: "Couldn't create the request. Try again." };
    id = created.id;
    refCode = created.ref;
    await logActivity(id, me, "Created the request");
  }

  // Required skills: replace the set.
  await admin.from("presales_request_skills").delete().eq("request_id", id);
  if (skillIds.length) {
    const { error } = await admin
      .from("presales_request_skills")
      .insert(skillIds.map((skill_id) => ({ request_id: id, skill_id })));
    if (error)
      return { error: "Couldn't save the required skills. Try again." };
  }

  // Routing: keep pods that already responded; a pod with nominations can't be removed.
  const { data: routed } = await admin
    .from("presales_request_pods")
    .select("pod_id")
    .eq("request_id", id);
  const before = new Set((routed ?? []).map((r) => r.pod_id as string));
  const removed = [...before].filter((p) => !podIds.includes(p));
  if (removed.length) {
    await admin
      .from("presales_request_pods")
      .delete()
      .eq("request_id", id)
      .in("pod_id", removed);
  }
  const added = podIds.filter((p) => !before.has(p));
  if (added.length) {
    const { error } = await admin
      .from("presales_request_pods")
      .insert(added.map((pod_id) => ({ request_id: id, pod_id, deadline })));
    if (error) return { error: "Couldn't route the request. Try again." };
  }
  // Deadlines of pods still waiting follow the latest deadline.
  await admin
    .from("presales_request_pods")
    .update({ deadline })
    .eq("request_id", id)
    .eq("status", "awaiting");

  const reqForMail = {
    id,
    ref: refCode,
    title,
    needed,
    startUtc: row.starts_at,
    endUtc: row.ends_at,
    timezone: row.timezone,
    urgency: row.urgency,
  };
  if (submit && wasDraft) {
    const { error } = await admin
      .from("presales_requests")
      .update({ status: "open" })
      .eq("id", id);
    if (error) return { error: "Couldn't submit the request. Try again." };
    const names = ref.pods
      .filter((p) => podIds.includes(p.id))
      .map((p) => p.name);
    await logActivity(
      id,
      me,
      `Submitted for nominations and routed to ${names.join(", ")}`,
    );
    await auditTracker({
      actorId: me,
      action: "request_submitted",
      targetType: "request",
      targetId: id,
      metadata: { ref: refCode, pods: podIds },
    });
    await tellLeaders(admin, me, reqForMail, podIds, deadline);
  } else if (!wasDraft && added.length) {
    // Pods added to a live request hear about it straight away.
    await tellLeaders(admin, me, reqForMail, added, deadline);
  }

  revalidatePath("/tracker", "layout");
  return { ok: true, id };
}

// ------------------------------------------------------------------ cancel / reschedule

export async function cancelRequest(
  requestId: string,
  reason: string,
): Promise<Result> {
  const ctx = await salesOnly();
  if ("error" in ctx) return ctx;
  const { admin, session } = ctx;
  const why = clip(reason, 500);
  if (!why) return { error: "Give a reason for cancelling." };
  const { data: req } = await admin
    .from("presales_requests")
    .select("id, ref, title, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!req) return { error: "Request not found." };
  if (["completed", "cancelled"].includes(req.status))
    return { error: "This request is already closed." };

  const { error } = await admin
    .from("presales_requests")
    .update({ status: "cancelled", cancelled_reason: why })
    .eq("id", requestId);
  if (error) return { error: "Couldn't cancel the request. Try again." };

  const { data: seats } = await admin
    .from("presales_assignments")
    .update({ status: "cancelled" })
    .eq("request_id", requestId)
    .in("status", ["invitation_pending", "accepted", "confirmed"])
    .select("member_id");
  const people = (seats ?? []).map((s) => s.member_id as string);
  await logActivity(
    requestId,
    session.member.id,
    `Cancelled the request: ${why}`,
  );
  await auditTracker({
    actorId: session.member.id,
    action: "request_cancelled",
    targetType: "request",
    targetId: requestId,
    reason: why,
  });
  await notifyPresales({
    recipients: people,
    actorId: session.member.id,
    event: "cancelled",
    requestId,
  });
  await sendTrackerEmail({
    recipientIds: people,
    subject: `Cancelled: ${req.title} (${req.ref})`,
    heading: `Cancelled: ${req.title}`,
    body: `${req.ref} has been cancelled.\nReason: ${why}`,
    path: "/tracker/dashboard",
  });
  revalidatePath("/tracker", "layout");
  return { ok: true };
}

export async function rescheduleRequest(
  requestId: string,
  startUtc: string,
  endUtc: string,
): Promise<Result> {
  const ctx = await salesOnly();
  if ("error" in ctx) return ctx;
  const { admin, session } = ctx;
  const start = new Date(startUtc);
  const end = new Date(endUtc);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  )
    return { error: "Meeting end must be after the start." };
  if (end.getTime() - start.getTime() > 12 * 3_600_000)
    return { error: "Meetings longer than 12 hours are not supported." };
  if (start.getTime() < Date.now())
    return { error: "The new time must be in the future." };

  const { data: req } = await admin
    .from("presales_requests")
    .select("id, ref, title, status, response_hours, timezone")
    .eq("id", requestId)
    .maybeSingle();
  if (!req) return { error: "Request not found." };
  if (["completed", "cancelled", "draft"].includes(req.status))
    return { error: "Only active requests can be rescheduled." };

  const { error } = await admin
    .from("presales_requests")
    .update({
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      ...(req.status === "confirmed" ? { status: "awaiting_acceptance" } : {}),
    })
    .eq("id", requestId);
  if (error) return { error: "Couldn't reschedule the request. Try again." };

  // Everyone who had agreed is asked to confirm the new time.
  const dueAt = new Date(
    Date.now() + (req.response_hours as number) * 3_600_000,
  ).toISOString();
  const { data: seats } = await admin
    .from("presales_assignments")
    .update({ status: "invitation_pending", due_at: dueAt, responded_at: null })
    .eq("request_id", requestId)
    .in("status", ["accepted", "confirmed"])
    .select("member_id");
  const people = (seats ?? []).map((s) => s.member_id as string);
  await logActivity(
    requestId,
    session.member.id,
    `Rescheduled the meeting to ${fmtRange(start.toISOString(), end.toISOString(), req.timezone as string)}`,
  );
  await notifyPresales({
    recipients: people,
    actorId: session.member.id,
    event: "rescheduled",
    requestId,
  });
  await sendTrackerEmail({
    recipientIds: people,
    subject: `New time: ${req.title} (${req.ref})`,
    heading: `Rescheduled: ${req.title}`,
    body: `${req.ref} has moved to ${fmtRange(start.toISOString(), end.toISOString(), req.timezone as string)}.\nPlease confirm you can still attend.`,
    path: `/tracker/requests/${requestId}`,
    cta: "Respond",
  });
  revalidatePath("/tracker", "layout");
  return { ok: true };
}
