/** A record's deals (contact or company), linking to each deal. Server-safe. */
import Link from "next/link";
import type { DealRow } from "@/lib/crm/deals";
import { PIPELINES } from "@/lib/crm/pipelines";
import { Card } from "@/components/crm/ui";

export function DealsCard({
  deals,
  empty,
}: {
  deals: DealRow[];
  empty: string;
}) {
  return (
    <Card
      title="Deals"
      action={
        <Link
          href="/crm/deals"
          className="text-brand-700 text-sm font-semibold hover:underline"
        >
          All deals
        </Link>
      }
    >
      {deals.length === 0 ? (
        <p className="text-sm text-slate-600">{empty}</p>
      ) : (
        <ul className="divide-y divide-[#f1eef8]">
          {deals.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <Link
                  href={`/crm/deals/${d.id}`}
                  className="text-ink hover:text-brand-700 font-semibold hover:underline"
                >
                  {d.name}
                </Link>
                <p className="text-xs text-slate-500">
                  {PIPELINES[d.pipeline].label} · {d.stageLabel}
                </p>
              </div>
              <span className="text-ink text-sm font-semibold tabular-nums">
                {d.amountMinor > 0 ? d.amountLabel : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
