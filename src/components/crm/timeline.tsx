/** A CRM timeline (contact or company), newest first. Server-safe. */
import {
  CalendarClock,
  ClipboardList,
  FileText,
  Mail,
  Pencil,
  Phone,
  Settings2,
  Users,
} from "lucide-react";
import type { TimelineEntry } from "@/lib/crm/record";
import { ACTIVITY_LABEL, PRODUCT_LABEL, dateTime } from "@/lib/crm/labels";
import { Card } from "@/components/crm/ui";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, typeof FileText> = {
  note: FileText,
  call: Phone,
  meeting: Users,
  email: Mail,
  form: ClipboardList,
  stage: Pencil,
  task: CalendarClock,
};

const TYPE_TINT: Record<string, string> = {
  note: "bg-amber-50 text-amber-700",
  call: "bg-emerald-50 text-emerald-700",
  meeting: "bg-sky-50 text-sky-700",
  email: "bg-brand-50 text-brand-700",
  form: "bg-fuchsia-50 text-fuchsia-700",
  stage: "bg-slate-100 text-slate-600",
};

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <Card title="Timeline">
      {entries.length === 0 ? (
        <p className="text-sm text-slate-600">Nothing has been logged yet.</p>
      ) : (
        <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-px before:bg-[#ece9f5]">
          {entries.map((a) => {
            const Icon = TYPE_ICON[a.type] ?? Settings2;
            return (
              <li key={a.id} className="relative flex gap-4">
                <span
                  aria-hidden
                  className={cn(
                    "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                    TYPE_TINT[a.type] ?? "bg-slate-100 text-slate-600",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm">
                      <span className="text-ink font-semibold">
                        {ACTIVITY_LABEL[a.type] ?? a.type}
                      </span>
                      {a.product !== "crm" && (
                        <span className="text-slate-500">
                          {" "}
                          · {PRODUCT_LABEL[a.product] ?? a.product}
                        </span>
                      )}
                      {a.outcome && (
                        <span className="text-slate-500"> · {a.outcome}</span>
                      )}
                    </p>
                    <time
                      dateTime={a.occurredAt}
                      className="text-xs whitespace-nowrap text-slate-500"
                    >
                      {dateTime(a.occurredAt)}
                    </time>
                  </div>
                  {a.subject && (
                    <p className="text-ink mt-0.5 text-sm font-medium">
                      {a.subject}
                    </p>
                  )}
                  {a.body && (
                    <p className="mt-1 text-sm break-words whitespace-pre-line text-slate-700">
                      {a.body}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {a.actorName
                      ? `By ${a.actorName}`
                      : "Recorded automatically"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
