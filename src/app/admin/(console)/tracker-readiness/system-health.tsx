import Link from "next/link";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Presales tracker system health for admins (Phase 7, step 7.2; PRD FR-030):
 * configuration, the scheduled reminder job (last success, stuck or failed
 * runs, what it sent) and emails that could not be delivered.
 */

type Run = {
  id: number;
  job: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "succeeded" | "failed";
  details: Record<string, unknown> | null;
  error: string | null;
};

const MINUTE = 60_000;

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function sentSummary(details: Record<string, unknown> | null) {
  const entries = Object.entries(details ?? {}).filter(
    ([, v]) => typeof v === "number" && v > 0,
  );
  return entries.length
    ? entries.map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`).join(", ")
    : "nothing due";
}

/**
 * Staff (operations, Sales Managers, Management) and whether each has an
 * authenticator app set up. Staff are few, so one auth lookup each is fine.
 */
async function staffTwoStep(admin: ReturnType<typeof getSupabaseAdmin>) {
  const [{ data: ops }, { data: roleRows }] = await Promise.all([
    admin
      .from("members")
      .select("id")
      .eq("role", "operations")
      .eq("status", "active"),
    admin.from("member_roles").select("member_id"),
  ]);
  const ids = Array.from(
    new Set([
      ...(ops ?? []).map((m) => m.id as string),
      ...(roleRows ?? []).map((r) => r.member_id as string),
    ]),
  );
  const [users, { data: names }] = await Promise.all([
    Promise.all(ids.map((id) => admin.auth.admin.getUserById(id))),
    ids.length
      ? admin
          .from("profiles")
          .select("member_id, full_name")
          .in("member_id", ids)
      : Promise.resolve({
          data: [] as { member_id: string; full_name: string }[],
        }),
  ]);
  const nameOf = new Map(
    (names ?? []).map((n) => [n.member_id as string, n.full_name as string]),
  );
  const missing = ids.filter((id, i) => {
    const factors = users[i].data.user?.factors ?? [];
    return !factors.some(
      (f) => f.factor_type === "totp" && f.status === "verified",
    );
  });
  return {
    total: ids.length,
    missing: missing.map((id) => ({ id, name: nameOf.get(id) ?? "A member" })),
  };
}

export async function SystemHealth() {
  const admin = getSupabaseAdmin();
  // Request-time clock (server component: rendered once per request).
  const now = new Date().getTime();
  const [{ data: runRows, error }, { data: lastOk }, { data: emailRows }] =
    await Promise.all([
      admin
        .from("presales_job_runs")
        .select("id, job, started_at, finished_at, status, details, error")
        .eq("job", "reminders")
        .order("started_at", { ascending: false })
        .limit(10),
      admin
        .from("presales_job_runs")
        .select("started_at, details")
        .eq("job", "reminders")
        .eq("status", "succeeded")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("presales_job_runs")
        .select("id, started_at, details, error")
        .eq("job", "email")
        .eq("status", "failed")
        .gte("started_at", new Date(now - 7 * 24 * 60 * MINUTE).toISOString())
        .order("started_at", { ascending: false })
        .limit(50),
    ]);

  if (error) {
    return (
      <p className="text-eten-ink-muted text-sm">
        System health needs migration <code>51_presales_reminders.sql</code>.
      </p>
    );
  }

  const twoStep = await staffTwoStep(admin);
  const runs = (runRows ?? []) as Run[];
  const emails = (emailRows ?? []) as {
    id: number;
    started_at: string;
    details: { recipient_id?: string; subject?: string } | null;
    error: string | null;
  }[];
  const recipientIds = Array.from(
    new Set(emails.map((e) => e.details?.recipient_id).filter(Boolean)),
  ) as string[];
  const { data: names } = recipientIds.length
    ? await admin
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", recipientIds)
    : { data: [] };
  const nameOf = new Map(
    (names ?? []).map((n) => [
      n.member_id as string,
      (n.full_name as string) ?? "A member",
    ]),
  );

  const stuck = runs.filter(
    (r) =>
      r.status === "running" && now - Date.parse(r.started_at) > 10 * MINUTE,
  );
  const failed = runs.filter((r) => r.status === "failed");
  const lastOkAt = lastOk?.started_at as string | undefined;
  const late = !lastOkAt || now - Date.parse(lastOkAt) > 60 * MINUTE;

  const checks: { ok: boolean; label: string; help: string }[] = [
    {
      ok: Boolean(process.env.CONTACT_FROM_EMAIL && process.env.RESEND_API_KEY),
      label:
        process.env.CONTACT_FROM_EMAIL && process.env.RESEND_API_KEY
          ? "Email sending configured"
          : "Email sending not configured",
      help: "CONTACT_FROM_EMAIL and RESEND_API_KEY in Vercel.",
    },
    {
      ok: Boolean(process.env.CRON_SECRET),
      label: process.env.CRON_SECRET
        ? "Scheduled job secret set"
        : "Scheduled job secret missing",
      help: "CRON_SECRET in Vercel, the same value as the Supabase Vault secret.",
    },
    {
      ok: !late,
      label: lastOkAt
        ? `Reminder job last succeeded ${when(lastOkAt)}`
        : "Reminder job has not run yet",
      help: "Runs every 15 minutes once migration 52 is scheduled. A gap of over an hour means the schedule or the endpoint needs attention.",
    },
    {
      ok: stuck.length === 0 && failed.length === 0,
      label:
        stuck.length || failed.length
          ? `${failed.length} failed, ${stuck.length} stuck in the last ${runs.length} runs`
          : "No failed or stuck runs recently",
      help: "Details below.",
    },
    {
      ok: twoStep.missing.length === 0,
      label: twoStep.missing.length
        ? `${twoStep.total - twoStep.missing.length} of ${twoStep.total} staff have two-step sign-in`
        : `All ${twoStep.total} staff have two-step sign-in`,
      help: twoStep.missing.length
        ? `Not set up yet: ${twoStep.missing
            .slice(0, 5)
            .map((m) => m.name)
            .join(
              ", ",
            )}${twoStep.missing.length > 5 ? ` and ${twoStep.missing.length - 5} more` : ""}. They are asked to set it up at their next sign-in.`
        : "Admins, Sales Managers and Management enter an app code at sign-in.",
    },
    {
      ok: emails.length === 0,
      label: emails.length
        ? `${emails.length} email${emails.length > 1 ? "s" : ""} not delivered in the last 7 days`
        : "No undelivered emails in the last 7 days",
      help: "Recipients still have the in-app notification.",
    },
  ];

  return (
    <div className="space-y-4">
      <ul className="grid gap-2 md:grid-cols-2">
        {checks.map((c) => (
          <li
            key={c.label}
            className="bg-eten-panel border-eten-line flex gap-2.5 rounded-xl border p-3"
          >
            {c.ok ? (
              <CheckCircle2
                className="text-eten-verified mt-0.5 size-4 shrink-0"
                aria-hidden
              />
            ) : (
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-amber-600"
                aria-hidden
              />
            )}
            <span>
              <span className="text-eten-ink block text-sm font-semibold">
                {c.label}
              </span>
              <span className="text-eten-faint block text-xs">{c.help}</span>
            </span>
          </li>
        ))}
      </ul>

      <details className="bg-eten-panel border-eten-line rounded-2xl border">
        <summary className="text-eten-ink cursor-pointer p-4 text-sm font-semibold">
          Recent reminder runs ({runs.length})
        </summary>
        {runs.length === 0 ? (
          <p className="text-eten-faint border-eten-line-soft border-t px-4 py-3 text-sm">
            No runs yet.
          </p>
        ) : (
          <ul className="border-eten-line-soft divide-eten-line-soft divide-y border-t">
            {runs.map((r) => {
              const isStuck = stuck.includes(r);
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-start gap-2 px-4 py-2.5 text-sm"
                >
                  {r.status === "succeeded" ? (
                    <CheckCircle2
                      className="text-eten-verified mt-0.5 size-4"
                      aria-hidden
                    />
                  ) : r.status === "failed" || isStuck ? (
                    <XCircle
                      className="mt-0.5 size-4 text-red-600"
                      aria-hidden
                    />
                  ) : (
                    <AlertTriangle
                      className="mt-0.5 size-4 text-amber-600"
                      aria-hidden
                    />
                  )}
                  <span className="text-eten-ink tabular-nums">
                    {when(r.started_at)}
                  </span>
                  <span className="text-eten-ink-muted">
                    {r.status === "succeeded"
                      ? `Sent: ${sentSummary(r.details)}`
                      : r.status === "failed"
                        ? `Failed: ${r.error ?? "unknown error"}`
                        : isStuck
                          ? "Stuck: started but never finished"
                          : "Running"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </details>

      <details className="bg-eten-panel border-eten-line rounded-2xl border">
        <summary className="text-eten-ink cursor-pointer p-4 text-sm font-semibold">
          Undelivered emails, last 7 days ({emails.length})
        </summary>
        {emails.length === 0 ? (
          <p className="text-eten-faint border-eten-line-soft border-t px-4 py-3 text-sm">
            None.
          </p>
        ) : (
          <ul className="border-eten-line-soft divide-eten-line-soft divide-y border-t">
            {emails.map((e) => (
              <li key={e.id} className="px-4 py-2.5 text-sm">
                <span className="text-eten-ink tabular-nums">
                  {when(e.started_at)}
                </span>{" "}
                {e.details?.recipient_id ? (
                  <Link
                    href={`/admin/members/${e.details.recipient_id}`}
                    className="text-eten-ink font-semibold hover:underline"
                  >
                    {nameOf.get(e.details.recipient_id) ?? "A member"}
                  </Link>
                ) : (
                  "A member"
                )}
                <span className="text-eten-ink-muted">
                  {" "}
                  · {e.details?.subject ?? ""}
                </span>
                <span className="block text-xs text-red-700">{e.error}</span>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
