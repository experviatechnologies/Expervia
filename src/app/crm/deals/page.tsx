import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Columns3, Table2 } from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import { DealsNotReady, listDeals } from "@/lib/crm/deals";
import {
  PIPELINES,
  PIPELINE_IDS,
  isPipeline,
  type PipelineId,
} from "@/lib/crm/pipelines";
import { listOwners } from "@/lib/crm/record";
import { Card } from "@/components/crm/ui";
import { cn } from "@/lib/utils";
import { DealBoard } from "./deal-board";
import { NewDeal } from "./new-deal";

export const metadata: Metadata = { title: "Deals" };

function Figure({
  label,
  values,
  note,
}: {
  label: string;
  values: string[];
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#ece9f5] bg-white p-4 shadow-[0_1px_2px_rgba(23,19,35,0.04)]">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-ink mt-1 text-2xl font-semibold tracking-tight">
        {values.length ? values.join(" + ") : "₦0"}
      </p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string; view?: string }>;
}) {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/deals");

  const sp = await searchParams;
  const pipeline: PipelineId = isPipeline(sp.pipeline) ? sp.pipeline : "sales";
  const table = sp.view === "table";

  let result;
  try {
    result = await Promise.all([listDeals(pipeline), listOwners()]);
  } catch (e) {
    if (e instanceof DealsNotReady) {
      return (
        <div className="mx-auto max-w-3xl">
          <h1 className="text-ink text-2xl font-bold tracking-tight">Deals</h1>
          <Card className="mt-6">
            <p className="text-sm text-slate-700">
              Deals aren&apos;t set up yet. Run{" "}
              <code className="bg-brand-50 text-brand-800 rounded px-1.5 py-0.5">
                supabase/eten/68_crm_deals.sql
              </code>{" "}
              in the Supabase SQL Editor, then reload this page.
            </p>
          </Card>
        </div>
      );
    }
    throw e;
  }
  const [{ deals, summary }, owners] = result;
  const href = (p: PipelineId, t: boolean) =>
    `/crm/deals?${new URLSearchParams({ ...(p !== "sales" ? { pipeline: p } : {}), ...(t ? { view: "table" } : {}) })}`;

  return (
    <div className="mx-auto max-w-[96rem]">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
            Deals
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Sales opportunities and partnerships, from first conversation to
            signed.
          </p>
        </div>
        <NewDeal pipeline={pipeline} owners={owners} meId={session.member.id} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#ece9f5]">
        <nav aria-label="Pipelines" className="-mb-px flex gap-1">
          {PIPELINE_IDS.map((p) => (
            <Link
              key={p}
              href={href(p, table)}
              aria-current={p === pipeline ? "page" : undefined}
              className={cn(
                "border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                p === pipeline
                  ? "border-brand-600 text-brand-700"
                  : "hover:text-ink border-transparent text-slate-500",
              )}
            >
              {PIPELINES[p].label}
            </Link>
          ))}
        </nav>
        <div
          role="group"
          aria-label="Layout"
          className="mb-2 inline-flex rounded-lg border border-[#e4e0f0] bg-white p-0.5"
        >
          {[
            { t: false, label: "Board", Icon: Columns3 },
            { t: true, label: "Table", Icon: Table2 },
          ].map(({ t, label, Icon }) => (
            <Link
              key={label}
              href={href(pipeline, t)}
              aria-current={t === table ? "true" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                t === table
                  ? "bg-brand-700 text-white"
                  : "hover:text-ink text-slate-600",
              )}
            >
              <Icon aria-hidden className="size-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Figure
          label={`Open deals (${summary.open})`}
          values={summary.openValue}
          note="Total value still in play"
        />
        <Figure
          label="Weighted value"
          values={summary.weighted}
          note="Each deal's value × its stage's chance of winning"
        />
        <Figure label="Won so far" values={summary.wonValue} />
      </div>

      <div className="mt-6">
        {deals.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-slate-600">
              No deals in {PIPELINES[pipeline].label} yet. Use{" "}
              <span className="font-semibold">New deal</span> to add the first
              one.
            </p>
          </Card>
        ) : table ? (
          <div className="overflow-x-auto rounded-2xl border border-[#ece9f5] bg-white shadow-[0_1px_2px_rgba(23,19,35,0.04)]">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                {PIPELINES[pipeline].label} deals
              </caption>
              <thead className="border-b border-[#ece9f5] bg-[#fbfaff] text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-2.5">
                    Deal
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Stage
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Value
                  </th>
                  <th scope="col" className="hidden px-4 py-2.5 md:table-cell">
                    Company
                  </th>
                  <th scope="col" className="hidden px-4 py-2.5 lg:table-cell">
                    Owner
                  </th>
                  <th scope="col" className="hidden px-4 py-2.5 sm:table-cell">
                    Close date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1eef8]">
                {deals.map((d) => (
                  <tr key={d.id} className="hover:bg-[#fbfaff]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/deals/${d.id}`}
                        className="text-ink hover:text-brand-700 font-semibold hover:underline"
                      >
                        {d.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{d.stageLabel}</td>
                    <td className="text-ink px-4 py-3 text-right font-semibold tabular-nums">
                      {d.amountLabel}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                      {d.company?.name ?? ""}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">
                      {d.ownerName ?? ""}
                    </td>
                    <td
                      className={cn(
                        "hidden px-4 py-3 whitespace-nowrap sm:table-cell",
                        d.late
                          ? "font-semibold text-rose-700"
                          : "text-slate-600",
                      )}
                    >
                      {d.closeLabel ?? ""}
                      {d.late && (
                        <span className="sr-only"> (past close date)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <DealBoard
            key={deals.map((d) => d.id + d.stage).join()}
            pipeline={pipeline}
            deals={deals}
            columns={summary.columns}
          />
        )}
      </div>
    </div>
  );
}
