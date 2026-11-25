import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Mail,
  Pencil,
  Phone,
  Settings2,
  Users,
} from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import { loadDashboard, type RecentActivity } from "@/lib/crm/dashboard";
import { ACTIVITY_LABEL, PRODUCT_LABEL, dateTime } from "@/lib/crm/labels";
import { Card } from "@/components/crm/ui";
import { StatTile } from "@/components/crm/stat-tile";
import { cn } from "@/lib/utils";
import { WeeklyChart } from "@/components/crm/weekly-chart";
import { CRM_SERIES } from "@/lib/crm/chart-colors";

export const metadata: Metadata = { title: "Dashboard" };

const fmt = (n: number) => n.toLocaleString("en-GB");

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Africa/Lagos",
    }).format(new Date()),
  );
  return hour < 12
    ? "Good morning"
    : hour < 17
      ? "Good afternoon"
      : "Good evening";
}

/** Signed change vs the previous 30 days; up is good for new contacts. */
function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0) {
    return <span>No contacts in the 30 days before</span>;
  }
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-semibold",
        up ? "text-emerald-700" : "text-rose-700",
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {up ? "+" : "−"}
      {Math.abs(pct)}%
      <span className="font-normal text-slate-500">
        {" "}
        vs the 30 days before ({fmt(before)})
      </span>
    </span>
  );
}

function Sources({ sources }: { sources: { label: string; count: number }[] }) {
  const max = Math.max(...sources.map((s) => s.count), 1);
  return (
    <ul className="space-y-3">
      {sources.map((s) => (
        <li key={s.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate text-slate-700">{s.label}</span>
            <span className="text-ink font-semibold tabular-nums">
              {fmt(s.count)}
            </span>
          </div>
          <div aria-hidden className="bg-brand-50 h-2 rounded-full">
            <div
              className="h-2 rounded-full bg-[#6426dc]"
              style={{ width: `${Math.max((s.count / max) * 100, 1)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const TYPE_ICON: Record<string, typeof FileText> = {
  note: FileText,
  call: Phone,
  meeting: Users,
  email: Mail,
  stage: Pencil,
};

function Recent({ items }: { items: RecentActivity[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Nothing yet. Notes, calls and updates that staff log on a contact will
        show here.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[#f1eef8]">
      {items.map((a) => {
        const Icon = TYPE_ICON[a.type] ?? Settings2;
        return (
          <li key={a.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <span
              aria-hidden
              className="bg-brand-50 text-brand-700 flex size-8 shrink-0 items-center justify-center rounded-full"
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span>
                  <span className="text-ink font-semibold">
                    {ACTIVITY_LABEL[a.type] ?? a.type}
                  </span>{" "}
                  <span className="text-slate-500">on</span>{" "}
                  {a.contactId ? (
                    <Link
                      href={`/crm/contacts/${a.contactId}`}
                      className="text-brand-700 font-semibold hover:underline"
                    >
                      {a.contactName}
                    </Link>
                  ) : (
                    a.contactName
                  )}
                </span>
                <time
                  dateTime={a.occurredAt}
                  className="text-xs text-slate-500"
                >
                  {dateTime(a.occurredAt)}
                </time>
              </p>
              {(a.subject || a.body) && (
                <p className="mt-0.5 line-clamp-2 text-slate-600">
                  {a.subject ?? a.body}
                </p>
              )}
              <p className="mt-0.5 text-xs text-slate-500">
                {a.actorName ? `By ${a.actorName}` : "Recorded automatically"}
                {a.product !== "crm" &&
                  ` · ${PRODUCT_LABEL[a.product] ?? a.product}`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default async function CrmDashboard() {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm");

  const d = await loadDashboard(session.member.id);
  const firstName = session.member.fullName?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
        {greeting()}
        {firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Here is what is happening across Expervia customers and the ETEN
        community.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile
          label="Contacts"
          value={d.total}
          href="/crm/contacts"
          detail={`${fmt(d.eten)} ETEN · ${fmt(d.customer)} customers`}
        />
        <StatTile
          label="New in the last 30 days"
          value={d.new30}
          detail={<Delta now={d.new30} before={d.newPrev30} />}
        />
        <StatTile
          label="Active platform accounts"
          value={d.active}
          href="/crm/contacts?account=active"
          detail={`${fmt(d.pending)} created and waiting to be activated · ${fmt(d.noAccount)} with no account`}
        />
        <StatTile
          label="Women in Tech"
          value={d.womenInTech}
          href="/crm/contacts?view=women-in-tech"
          detail="Joined through the Women in Tech page"
        />
        <StatTile
          label="Needs review"
          value={d.review}
          href="/crm/review"
          detail={
            d.review > 0 ? (
              <span className="inline-flex items-center gap-1 text-rose-700">
                <AlertTriangle aria-hidden className="size-3.5" />
                Phone matches another account
              </span>
            ) : (
              "Nothing waiting"
            )
          }
        />
        <StatTile
          label="Assigned to you"
          value={d.mine}
          detail="Contacts where you are the owner"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card title="New contacts per week">
          <p className="-mt-3 mb-4 text-xs text-slate-500">
            Last 12 weeks, by the date we first heard of each person. Members
            moved onto the platform in bulk are left out.
          </p>
          <WeeklyChart
            weeks={d.weeks}
            noun="new contacts"
            series={[
              { key: "eten", label: "ETEN", color: CRM_SERIES.brand },
              { key: "customer", label: "Customers", color: CRM_SERIES.second },
            ]}
          />
        </Card>
        <Card title="Where contacts come from">
          <Sources sources={d.sources} />
        </Card>
      </div>

      <Card
        title="Recent activity"
        className="mt-6"
        action={
          <Link
            href="/crm/contacts?sort=activity"
            className="text-brand-700 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            Recently active contacts
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        }
      >
        <Recent items={d.recent} />
      </Card>
    </div>
  );
}
