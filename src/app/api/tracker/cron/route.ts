import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runReminders } from "@/lib/tracker/server/reminders";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Presales tracker scheduled job (Phase 7, step 7.1). Called every 15 minutes
 * by Supabase pg_cron (migration 52), or any scheduler, with
 * "Authorization: Bearer <CRON_SECRET>". Refuses to run without the secret.
 * Each run is logged in presales_job_runs for the admin health view.
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
  const { data: run } = await admin
    .from("presales_job_runs")
    .insert({ job: "reminders" })
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
    const report = await runReminders(admin);
    await finish({ status: "succeeded", details: report });
    return NextResponse.json({ ok: true, sent: report });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await finish({ status: "failed", error: message.slice(0, 1000) });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;
