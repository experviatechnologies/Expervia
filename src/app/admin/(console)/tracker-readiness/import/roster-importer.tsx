"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Upload } from "lucide-react";
import { downloadCsv, toCsv } from "@/lib/csv";
import type {
  ApplyReport,
  PlannedRow,
  RosterPlan,
} from "@/lib/tracker/server/roster-import";
import { applyRosterImport, previewRoster } from "./actions";

const STATUS: Record<PlannedRow["status"], { label: string; cls: string }> = {
  new: { label: "New account", cls: "bg-blue-500/10 text-blue-700" },
  update: { label: "Update", cls: "bg-eten-accent-soft text-eten-accent" },
  unchanged: {
    label: "Up to date",
    cls: "bg-eten-line-soft text-eten-ink-muted",
  },
  error: { label: "Error", cls: "bg-red-500/10 text-red-700" },
};

const TEMPLATE = toCsv(
  ["full_name", "email", "primary_pod", "other_pods", "pod_role"],
  [
    ["Ada Example", "ada@example.com", "security", "azure-infra; aws", "lead"],
    ["Tunde Example", "tunde@example.com", "Data & AI", "", ""],
  ],
);

export function RosterImporter() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [plan, setPlan] = useState<RosterPlan | null>(null);
  const [report, setReport] = useState<ApplyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PlannedRow["status"] | "all">("all");
  const [sendInvites, setSendInvites] = useState(false);
  const [busy, startTransition] = useTransition();

  const preview = (text: string) => {
    setError(null);
    setReport(null);
    setPlan(null);
    startTransition(async () => {
      const res = await previewRoster(text);
      if ("error" in res) setError(res.error);
      else setPlan(res.plan);
    });
  };

  const apply = () => {
    if (!plan) return;
    const s = plan.summary;
    const msg =
      `Apply this import?\n\n${s.new} new account(s)${sendInvites ? " will be emailed an invite" : " (no email yet)"}\n` +
      `${s.update} member(s) updated, ${s.leaders} leadership change(s)\n${s.error} row(s) with errors are skipped.`;
    if (!confirm(msg)) return;
    setError(null);
    startTransition(async () => {
      const res = await applyRosterImport({ csv, sendInvites });
      if ("error" in res) setError(res.error);
      else {
        setReport(res.report);
        setPlan(null);
        router.refresh();
      }
    });
  };

  const rows = plan
    ? plan.rows.filter((r) => filter === "all" || r.status === filter)
    : [];
  const actionable = plan ? plan.summary.new + plan.summary.update : 0;

  return (
    <div className="mt-6 space-y-5">
      <section className="bg-eten-panel border-eten-line rounded-2xl border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="bg-eten-accent inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white">
            <Upload className="size-4" /> Choose a CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                if (f.size > 2 * 1024 * 1024)
                  return setError("The file is larger than 2 MB.");
                const text = await f.text();
                setCsv(text);
                setFileName(f.name);
                preview(text);
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => downloadCsv("eten-roster-template.csv", TEMPLATE)}
            className="text-eten-accent inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            <Download className="size-4" /> Download template
          </button>
          {fileName && (
            <span className="text-eten-faint text-sm">{fileName}</span>
          )}
          {busy && <Loader2 className="text-eten-faint size-4 animate-spin" />}
        </div>
        <p className="text-eten-faint mt-3 text-xs">
          Columns: <code>full_name</code>, <code>email</code> (the match key),{" "}
          <code>primary_pod</code> (pod name or slug), optional{" "}
          <code>other_pods</code> separated by &quot;;&quot;, and optional{" "}
          <code>pod_role</code> (<code>lead</code> or <code>backup</code>) for
          the primary pod. Up to 2,000 rows, 2 MB.
        </p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </section>

      {report && (
        <section
          className="bg-eten-panel border-eten-line rounded-2xl border p-5"
          aria-live="polite"
        >
          <h2 className="text-eten-ink text-sm font-bold">Import applied</h2>
          <ul className="text-eten-ink mt-2 space-y-1 text-sm">
            <li>
              {report.created} new account(s) created
              {report.invited
                ? `, ${report.invited} invited by email`
                : " (invite them later from Migration > Pending claims)"}
            </li>
            <li>{report.updated} existing member(s) updated</li>
            <li>{report.leadersSet} Pod Leader / backup change(s)</li>
            {report.remainingNew > 0 && (
              <li className="font-semibold text-amber-700">
                {report.remainingNew} new people are still to create (batches of
                50). Upload the same file again to continue.
              </li>
            )}
          </ul>
          {report.failures.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-red-700">
                {report.failures.length} row(s) failed
              </p>
              <ul className="text-eten-ink-muted mt-1 text-xs">
                {report.failures.slice(0, 20).map((f) => (
                  <li key={f.email}>
                    {f.email}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {plan && (
        <section className="bg-eten-panel border-eten-line overflow-hidden rounded-2xl border">
          <div className="border-eten-line-soft flex flex-wrap items-center gap-2 border-b px-5 py-4">
            {(["all", "new", "update", "unchanged", "error"] as const).map(
              (k) => {
                const n = k === "all" ? plan.summary.total : plan.summary[k];
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={filter === k}
                    onClick={() => setFilter(k)}
                    className={
                      "rounded-lg border px-3 py-1 text-sm font-semibold " +
                      (filter === k
                        ? "border-eten-accent/40 bg-eten-accent-soft text-eten-accent"
                        : "border-eten-line text-eten-ink-muted")
                    }
                  >
                    {k === "all" ? "All" : STATUS[k].label} · {n}
                  </button>
                );
              },
            )}
            <span className="text-eten-faint ml-auto text-sm">
              {plan.summary.leaders} leadership change(s)
            </span>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="bg-eten-panel sticky top-0">
                <tr className="border-eten-line-soft border-b text-left">
                  {[
                    "Line",
                    "Name",
                    "Email",
                    "Pods",
                    "Result",
                    "What happens",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-eten-faint px-4 py-2.5 font-mono text-[11px] font-bold tracking-wider uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.line}
                    className="border-eten-line-soft border-b align-top last:border-0"
                  >
                    <td className="text-eten-faint px-4 py-2.5 tabular-nums">
                      {r.line}
                    </td>
                    <td className="text-eten-ink px-4 py-2.5">
                      {r.fullName || "—"}
                    </td>
                    <td className="text-eten-ink-muted px-4 py-2.5">
                      {r.email}
                    </td>
                    <td className="text-eten-ink-muted px-4 py-2.5 text-xs">
                      {r.podIds
                        .map((id) => plan.pods.find((p) => p.id === id)?.name)
                        .join(", ")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          "rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap " +
                          STATUS[r.status].cls
                        }
                      >
                        {STATUS[r.status].label}
                      </span>
                    </td>
                    <td className="text-eten-ink-muted px-4 py-2.5 text-xs">
                      {r.messages.join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-eten-line-soft flex flex-wrap items-center gap-3 border-t px-5 py-4">
            {plan.summary.new > 0 && (
              <label className="text-eten-ink flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sendInvites}
                  onChange={(e) => setSendInvites(e.target.checked)}
                  className="accent-eten-accent size-4"
                />
                Email new people their claim invite now
              </label>
            )}
            <span className="flex-1" />
            <button
              type="button"
              disabled={busy || actionable === 0}
              onClick={apply}
              className="bg-eten-accent inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Apply {actionable} change{actionable === 1 ? "" : "s"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
