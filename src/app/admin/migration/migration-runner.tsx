"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Play, Send, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";

type Report = {
  mode: "dry-run" | "test" | "send";
  counts: {
    applications: number;
    events: number;
    uniqueEmails: number;
    eligible: number;
    alreadyClaimed: number;
    toInvite: number;
    excludedMembershipNo: number;
    excludedUnclear: number;
    invalidEmail: number;
  };
  toInvite: { email: string; fullName: string | null }[];
  excludedSamples: {
    membershipNo: string[];
    unclear: string[];
    invalidEmail: string[];
  };
  processed?: { email: string; status: "invited" | "failed"; error?: string }[];
  remaining?: number;
};

const fieldClass =
  "w-full rounded-lg border border-outline-variant bg-surface p-3 text-sm text-on-surface outline-none transition-all focus:border-primary placeholder:text-on-surface-variant/60";
const CONFIRM_PHRASE = "SEND-ALL";

export function MigrationRunner() {
  const [loading, setLoading] = useState<null | "dry-run" | "test" | "send">(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [testEmails, setTestEmails] = useState("");
  const [confirmText, setConfirmText] = useState("");

  async function run(
    mode: "dry-run" | "test" | "send",
    extra: Record<string, unknown> = {},
  ) {
    setLoading(mode);
    setError(null);
    try {
      const res = await fetch("/api/admin/eten-migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setReport(data as Report);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(null);
    }
  }

  const parsedTestEmails = testEmails
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      {/* Actions */}
      <div className="glass-card flex flex-col gap-6 rounded-2xl p-6">
        {/* Dry run */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-on-surface font-semibold">
              1. Preview (dry run)
            </h2>
            <p className="text-on-surface-variant text-sm">
              Read-only. See exactly who would be invited — no accounts created,
              no emails sent.
            </p>
          </div>
          <Button
            type="button"
            variant="brandOutline"
            size="pill-sm"
            disabled={loading !== null}
            onClick={() => run("dry-run")}
          >
            {loading === "dry-run" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Run preview
          </Button>
        </div>

        <div className="border-outline-variant border-t" />

        {/* Test */}
        <div>
          <h2 className="text-on-surface font-semibold">
            2. Send test invites
          </h2>
          <p className="text-on-surface-variant mb-3 text-sm">
            Provisions and emails only the addresses you list. Use your own
            addresses to verify the claim flow end-to-end.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={testEmails}
              onChange={(e) => setTestEmails(e.target.value)}
              placeholder="you@example.com, colleague@example.com"
              className={fieldClass}
            />
            <Button
              type="button"
              variant="brand"
              size="pill-sm"
              className="shrink-0"
              disabled={loading !== null || parsedTestEmails.length === 0}
              onClick={() => run("test", { testEmails: parsedTestEmails })}
            >
              {loading === "test" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <TestTube className="size-4" />
              )}
              Send test
            </Button>
          </div>
        </div>

        <div className="border-outline-variant border-t" />

        {/* Send all */}
        <div>
          <h2 className="text-destructive flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" />
            3. Send to everyone
          </h2>
          <p className="text-on-surface-variant mb-3 text-sm">
            Provisions and emails every eligible registrant (up to 50 per run —
            re-run to continue; already-invited people are skipped). This is
            irreversible. Type{" "}
            <code className="text-on-surface font-mono">{CONFIRM_PHRASE}</code>{" "}
            to enable.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type ${CONFIRM_PHRASE} to confirm`}
              className={fieldClass}
            />
            <Button
              type="button"
              variant="destructive"
              size="pill-sm"
              className="shrink-0"
              disabled={loading !== null || confirmText !== CONFIRM_PHRASE}
              onClick={() => run("send", { confirm: CONFIRM_PHRASE })}
            >
              {loading === "send" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send invites
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
          {error}
        </p>
      )}

      {report && <ReportView report={report} />}
    </div>
  );
}

function ReportView({ report }: { report: Report }) {
  const c = report.counts;
  const stats: [string, number][] = [
    ["Applications", c.applications],
    ["Event registrations", c.events],
    ["Unique people", c.uniqueEmails],
    ["Eligible", c.eligible],
    ["Already have accounts", c.alreadyClaimed],
    ["To invite", c.toInvite],
    ["Excluded — declined", c.excludedMembershipNo],
    ["Excluded — no intent", c.excludedUnclear],
    ["Invalid emails", c.invalidEmail],
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display text-body-lg text-on-surface mb-4 font-bold">
        {report.mode === "dry-run" ? "Preview" : "Result"}
      </h3>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-surface-container rounded-lg p-3">
            <dt className="text-on-surface-variant text-xs">{label}</dt>
            <dd className="text-on-surface text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {report.processed && (
        <div className="mt-6">
          <p className="text-on-surface mb-2 text-sm font-semibold">
            Processed this run ({report.processed.length})
            {typeof report.remaining === "number" && report.remaining > 0 && (
              <span className="text-on-surface-variant font-normal">
                {" "}
                · {report.remaining} still remaining — run again to continue
              </span>
            )}
          </p>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {report.processed.map((p) => (
              <li key={p.email} className="flex items-center gap-2">
                <span
                  className={
                    p.status === "invited" ? "text-primary" : "text-destructive"
                  }
                >
                  {p.status === "invited" ? "✓" : "✕"}
                </span>
                <span className="text-on-surface">{p.email}</span>
                {p.error && (
                  <span className="text-destructive text-xs">— {p.error}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.mode === "dry-run" && report.toInvite.length > 0 && (
        <div className="mt-6">
          <p className="text-on-surface mb-2 text-sm font-semibold">
            Would invite ({report.toInvite.length}
            {report.toInvite.length >= 500 ? "+, showing first 500" : ""})
          </p>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {report.toInvite.map((p) => (
              <li key={p.email} className="text-on-surface-variant">
                <span className="text-on-surface">{p.email}</span>
                {p.fullName && <span> — {p.fullName}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
