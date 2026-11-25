import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import { loadWomenInTech, type WitMember } from "@/lib/crm/women-in-tech";
import { shortDate } from "@/lib/crm/labels";
import { ACCOUNT_CHIP, Card, Chip } from "@/components/crm/ui";
import { StatTile } from "@/components/crm/stat-tile";
import { WeeklyChart } from "@/components/crm/weekly-chart";
import { CRM_SERIES } from "@/lib/crm/chart-colors";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { exportContactsCsv } from "../contacts/actions";
import { mainSiteUrl } from "@/lib/crm/host";

export const metadata: Metadata = { title: "Women in Tech" };

function Breakdown({
  items,
  empty,
}: {
  items: { label: string; count: number }[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-600">{empty}</p>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate text-slate-700">{i.label}</span>
            <span className="text-ink font-semibold tabular-nums">
              {i.count}
            </span>
          </div>
          <div aria-hidden className="bg-brand-50 h-2 rounded-full">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.max((i.count / max) * 100, 2)}%`,
                background: CRM_SERIES.brand,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MemberTable({ members }: { members: WitMember[] }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full text-left">
        <caption className="sr-only">Women in Tech members</caption>
        <thead className="border-y border-[#ece9f5] bg-[#fbfaff] text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <tr>
            <th scope="col" className="px-5 py-2.5">
              Member
            </th>
            <th scope="col" className="px-5 py-2.5">
              Account
            </th>
            <th scope="col" className="hidden px-5 py-2.5 md:table-cell">
              Pods
            </th>
            <th scope="col" className="hidden px-5 py-2.5 lg:table-cell">
              Location
            </th>
            <th scope="col" className="hidden px-5 py-2.5 sm:table-cell">
              Joined
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1eef8]">
          {members.map((m) => (
            <tr key={m.contactId} className="hover:bg-[#fbfaff]">
              <td className="px-5 py-3">
                <Link
                  href={`/crm/contacts/${m.contactId}`}
                  className="text-ink hover:text-brand-700 font-semibold hover:underline"
                >
                  {m.name}
                </Link>
                <p className="max-w-[16rem] truncate text-xs text-slate-500">
                  {m.email ?? "No email"}
                </p>
              </td>
              <td className="px-5 py-3">
                <Chip className={ACCOUNT_CHIP[m.account].className}>
                  {ACCOUNT_CHIP[m.account].label}
                </Chip>
              </td>
              <td className="hidden max-w-[18rem] px-5 py-3 text-sm text-slate-600 md:table-cell">
                {m.pods.length > 0 ? (
                  m.pods.join(", ")
                ) : (
                  <span className="text-slate-400">None yet</span>
                )}
              </td>
              <td className="hidden px-5 py-3 text-sm text-slate-600 lg:table-cell">
                {m.location ?? (
                  <span className="text-slate-400">Not recorded</span>
                )}
              </td>
              <td className="hidden px-5 py-3 text-sm whitespace-nowrap text-slate-600 sm:table-cell">
                {shortDate(m.joinedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function WomenInTechPage() {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/women-in-tech");

  const w = await loadWomenInTech();
  const total = w.members.length;
  const activatedPct = total ? Math.round((w.activated / total) * 100) : 0;
  const inPods = w.members.filter((m) => m.pods.length > 0).length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
            Women in Tech
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Everyone who joined through the{" "}
            <Link
              href={mainSiteUrl(`/women-in-tech`)}
              className="text-brand-700 font-semibold hover:underline"
            >
              Women in Tech page
            </Link>
            , how they are taking part, and the women already in the CRM who
            could be invited.
          </p>
        </div>
        <ExportCsvButton
          action={exportContactsCsv}
          args={{ view: "women-in-tech" }}
          filename="crm-women-in-tech.csv"
          label="Export members"
          className="text-ink hover:border-brand-300 hover:bg-brand-50 inline-flex h-10 items-center gap-2 self-start rounded-lg border border-[#e4e0f0] bg-white px-3.5 text-sm font-semibold transition-colors disabled:opacity-50 sm:self-auto"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Members"
          value={total}
          href="/crm/contacts?view=women-in-tech"
          detail={`${w.new30} joined in the last 30 days`}
        />
        <StatTile
          label="Activated their account"
          value={w.activated}
          detail={`${activatedPct}% of members · ${total - w.activated} not yet`}
        />
        <StatTile
          label="In a specialist pod"
          value={inPods}
          detail={
            w.mentors + w.mentees > 0
              ? `${w.mentors} mentors · ${w.mentees} mentees`
              : "None in mentorship yet"
          }
        />
        <StatTile
          label="Women to invite"
          value={w.outreachTotal}
          href="/crm/contacts?gender=female"
          detail="In the CRM but not in Women in Tech"
        />
      </div>

      <Card
        title={`Contributor enquiries (${w.enquiriesTotal})`}
        className="mt-6"
      >
        <p className="-mt-2 mb-3 text-sm text-slate-600">
          People who offered to mentor, speak, lead or help through the Women in
          Tech page. Each one gets a follow-up task. Page visits and conversion
          rate come from website analytics.
        </p>
        {w.enquiries.length === 0 ? (
          <p className="text-sm text-slate-600">No enquiries yet.</p>
        ) : (
          <ul className="divide-y divide-[#f1eef8]">
            {w.enquiries.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div className="min-w-0">
                  {e.contactId ? (
                    <Link
                      href={`/crm/contacts/${e.contactId}`}
                      className="text-ink hover:text-brand-700 font-semibold hover:underline"
                    >
                      {e.name}
                    </Link>
                  ) : (
                    <span className="text-ink font-semibold">{e.name}</span>
                  )}
                  <p className="text-xs text-slate-500">
                    {e.offer || "Contributor"}
                    {e.email ? ` · ${e.email}` : ""}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {shortDate(e.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card title="New members per week">
          <WeeklyChart
            weeks={w.weeks}
            noun="new members"
            series={[
              { key: "count", label: "New members", color: CRM_SERIES.brand },
            ]}
          />
        </Card>
        <div className="space-y-6">
          <Card title="Where they are">
            <Breakdown items={w.locations} empty="No locations recorded yet." />
          </Card>
          <Card title="Pods they joined">
            <Breakdown items={w.pods} empty="Nobody has joined a pod yet." />
          </Card>
        </div>
      </div>

      <Card title={`Members (${total})`} className="mt-6">
        {total === 0 ? (
          <p className="text-sm text-slate-600">Nobody has joined yet.</p>
        ) : (
          <MemberTable members={w.members} />
        )}
      </Card>

      <Card
        title="Women to invite"
        className="mt-6"
        action={
          w.outreachTotal > w.outreach.length ? (
            <Link
              href="/crm/contacts?gender=female"
              className="text-brand-700 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
            >
              All women in the CRM
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          ) : null
        }
      >
        <p className="-mt-2 mb-3 text-sm text-slate-600">
          Women already in the CRM (from lead forms and the registry) who have
          not joined Women in Tech. Only contacts with a recorded gender are
          included.
        </p>
        {w.outreach.length === 0 ? (
          <p className="text-sm text-slate-600">Nobody to invite right now.</p>
        ) : (
          <ul className="divide-y divide-[#f1eef8]">
            {w.outreach.map((o) => (
              <li
                key={o.contactId}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/crm/contacts/${o.contactId}`}
                    className="text-ink hover:text-brand-700 font-semibold hover:underline"
                  >
                    {o.name}
                  </Link>
                  <p className="truncate text-xs text-slate-500">
                    {o.email ?? "No email"}
                  </p>
                </div>
                <span className="text-xs text-slate-500">{o.source}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
