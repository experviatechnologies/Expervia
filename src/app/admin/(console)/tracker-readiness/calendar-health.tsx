import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase";
import { BUSY_FRESH_MS } from "@/lib/tracker/server/calendar";
import { RetrySyncButton } from "./retry-sync-button";

/**
 * Calendar integration health for admins (Phase 8, step 8.5; PRD FR-030
 * "calendar errors"): the 15-minute calendar sync, members whose connection
 * needs attention, and meeting events that failed to sync.
 */

const MINUTE = 60_000;

function when(iso: string | null) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const PROVIDER: Record<string, string> = {
  microsoft: "Outlook",
  google: "Google",
};

const STATUS: Record<string, string> = {
  connected: "Connected",
  expired: "Expired",
  revoked: "Access removed",
  error: "Error",
};

export async function CalendarHealth() {
  const admin = getSupabaseAdmin();
  const now = new Date().getTime();
  const [conns, lastOk, failedRuns, seats] = await Promise.all([
    admin
      .from("presales_calendar_connections")
      .select(
        "member_id, provider, status, last_error, last_checked_at, busy_synced_at",
      ),
    admin
      .from("presales_job_runs")
      .select("started_at, details")
      .eq("job", "calendar_sync")
      .eq("status", "succeeded")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("presales_job_runs")
      .select("id, started_at, error")
      .eq("job", "calendar_sync")
      .eq("status", "failed")
      .gte("started_at", new Date(now - 24 * 60 * MINUTE).toISOString())
      .order("started_at", { ascending: false })
      .limit(5),
    admin
      .from("presales_assignments")
      .select(
        "id, request_id, member_id, sync_status, sync_error, updated_at, presales_requests!inner(ref, title, status, starts_at)",
      )
      .in("sync_status", ["failed", "pending"])
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  if (conns.error) {
    return (
      <p className="text-eten-ink-muted text-sm">
        Calendar health needs migrations{" "}
        <code>54_presales_calendar_connections.sql</code> and{" "}
        <code>55_presales_calendar_busy.sql</code>.
      </p>
    );
  }

  type Conn = {
    member_id: string;
    provider: string;
    status: string;
    last_error: string | null;
    last_checked_at: string | null;
    busy_synced_at: string | null;
  };
  const all = (conns.data ?? []) as Conn[];
  const connected = all.filter((c) => c.status === "connected");
  const stale = (c: Conn) =>
    c.status === "connected" &&
    (!c.busy_synced_at || now - Date.parse(c.busy_synced_at) > BUSY_FRESH_MS);
  const attention = all.filter(
    (c) => c.status !== "connected" || stale(c) || Boolean(c.last_error),
  );

  type SeatRow = {
    id: string;
    request_id: string;
    member_id: string;
    sync_status: string;
    sync_error: string | null;
    updated_at: string;
    presales_requests:
      | { ref: string; title: string; status: string; starts_at: string }
      | { ref: string; title: string; status: string; starts_at: string }[];
  };
  // 'pending' only counts once it has been stuck for more than 10 minutes.
  const badSeats = ((seats.data ?? []) as SeatRow[]).filter(
    (s) =>
      s.sync_status === "failed" ||
      now - Date.parse(s.updated_at) > 10 * MINUTE,
  );

  const ids = Array.from(
    new Set([
      ...attention.map((c) => c.member_id),
      ...badSeats.map((s) => s.member_id),
    ]),
  );
  const { data: names } = ids.length
    ? await admin
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", ids)
    : { data: [] };
  const nameOf = new Map(
    (names ?? []).map((n) => [n.member_id as string, n.full_name as string]),
  );

  const lastOkAt = lastOk.data?.started_at as string | undefined;
  const syncLate =
    connected.length > 0 &&
    (!lastOkAt || now - Date.parse(lastOkAt) > 60 * MINUTE);

  const checks = [
    {
      ok: !syncLate,
      label:
        connected.length === 0
          ? "No calendars connected yet"
          : lastOkAt
            ? `Calendar sync last succeeded ${when(lastOkAt)}`
            : "Calendar sync has not run yet",
      help: `${connected.length} connected (${connected.filter((c) => c.provider === "microsoft").length} Outlook, ${connected.filter((c) => c.provider === "google").length} Google). Runs with the 15-minute job.`,
    },
    {
      ok: (failedRuns.data ?? []).length === 0,
      label: (failedRuns.data ?? []).length
        ? `${failedRuns.data!.length} calendar sync run${failedRuns.data!.length > 1 ? "s" : ""} failed in the last 24 hours`
        : "No failed calendar sync runs in the last 24 hours",
      help:
        (failedRuns.data ?? [])[0]?.error ??
        "Each run reads busy times and retries failed events.",
    },
    {
      ok: attention.length === 0,
      label: attention.length
        ? `${attention.length} calendar connection${attention.length > 1 ? "s" : ""} need attention`
        : "All calendar connections working",
      help: "Their availability shows as unverified until fixed. Expired members were asked to reconnect.",
    },
    {
      ok: badSeats.length === 0,
      label: badSeats.length
        ? `${badSeats.length} meeting event${badSeats.length > 1 ? "s" : ""} not synced`
        : "All meeting events synced",
      help: "Retried every 15 minutes. Calendar problems never change the meeting itself.",
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
            <span className="min-w-0">
              <span className="text-eten-ink block text-sm font-semibold">
                {c.label}
              </span>
              <span className="text-eten-faint block text-xs break-words">
                {c.help}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <details className="bg-eten-panel border-eten-line rounded-2xl border">
        <summary className="text-eten-ink cursor-pointer p-4 text-sm font-semibold">
          Calendar connections needing attention ({attention.length})
        </summary>
        {attention.length === 0 ? (
          <p className="text-eten-faint border-eten-line-soft border-t px-4 py-3 text-sm">
            None.
          </p>
        ) : (
          <ul className="border-eten-line-soft divide-eten-line-soft divide-y border-t">
            {attention.map((c) => (
              <li key={c.member_id} className="px-4 py-2.5 text-sm">
                <Link
                  href={`/admin/members/${c.member_id}`}
                  className="text-eten-ink font-semibold hover:underline"
                >
                  {nameOf.get(c.member_id) ?? "A member"}
                </Link>
                <span className="text-eten-ink-muted">
                  {" "}
                  · {PROVIDER[c.provider] ?? c.provider} ·{" "}
                  {stale(c) && c.status === "connected"
                    ? "Busy times out of date"
                    : (STATUS[c.status] ?? c.status)}{" "}
                  · last checked {when(c.last_checked_at)}
                </span>
                {c.last_error && (
                  <span className="block text-xs break-words text-red-700">
                    {c.last_error}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </details>

      <details className="bg-eten-panel border-eten-line rounded-2xl border">
        <summary className="text-eten-ink cursor-pointer p-4 text-sm font-semibold">
          Meeting events not synced ({badSeats.length})
        </summary>
        {badSeats.length === 0 ? (
          <p className="text-eten-faint border-eten-line-soft border-t px-4 py-3 text-sm">
            None.
          </p>
        ) : (
          <ul className="border-eten-line-soft divide-eten-line-soft divide-y border-t">
            {badSeats.map((s) => {
              const r = Array.isArray(s.presales_requests)
                ? s.presales_requests[0]
                : s.presales_requests;
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-start justify-between gap-2 px-4 py-2.5 text-sm"
                >
                  <span className="min-w-0">
                    <Link
                      href={`/tracker/requests/${s.request_id}`}
                      className="text-eten-ink font-semibold hover:underline"
                    >
                      {r?.ref} {r?.title}
                    </Link>
                    <span className="text-eten-ink-muted">
                      {" "}
                      · {nameOf.get(s.member_id) ?? "A member"} ·{" "}
                      {s.sync_status === "failed" ? "Failed" : "Stuck pending"}
                    </span>
                    {s.sync_error && (
                      <span className="block text-xs break-words text-red-700">
                        {s.sync_error}
                      </span>
                    )}
                  </span>
                  <RetrySyncButton requestId={s.request_id} />
                </li>
              );
            })}
          </ul>
        )}
      </details>
    </div>
  );
}
