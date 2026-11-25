import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCrmSession } from "@/lib/crm/session";
import {
  conversionReport,
  salesReport,
  teamReport,
  type ConversionReport,
  type SalesReport,
  type TeamRow,
} from "@/lib/crm/reports";
import { LEAD_STATUS_LABEL } from "@/lib/crm/labels";
import { CRM_SERIES } from "@/lib/crm/chart-colors";
import { Card } from "@/components/crm/ui";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { cn } from "@/lib/utils";
import { exportReportCsv, type ReportTab } from "./actions";

export const metadata: Metadata = { title: "Reports" };

const TABS: { id: ReportTab; label: string }[] = [
  { id: "leads", label: "Leads and conversion" },
  { id: "sales", label: "Sales" },
  { id: "team", label: "Team activity" },
];

const fmt = (n: number) => n.toLocaleString("en-GB");
const pct = (r: number) => `${Math.round(r * 100)}%`;

/** A thin inline bar (magnitude); the number beside it carries the value. */
function Bar({
  value,
  max,
  color = CRM_SERIES.brand,
}: {
  value: number;
  max: number;
  color?: string;
}) {
  return (
    <div aria-hidden className="bg-brand-50 h-2 w-full min-w-16 rounded-full">
      <div
        className="h-2 rounded-full"
        style={{
          width: `${max ? Math.max((value / max) * 100, value ? 2 : 0) : 0}%`,
          background: color,
        }}
      />
    </div>
  );
}

const th =
  "px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase";
const td = "px-4 py-3 text-sm";

function Table({
  caption,
  head,
  children,
}: {
  caption: string;
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-y border-[#ece9f5] bg-[#fbfaff]">{head}</thead>
        <tbody className="divide-y divide-[#f1eef8]">{children}</tbody>
      </table>
    </div>
  );
}

function Leads({ r }: { r: ConversionReport }) {
  const maxContacts = Math.max(...r.sources.map((s) => s.contacts), 1);
  const maxStatus = Math.max(...r.leadStatus.map((s) => s.count), 1);
  return (
    <div className="space-y-6">
      <Card title="Conversion by source">
        <p className="-mt-2 mb-4 text-sm text-slate-600">
          Of everyone who came in through each source, how many have a platform
          account and how many have actually activated it. Staff logins are left
          out.
        </p>
        <Table
          caption="Conversion by source"
          head={
            <tr>
              <th scope="col" className={th}>
                Source
              </th>
              <th scope="col" className={cn(th, "text-right")}>
                Contacts
              </th>
              <th scope="col" className={cn(th, "hidden w-40 md:table-cell")}>
                <span className="sr-only">Share</span>
              </th>
              <th scope="col" className={cn(th, "text-right")}>
                With an account
              </th>
              <th scope="col" className={cn(th, "text-right")}>
                Activated
              </th>
              <th scope="col" className={cn(th, "w-48")}>
                Activation rate
              </th>
            </tr>
          }
        >
          {[...r.sources, r.totals].map((s, i, all) => {
            const total = i === all.length - 1;
            return (
              <tr
                key={s.source}
                className={total ? "bg-[#fbfaff] font-semibold" : undefined}
              >
                <th
                  scope="row"
                  className={cn(
                    td,
                    "text-ink text-left font-medium",
                    total && "font-semibold",
                  )}
                >
                  {total ? (
                    s.source
                  ) : (
                    <Link
                      href={`/crm/contacts?source=${encodeURIComponent(s.source)}`}
                      className="hover:text-brand-700 hover:underline"
                    >
                      {s.source}
                    </Link>
                  )}
                </th>
                <td className={cn(td, "text-right tabular-nums")}>
                  {fmt(s.contacts)}
                </td>
                <td className={cn(td, "hidden md:table-cell")}>
                  {!total && <Bar value={s.contacts} max={maxContacts} />}
                </td>
                <td className={cn(td, "text-right tabular-nums")}>
                  {fmt(s.withAccount)}
                </td>
                <td className={cn(td, "text-right tabular-nums")}>
                  {fmt(s.activated)}
                </td>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <span className="text-ink w-10 text-right font-semibold tabular-nums">
                      {pct(s.rate)}
                    </span>
                    <Bar value={s.rate} max={1} />
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Card title="Lead status">
        <ul className="space-y-3">
          {r.leadStatus.map((s) => (
            <li key={s.status}>
              <div className="mb-1 flex justify-between text-sm">
                <Link
                  href={`/crm/contacts?leadStatus=${s.status}`}
                  className="hover:text-brand-700 text-slate-700 hover:underline"
                >
                  {LEAD_STATUS_LABEL[
                    s.status as keyof typeof LEAD_STATUS_LABEL
                  ] ?? s.status}
                </Link>
                <span className="text-ink font-semibold tabular-nums">
                  {fmt(s.count)}
                </span>
              </div>
              <Bar value={s.count} max={maxStatus} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Sales({ r }: { r: SalesReport | null }) {
  if (!r) {
    return (
      <Card>
        <p className="text-sm text-slate-700">
          Sales reports need deals. Run{" "}
          <code className="bg-brand-50 text-brand-800 rounded px-1.5 py-0.5">
            supabase/eten/68_crm_deals.sql
          </code>{" "}
          in the Supabase SQL Editor first.
        </p>
      </Card>
    );
  }
  const maxMonth = Math.max(...r.months.map((m) => m.won + m.lost), 1);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#ece9f5] bg-white p-4">
          <p className="text-sm text-slate-600">Win rate, last 90 days</p>
          <p className="text-ink mt-1 text-2xl font-semibold">
            {r.winRate90 === null ? "No closed deals" : pct(r.winRate90)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Won out of {r.closed90} closed
          </p>
        </div>
        <div className="rounded-2xl border border-[#ece9f5] bg-white p-4">
          <p className="text-sm text-slate-600">Average deal won</p>
          <p className="text-ink mt-1 text-2xl font-semibold">
            {r.averageWon.length ? r.averageWon.join(" · ") : "None yet"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#ece9f5] bg-white p-4">
          <p className="text-sm text-slate-600">Won in the last 6 months</p>
          <p className="text-ink mt-1 text-2xl font-semibold">
            {fmt(r.months.reduce((n, m) => n + m.won, 0))} deals
          </p>
        </div>
      </div>

      {r.pipelines.map((p) => {
        const max = Math.max(...p.stages.map((s) => s.ngnMinor), 1);
        return (
          <Card key={p.id} title={`${p.label}: deals by stage`}>
            <Table
              caption={`${p.label} by stage`}
              head={
                <tr>
                  <th scope="col" className={th}>
                    Stage
                  </th>
                  <th scope="col" className={cn(th, "text-right")}>
                    Deals
                  </th>
                  <th scope="col" className={cn(th, "text-right")}>
                    Value
                  </th>
                  <th
                    scope="col"
                    className={cn(th, "hidden w-56 md:table-cell")}
                  >
                    <span className="sr-only">Naira value</span>
                  </th>
                </tr>
              }
            >
              {p.stages.map((s) => (
                <tr key={s.label}>
                  <th
                    scope="row"
                    className={cn(td, "text-ink text-left font-medium")}
                  >
                    {s.label}
                  </th>
                  <td className={cn(td, "text-right tabular-nums")}>
                    {s.count}
                  </td>
                  <td className={cn(td, "text-right tabular-nums")}>
                    {s.values.join(" + ") || "None"}
                  </td>
                  <td className={cn(td, "hidden md:table-cell")}>
                    <Bar value={s.ngnMinor} max={max} />
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        );
      })}

      <Card title="Won and lost by month">
        <Table
          caption="Deals won and lost by month"
          head={
            <tr>
              <th scope="col" className={th}>
                Month
              </th>
              <th scope="col" className={cn(th, "text-right")}>
                Won
              </th>
              <th scope="col" className={cn(th, "text-right")}>
                Lost
              </th>
              <th scope="col" className={cn(th, "text-right")}>
                Value won
              </th>
              <th scope="col" className={cn(th, "hidden w-56 md:table-cell")}>
                <span className="sr-only">Deals closed</span>
              </th>
            </tr>
          }
        >
          {r.months.map((m) => (
            <tr key={m.month}>
              <th
                scope="row"
                className={cn(td, "text-ink text-left font-medium")}
              >
                {m.label}
              </th>
              <td className={cn(td, "text-right tabular-nums")}>{m.won}</td>
              <td className={cn(td, "text-right tabular-nums")}>{m.lost}</td>
              <td className={cn(td, "text-right tabular-nums")}>
                {m.wonValue.join(" + ") || "None"}
              </td>
              <td className={cn(td, "hidden md:table-cell")}>
                <Bar value={m.won + m.lost} max={maxMonth} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Owner leaderboard">
        {r.leaderboard.length === 0 ? (
          <p className="text-sm text-slate-600">No deals yet.</p>
        ) : (
          <Table
            caption="Deals by owner"
            head={
              <tr>
                <th scope="col" className={th}>
                  Owner
                </th>
                <th scope="col" className={cn(th, "text-right")}>
                  Open
                </th>
                <th scope="col" className={cn(th, "text-right")}>
                  Won
                </th>
                <th scope="col" className={cn(th, "text-right")}>
                  Lost
                </th>
                <th scope="col" className={cn(th, "text-right")}>
                  Value won
                </th>
                <th
                  scope="col"
                  className={cn(th, "hidden text-right md:table-cell")}
                >
                  Open value
                </th>
              </tr>
            }
          >
            {r.leaderboard.map((o) => (
              <tr key={o.ownerId ?? "none"}>
                <th
                  scope="row"
                  className={cn(td, "text-ink text-left font-medium")}
                >
                  {o.name}
                </th>
                <td className={cn(td, "text-right tabular-nums")}>{o.open}</td>
                <td className={cn(td, "text-right tabular-nums")}>{o.won}</td>
                <td className={cn(td, "text-right tabular-nums")}>{o.lost}</td>
                <td className={cn(td, "text-right font-semibold tabular-nums")}>
                  {o.wonValue.join(" + ") || "None"}
                </td>
                <td
                  className={cn(
                    td,
                    "hidden text-right tabular-nums md:table-cell",
                  )}
                >
                  {o.openValue.join(" + ") || "None"}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

function Team({ rows }: { rows: TeamRow[] }) {
  return (
    <Card title="Last 30 days, by staff member">
      <p className="-mt-2 mb-4 text-sm text-slate-600">
        What each CRM staff member logged on contacts, companies and deals, and
        their tasks.
      </p>
      <Table
        caption="Team activity, last 30 days"
        head={
          <tr>
            <th scope="col" className={th}>
              Staff
            </th>
            <th scope="col" className={cn(th, "text-right")}>
              Notes
            </th>
            <th scope="col" className={cn(th, "text-right")}>
              Calls
            </th>
            <th scope="col" className={cn(th, "text-right")}>
              Meetings
            </th>
            <th scope="col" className={cn(th, "text-right")}>
              Emails
            </th>
            <th
              scope="col"
              className={cn(th, "hidden text-right md:table-cell")}
            >
              Other updates
            </th>
            <th scope="col" className={cn(th, "text-right")}>
              Tasks done
            </th>
            <th scope="col" className={cn(th, "text-right")}>
              Overdue
            </th>
          </tr>
        }
      >
        {rows.map((t) => (
          <tr key={t.memberId}>
            <th
              scope="row"
              className={cn(td, "text-ink text-left font-medium")}
            >
              {t.name}
            </th>
            <td className={cn(td, "text-right tabular-nums")}>{t.notes}</td>
            <td className={cn(td, "text-right tabular-nums")}>{t.calls}</td>
            <td className={cn(td, "text-right tabular-nums")}>{t.meetings}</td>
            <td className={cn(td, "text-right tabular-nums")}>{t.emails}</td>
            <td
              className={cn(td, "hidden text-right tabular-nums md:table-cell")}
            >
              {t.updates}
            </td>
            <td className={cn(td, "text-right tabular-nums")}>{t.tasksDone}</td>
            <td
              className={cn(
                td,
                "text-right tabular-nums",
                (t.tasksOverdue ?? 0) > 0 && "font-semibold text-rose-700",
              )}
            >
              {t.tasksOverdue ?? "–"}
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/reports");
  const { tab: raw } = await searchParams;
  const tab: ReportTab = raw === "sales" || raw === "team" ? raw : "leads";

  const content =
    tab === "leads" ? (
      <Leads r={await conversionReport()} />
    ) : tab === "sales" ? (
      <Sales r={await salesReport()} />
    ) : (
      <Team rows={await teamReport()} />
    );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
            Reports
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Where people come from, how sales are going, and what the team is
            working on.
          </p>
        </div>
        <ExportCsvButton
          action={exportReportCsv}
          args={tab}
          filename={`crm-report-${tab}.csv`}
          className="text-ink hover:border-brand-300 hover:bg-brand-50 inline-flex h-10 items-center gap-2 self-start rounded-lg border border-[#e4e0f0] bg-white px-3.5 text-sm font-semibold transition-colors disabled:opacity-50 sm:self-auto"
        />
      </div>

      <nav aria-label="Reports" className="-mx-4 mt-6 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-1 border-b border-[#ece9f5]">
          {TABS.map((t) => (
            <li key={t.id}>
              <Link
                href={
                  t.id === "leads" ? "/crm/reports" : `/crm/reports?tab=${t.id}`
                }
                aria-current={t.id === tab ? "page" : undefined}
                className={cn(
                  "-mb-px block border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                  t.id === tab
                    ? "border-brand-600 text-brand-700"
                    : "hover:text-ink border-transparent text-slate-500",
                )}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6">{content}</div>
    </div>
  );
}
