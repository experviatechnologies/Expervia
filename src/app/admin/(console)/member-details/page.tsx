import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { DownloadCsvButton } from "@/components/shared/download-csv-button";
import { DETAIL_LABEL, type DetailKey } from "@/lib/eten/member-details";
import {
  loadDetailsReport,
  NUDGE_COOLDOWN_DAYS,
} from "@/lib/eten/details-report";
import { NudgeButton } from "./nudge-button";

export const metadata: Metadata = { title: "Member Details" };

const FIELDS: DetailKey[] = [
  "phone",
  "cv",
  "location",
  "jobTitle",
  "yearsExperience",
  "consent",
  "fullName",
];

const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);
const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "Africa/Lagos",
      })
    : "Never";

/**
 * Who has given the required member details (7 Nov 2026), and reminders for
 * those who haven't. Ops only, re-checked here (the console layout checks too).
 */
export default async function MemberDetailsPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const r = await loadDetailsReport();
  const due = r.incomplete.filter((m) => !m.lastNudged && m.email).length;
  const csv = toCsv(
    ["Name", "Email", "Missing", "Pods", "Last sign-in", "Last reminded"],
    r.incomplete.map((m) => [
      m.name,
      m.email,
      m.missing.map((k) => DETAIL_LABEL[k]).join("; "),
      m.pods.join("; "),
      when(m.lastSignIn),
      when(m.lastNudged),
    ]),
  );
  const shown = r.incomplete.slice(0, 200);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      <header className="mb-5">
        <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
          Member details
        </h1>
        <p className="text-eten-ink-muted mt-1 text-sm">
          Every member must give a phone number, location, job title, years of
          experience and a CV before using ETEN. This shows who has, and lets
          you remind those who haven&apos;t.
        </p>
      </header>

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="bg-eten-panel border-eten-line rounded-2xl border p-4">
          <p className="text-eten-faint text-xs font-semibold uppercase">
            Complete
          </p>
          <p className="text-eten-ink mt-1 text-3xl font-extrabold tabular-nums">
            {pct(r.complete, r.total)}%
          </p>
          <p className="text-eten-ink-muted text-xs tabular-nums">
            {r.complete} of {r.total} active members
          </p>
        </div>
        <div className="bg-eten-panel border-eten-line rounded-2xl border p-4">
          <p className="text-eten-faint text-xs font-semibold uppercase">
            Still to complete
          </p>
          <p className="text-eten-ink mt-1 text-3xl font-extrabold tabular-nums">
            {r.incomplete.length}
          </p>
          <p className="text-eten-ink-muted text-xs tabular-nums">
            {due} can be reminded now ({NUDGE_COOLDOWN_DAYS}-day gap between
            reminders)
          </p>
        </div>
        <div className="bg-eten-panel border-eten-line rounded-2xl border p-4">
          <p className="text-eten-faint text-xs font-semibold uppercase">
            Never activated
          </p>
          <p className="text-eten-ink mt-1 text-3xl font-extrabold tabular-nums">
            {r.notActivated}
          </p>
          <p className="text-eten-ink-muted text-xs">
            Can&apos;t sign in yet: resend their invite from{" "}
            <Link
              href="/admin/members"
              className="text-eten-accent hover:underline"
            >
              Members
            </Link>
            .
          </p>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <NudgeButton
          due={due}
          label={`Remind everyone incomplete (${due})`}
          primary
        />
        <DownloadCsvButton
          csv={csv}
          filename="eten-incomplete-details.csv"
          label="Download list"
          className="border-eten-line text-eten-ink-muted hover:text-eten-ink inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold"
        />
      </div>

      <section className="mb-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="bg-eten-panel border-eten-line rounded-2xl border">
          <h2 className="text-eten-ink border-eten-line-soft border-b px-4 py-3 text-sm font-bold">
            Missing, by detail
          </h2>
          <ul className="divide-eten-line-soft divide-y">
            {FIELDS.map((k) => (
              <li key={k} className="px-4 py-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-eten-ink">{DETAIL_LABEL[k]}</span>
                  <span className="text-eten-ink-muted tabular-nums">
                    {r.missingByField[k]} missing ·{" "}
                    {pct(r.total - r.missingByField[k], r.total)}% have it
                  </span>
                </div>
                <div
                  className="bg-eten-line-soft mt-1.5 h-1.5 overflow-hidden rounded-full"
                  aria-hidden
                >
                  <div
                    className="bg-eten-accent h-full rounded-full"
                    style={{
                      width: `${pct(r.total - r.missingByField[k], r.total)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-eten-panel border-eten-line overflow-x-auto rounded-2xl border">
          <h2 className="text-eten-ink border-eten-line-soft border-b px-4 py-3 text-sm font-bold">
            By pod (lowest first)
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-eten-faint text-left text-xs">
                <th className="px-4 py-2 font-semibold">Pod</th>
                <th className="px-4 py-2 font-semibold">Complete</th>
                <th className="px-4 py-2 font-semibold">
                  <span className="sr-only">Remind</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-eten-line-soft divide-y">
              {r.pods.map((p) => {
                const podDue = r.incomplete.filter(
                  (m) => !m.lastNudged && m.email && m.pods.includes(p.name),
                ).length;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/pods/${p.slug}`}
                        className="text-eten-ink font-semibold hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="text-eten-ink-muted px-4 py-2.5 tabular-nums">
                      {p.complete} of {p.members} ({pct(p.complete, p.members)}
                      %)
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <NudgeButton
                        podId={p.id}
                        due={podDue}
                        label={`Remind ${podDue}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-eten-panel border-eten-line overflow-x-auto rounded-2xl border">
        <h2 className="text-eten-ink border-eten-line-soft border-b px-4 py-3 text-sm font-bold">
          Still to complete ({r.incomplete.length})
          {r.incomplete.length > shown.length
            ? `, first ${shown.length} shown; download the list for all`
            : ""}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-eten-faint text-left text-xs">
              <th className="px-4 py-2 font-semibold">Member</th>
              <th className="px-4 py-2 font-semibold">Missing</th>
              <th className="px-4 py-2 font-semibold">Pods</th>
              <th className="px-4 py-2 font-semibold">Last sign-in</th>
              <th className="px-4 py-2 font-semibold">Reminded</th>
            </tr>
          </thead>
          <tbody className="divide-eten-line-soft divide-y">
            {shown.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/members/${m.id}`}
                    className="text-eten-ink font-semibold hover:underline"
                  >
                    {m.name}
                  </Link>
                  <span className="text-eten-faint block text-xs">
                    {m.email}
                  </span>
                </td>
                <td className="text-eten-ink-muted px-4 py-2.5">
                  {m.missing.map((k) => DETAIL_LABEL[k]).join(", ")}
                </td>
                <td className="text-eten-ink-muted px-4 py-2.5 text-xs">
                  {m.pods.join(", ") || "None"}
                </td>
                <td className="text-eten-ink-muted px-4 py-2.5 tabular-nums">
                  {when(m.lastSignIn)}
                </td>
                <td className="text-eten-ink-muted px-4 py-2.5 tabular-nums">
                  {when(m.lastNudged)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
