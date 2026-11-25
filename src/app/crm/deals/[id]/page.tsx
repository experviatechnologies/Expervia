import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, User } from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import { DealsNotReady, getDeal } from "@/lib/crm/deals";
import { PIPELINES } from "@/lib/crm/pipelines";
import { listOwners } from "@/lib/crm/record";
import { shortDate } from "@/lib/crm/labels";
import { Card } from "@/components/crm/ui";
import { LogActivity } from "@/components/crm/log-activity";
import { Timeline } from "@/components/crm/timeline";
import { DealForm } from "../deal-form";
import { StageBar } from "./stage-bar";

export const metadata: Metadata = { title: "Deal" };

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/deals");

  const { id } = await params;
  let deal;
  try {
    deal = await getDeal(id);
  } catch (e) {
    if (e instanceof DealsNotReady) redirect("/crm/deals");
    throw e;
  }
  if (!deal) notFound();
  const owners = await listOwners();
  const pipeline = PIPELINES[deal.pipeline];

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href={
          deal.pipeline === "sales"
            ? "/crm/deals"
            : `/crm/deals?pipeline=${deal.pipeline}`
        }
        className="hover:text-brand-700 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {pipeline.label}
      </Link>

      <header className="mt-4 rounded-2xl border border-[#ece9f5] bg-white p-5 shadow-[0_1px_2px_rgba(23,19,35,0.04)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {pipeline.label}
            </p>
            <h1 className="text-ink mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              {deal.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              {deal.company && (
                <Link
                  href={`/crm/companies/${deal.company.id}`}
                  className="text-brand-700 inline-flex items-center gap-1.5 font-semibold hover:underline"
                >
                  <Building2 aria-hidden className="size-4" />
                  {deal.company.name}
                </Link>
              )}
              {deal.contact && (
                <Link
                  href={`/crm/contacts/${deal.contact.id}`}
                  className="text-brand-700 inline-flex items-center gap-1.5 font-semibold hover:underline"
                >
                  <User aria-hidden className="size-4" />
                  {deal.contact.name}
                </Link>
              )}
              {deal.ownerName && <span>Owner: {deal.ownerName}</span>}
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-ink text-3xl font-semibold tracking-tight">
              {deal.amountLabel}
            </p>
            <p
              className={
                deal.late
                  ? "text-sm font-semibold text-rose-700"
                  : "text-sm text-slate-600"
              }
            >
              {deal.closedAt
                ? `Closed ${shortDate(deal.closedAt)}`
                : deal.closeLabel
                  ? `${deal.late ? "Past close date: " : "Expected to close "}${deal.closeLabel}`
                  : "No close date"}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <StageBar
            dealId={deal.id}
            pipeline={deal.pipeline}
            stage={deal.stage}
          />
        </div>
        {deal.lostReason && (
          <p className="mt-3 text-sm text-slate-700">
            <span className="font-semibold">Reason lost:</span>{" "}
            {deal.lostReason}
          </p>
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[28rem_minmax(0,1fr)]">
        <Card title="Deal details">
          <DealForm
            dealId={deal.id}
            owners={owners}
            initial={{
              name: deal.name,
              pipeline: deal.pipeline,
              stage: deal.stage,
              amount: deal.amountMinor ? String(deal.amountMinor / 100) : "",
              currency: deal.currency,
              closeDate: deal.closeDate ?? "",
              priority: deal.priority,
              product: deal.product ?? "",
              notes: deal.notes ?? "",
              ownerId: deal.ownerId,
              contact: deal.contact
                ? { id: deal.contact.id, label: deal.contact.name }
                : null,
              company: deal.company
                ? { id: deal.company.id, label: deal.company.name }
                : null,
            }}
          />
        </Card>
        <div className="space-y-6">
          <Card title="Log activity">
            <LogActivity target={{ kind: "deal", id: deal.id }} />
          </Card>
          <Timeline entries={deal.timeline} />
        </div>
      </div>
    </div>
  );
}
