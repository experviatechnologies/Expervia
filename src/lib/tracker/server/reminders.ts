import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notifySystem } from "./events";
import { sendTrackerEmail } from "./email";
import {
  addDaysToDate,
  fmtRange,
  zonedDate,
  zonedParts,
} from "@/lib/tracker/time";

/**
 * Scheduled reminders and escalations (Phase 7, step 7.1; PRD section 10).
 * Run every 15 minutes by /api/tracker/cron. Every reminder has a unique key
 * that is claimed in presales_reminders before anything is sent, so each one
 * goes out exactly once however often the job runs.
 *
 *   deadline_near       Pod leaders: nomination deadline within 2 hours
 *   deadline_missed     Sales owner + pod leaders: deadline passed, no answer
 *   invite_expiring     Engineer: invitation due within 6 hours
 *   invite_overdue      Sales owner: invitation passed its deadline
 *   meeting_reminder    Participants: 24 hours and 1 hour before
 *   outcome_needed      Owner: meeting ended, no outcome yet
 *   availability_review Engineers: weekly, on the policy's reminder day,
 *                       when their availability isn't fresh (batched)
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;
const HOUR = 3_600_000;
const ACTIVE = [
  "open",
  "nominations_received",
  "selection",
  "awaiting_acceptance",
  "conflict",
];
/** Weekly review emails per run (Resend rate limits); the rest go next run. */
const REVIEW_BATCH = 40;

export type ReminderReport = Record<string, number>;

/** Claim a reminder key; true only for the first caller. */
async function claim(
  admin: Admin,
  key: string,
  kind: string,
  requestId?: string | null,
  memberId?: string | null,
) {
  const { data, error } = await admin
    .from("presales_reminders")
    .upsert(
      { key, kind, request_id: requestId ?? null, member_id: memberId ?? null },
      { onConflict: "key", ignoreDuplicates: true },
    )
    .select("key");
  if (error) throw new Error(`claim ${key}: ${error.message}`);
  return (data ?? []).length > 0;
}

async function leadersOfPod(admin: Admin, podId: string) {
  const { data } = await admin
    .from("pod_memberships")
    .select("member_id")
    .eq("pod_id", podId)
    .in("role_in_pod", ["lead", "co_lead"]);
  return (data ?? []).map((d) => d.member_id as string);
}

const wat = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  }) + " WAT";

export async function runReminders(
  admin: Admin,
  nowMs = Date.now(),
): Promise<ReminderReport> {
  const now = new Date(nowMs).toISOString();
  const report: ReminderReport = {};
  const bump = (k: string) => (report[k] = (report[k] ?? 0) + 1);

  // ---------------------------------------------------------- nomination deadlines
  const { data: routes, error: routeError } = await admin
    .from("presales_request_pods")
    .select(
      "request_id, pod_id, deadline, pods(name), presales_requests!inner(id, ref, title, status, owner_id)",
    )
    .eq("status", "awaiting")
    .lte("deadline", new Date(nowMs + 2 * HOUR).toISOString());
  if (routeError) throw new Error(routeError.message);
  for (const r of (routes ?? []) as unknown as {
    request_id: string;
    pod_id: string;
    deadline: string;
    pods: { name: string } | null;
    presales_requests: {
      id: string;
      ref: string;
      title: string;
      status: string;
      owner_id: string;
    };
  }[]) {
    const req = r.presales_requests;
    if (!ACTIVE.includes(req.status)) continue;
    const leaders = await leadersOfPod(admin, r.pod_id);
    const pod = r.pods?.name ?? "A pod";
    if (r.deadline > now) {
      if (
        !(await claim(
          admin,
          `deadline_near:${r.request_id}:${r.pod_id}`,
          "deadline_near",
          r.request_id,
        ))
      )
        continue;
      await notifySystem({
        recipients: leaders,
        event: "deadline_near",
        requestId: r.request_id,
      });
      await sendTrackerEmail({
        recipientIds: leaders,
        subject: `Nominations due soon: ${req.ref}`,
        heading: `Nominations due by ${wat(r.deadline)}`,
        body: `${req.title} (${req.ref}) still needs a response from ${pod}.\nNominate engineers or record that no one is suitable.`,
        path: `/tracker/requests/${req.id}?tab=nominations`,
        cta: "Respond now",
      });
      bump("deadline_near");
    } else {
      if (
        !(await claim(
          admin,
          `deadline_missed:${r.request_id}:${r.pod_id}`,
          "deadline_missed",
          r.request_id,
        ))
      )
        continue;
      const recipients = [req.owner_id, ...leaders];
      await notifySystem({
        recipients,
        event: "deadline_missed",
        requestId: r.request_id,
      });
      await sendTrackerEmail({
        recipientIds: recipients,
        subject: `Missed nomination deadline: ${req.ref}`,
        heading: `${pod} hasn't responded to ${req.ref}`,
        body: `The nomination deadline for ${req.title} passed at ${wat(r.deadline)}.\nPod leaders: please respond. Sales: consider another pod or a direct selection.`,
        path: `/tracker/requests/${req.id}?tab=nominations`,
        cta: "Open the request",
      });
      bump("deadline_missed");
    }
  }

  // ---------------------------------------------------------- invitations
  const { data: invites, error: inviteError } = await admin
    .from("presales_assignments")
    .select(
      "id, member_id, due_at, presales_requests!inner(id, ref, title, status, owner_id, starts_at, ends_at, timezone)",
    )
    .eq("status", "invitation_pending")
    .lte("due_at", new Date(nowMs + 6 * HOUR).toISOString());
  if (inviteError) throw new Error(inviteError.message);
  for (const a of (invites ?? []) as unknown as {
    id: string;
    member_id: string;
    due_at: string;
    presales_requests: {
      id: string;
      ref: string;
      title: string;
      status: string;
      owner_id: string;
      starts_at: string;
      ends_at: string;
      timezone: string;
    };
  }[]) {
    const req = a.presales_requests;
    if (!ACTIVE.includes(req.status)) continue;
    if (a.due_at > now) {
      if (
        !(await claim(
          admin,
          `invite_expiring:${a.id}`,
          "invite_expiring",
          req.id,
          a.member_id,
        ))
      )
        continue;
      await notifySystem({
        recipients: [a.member_id],
        event: "invite_expiring",
        requestId: req.id,
      });
      await sendTrackerEmail({
        recipientIds: [a.member_id],
        subject: `Please respond: ${req.title} (${req.ref})`,
        heading: `Your invitation is due by ${wat(a.due_at)}`,
        body: `${req.title}\n${fmtRange(req.starts_at, req.ends_at, req.timezone)}\nPlease accept or decline so the team can be confirmed.`,
        path: "/tracker/meetings",
        cta: "Accept or decline",
      });
      bump("invite_expiring");
    } else {
      if (
        !(await claim(
          admin,
          `invite_overdue:${a.id}`,
          "invite_overdue",
          req.id,
          a.member_id,
        ))
      )
        continue;
      await notifySystem({
        recipients: [req.owner_id],
        event: "invite_overdue",
        requestId: req.id,
      });
      bump("invite_overdue");
    }
  }

  // ---------------------------------------------------------- meetings
  const { data: seats, error: seatError } = await admin
    .from("presales_assignments")
    .select(
      "id, member_id, presales_requests!inner(id, ref, title, status, owner_id, starts_at, ends_at, timezone, format, location, platform, join_link)",
    )
    .eq("status", "confirmed")
    .gte(
      "presales_requests.ends_at",
      new Date(nowMs - 30 * 24 * HOUR).toISOString(),
    )
    .lte(
      "presales_requests.starts_at",
      new Date(nowMs + 24 * HOUR).toISOString(),
    );
  if (seatError) throw new Error(seatError.message);
  const ownersToNudge = new Map<
    string,
    { id: string; ref: string; title: string; owner_id: string }
  >();
  for (const s of (seats ?? []) as unknown as {
    id: string;
    member_id: string;
    presales_requests: {
      id: string;
      ref: string;
      title: string;
      status: string;
      owner_id: string;
      starts_at: string;
      ends_at: string;
      timezone: string;
      format: string;
      location: string | null;
      platform: string | null;
      join_link: string | null;
    };
  }[]) {
    const req = s.presales_requests;
    if (req.status !== "confirmed") continue;
    const start = new Date(req.starts_at).getTime();
    if (new Date(req.ends_at).getTime() < nowMs) {
      ownersToNudge.set(req.id, req);
      continue;
    }
    if (start <= nowMs) continue;
    // 24h reminder only when there is still time to prepare; 1h always.
    const slot =
      start - nowMs <= HOUR ? "1h" : start - nowMs > 2 * HOUR ? "24h" : null;
    if (!slot) continue;
    if (
      !(await claim(
        admin,
        `meeting_${slot}:${s.id}`,
        "meeting_reminder",
        req.id,
        s.member_id,
      ))
    )
      continue;
    await notifySystem({
      recipients: [s.member_id],
      event: "meeting_reminder",
      requestId: req.id,
    });
    const hours = Math.max(1, Math.round((start - nowMs) / HOUR));
    const when = hours === 1 ? "in about an hour" : `in ${hours} hours`;
    const where =
      req.format === "online"
        ? [req.platform, req.join_link].filter(Boolean).join(" ")
        : (req.location ?? "");
    await sendTrackerEmail({
      recipientIds: [s.member_id],
      subject: `Starts ${when}: ${req.title}`,
      heading: `${req.title} starts ${when}`,
      body: `${fmtRange(req.starts_at, req.ends_at, req.timezone)}\n${where}`,
      path: `/tracker/requests/${req.id}`,
      cta: "Open the meeting",
    });
    bump(`meeting_${slot}`);
  }
  for (const req of ownersToNudge.values()) {
    const { count } = await admin
      .from("presales_outcomes")
      .select("request_id", { count: "exact", head: true })
      .eq("request_id", req.id);
    if (count) continue;
    if (
      !(await claim(
        admin,
        `outcome_needed:${req.id}`,
        "outcome_needed",
        req.id,
        req.owner_id,
      ))
    )
      continue;
    await notifySystem({
      recipients: [req.owner_id],
      event: "outcome_needed",
      requestId: req.id,
    });
    await sendTrackerEmail({
      recipientIds: [req.owner_id],
      subject: `Record the outcome: ${req.title} (${req.ref})`,
      heading: `How did ${req.title} go?`,
      body: "Record attendance, a short summary, the outcome and any actions.",
      path: `/tracker/requests/${req.id}?tab=outcome`,
      cta: "Record the outcome",
    });
    bump("outcome_needed");
  }

  // ---------------------------------------------------------- weekly availability review
  const { data: settings } = await admin
    .from("presales_settings")
    .select("reminder_weekday, fresh_days, timezone")
    .eq("id", true)
    .maybeSingle();
  const tz = (settings?.timezone as string) ?? "Africa/Lagos";
  const local = zonedParts(nowMs, tz);
  if (
    settings &&
    local.weekday === settings.reminder_weekday &&
    local.hour >= 9
  ) {
    const monday = addDaysToDate(zonedDate(nowMs, tz), 1 - local.weekday);
    const cutoff = new Date(
      nowMs - (settings.fresh_days as number) * 24 * HOUR,
    ).toISOString();
    const { data: stale } = await admin
      .from("presales_profiles")
      .select(
        "member_id, availability_reviewed_at, members!inner(status, claimed_at)",
      )
      .eq("opted_in", true)
      .eq("members.status", "active")
      .not("members.claimed_at", "is", null)
      .or(
        `availability_reviewed_at.is.null,availability_reviewed_at.lt.${cutoff}`,
      )
      .order("member_id")
      .limit(1000);
    // The weekly review isn't urgent: people who muted presales get nothing.
    const { data: muted } = await admin
      .from("notification_preferences")
      .select("member_id")
      .eq("category", "presales")
      .eq("mode", "off");
    const mutedIds = new Set((muted ?? []).map((m) => m.member_id as string));
    let sent = 0;
    for (const p of stale ?? []) {
      if (sent >= REVIEW_BATCH) break;
      const id = p.member_id as string;
      if (mutedIds.has(id)) continue;
      if (
        !(await claim(
          admin,
          `availability_review:${id}:${monday}`,
          "availability_review",
          null,
          id,
        ))
      )
        continue;
      await notifySystem({ recipients: [id], event: "availability_review" });
      await sendTrackerEmail({
        recipientIds: [id],
        subject: "Is your presales availability up to date?",
        heading: "Please review your availability for the week",
        body: "Sales and Pod Leaders use your weekly hours and date exceptions to invite you to client meetings. It takes a minute to check them.",
        path: "/tracker/availability",
        cta: "Review my availability",
      });
      sent++;
    }
    if (sent) report.availability_review = sent;
  }
  return report;
}
