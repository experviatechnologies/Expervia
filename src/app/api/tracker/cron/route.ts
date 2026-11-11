import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runReminders } from "@/lib/tracker/server/reminders";
import { syncAllBusy } from "@/lib/tracker/server/calendar";
import { retryFailedEventSyncs } from "@/lib/tracker/server/calendar/events";
import { notifySystem } from "@/lib/tracker/server/events";
import { sendTrackerEmail } from "@/lib/tracker/server/email";
import { sendSessionReminders } from "@/lib/eten/session-reminders";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Presales tracker scheduled job (Phase 7, step 7.1). Called every 15 minutes
 * by Supabase pg_cron (migration 52), or any scheduler, with
 * "Authorization: Bearer <CRON_SECRET>". Refuses to run without the secret.
 * Each run is logged in presales_job_runs for the admin health view.
 *
 * Three jobs, logged separately so one failing never stops the others:
 *   reminders          reminders and escalations (step 7.1)
 *   calendar_sync      connected calendars' busy times, next 28 days (step
 *                      8.2), and retries of meeting events that failed (8.3)
 *   session_reminders  mentorship "starts soon" push (PWA phase 4)
 */
function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const want = `Bearer ${secret}`;
  return (
    given.length === want.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(want))
  );
}

async function handle(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  /** Run one job, logging it in presales_job_runs. */
  async function logged(
    job: string,
    work: () => Promise<Record<string, number>>,
  ): Promise<
    { ok: true; report: Record<string, number> } | { ok: false; error: string }
  > {
    const { data: run } = await admin
      .from("presales_job_runs")
      .insert({ job })
      .select("id")
      .single();
    const finish = (patch: Record<string, unknown>) =>
      run
        ? admin
            .from("presales_job_runs")
            .update({ finished_at: new Date().toISOString(), ...patch })
            .eq("id", run.id)
        : Promise.resolve();
    try {
      const report = await work();
      await finish({ status: "succeeded", details: report });
      return { ok: true, report };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await finish({ status: "failed", error: message.slice(0, 1000) });
      await alertAdminsIfNew(job, run?.id ?? null, message);
      return { ok: false, error: message };
    }
  }

  /**
   * PRD section 10 "Integration failure": tell the admins when a job STARTS
   * failing (the run before this one succeeded, or there was none), not on
   * every 15-minute retry. System health shows the detail.
   */
  async function alertAdminsIfNew(
    job: string,
    runId: number | null,
    message: string,
  ) {
    try {
      let q = admin
        .from("presales_job_runs")
        .select("status")
        .eq("job", job)
        .neq("status", "running")
        .order("started_at", { ascending: false })
        .limit(1);
      if (runId !== null) q = q.neq("id", runId);
      const { data: prev } = await q.maybeSingle();
      if (prev?.status === "failed") return;
      const { data: ops } = await admin
        .from("members")
        .select("id")
        .eq("role", "operations")
        .eq("status", "active");
      const ids = (ops ?? []).map((m) => m.id as string);
      await notifySystem({ recipients: ids, event: "integration_failure" });
      await sendTrackerEmail({
        recipientIds: ids,
        subject: `Presales tracker: the ${job.replace("_", " ")} job is failing`,
        heading: "A background job started failing",
        body: `The ${job.replace("_", " ")} job failed: ${message.slice(0, 300)}\nIt retries every 15 minutes. You'll get one alert, not one per retry.`,
        path: "/admin/tracker-readiness",
        cta: "Open System health",
      });
    } catch (err) {
      console.error("alertAdminsIfNew failed", err);
    }
  }

  const reminders = await logged("reminders", () => runReminders(admin));
  const calendars = await logged("calendar_sync", async () => ({
    ...(await syncAllBusy()),
    ...(await retryFailedEventSyncs()),
  }));
  // Mentorship: "your session starts soon" push (PWA phase 4).
  const sessionReminders = await logged("session_reminders", () =>
    sendSessionReminders(admin),
  );

  // Housekeeping: keep 30 days of successful runs (failures are kept).
  await admin
    .from("presales_job_runs")
    .delete()
    .eq("status", "succeeded")
    .lt("started_at", new Date(Date.now() - 30 * 86_400_000).toISOString());

  const ok = reminders.ok && calendars.ok && sessionReminders.ok;
  return NextResponse.json(
    { ok, reminders, calendars, sessionReminders },
    { status: ok ? 200 : 500 },
  );
}

export const POST = handle;
export const GET = handle;
