/** Small presentational pieces shared by CRM screens. Server-safe. */
import { cn } from "@/lib/utils";

export type AccountStatus = "active" | "pending" | "none";

export const ACCOUNT_CHIP: Record<
  AccountStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  },
  pending: {
    label: "Not activated",
    className: "bg-amber-50 text-amber-800 ring-amber-600/20",
  },
  none: {
    label: "No account",
    className: "bg-slate-100 text-slate-600 ring-slate-500/15",
  },
};

export const AUDIENCE_CHIP = {
  eten: "bg-brand-50 text-brand-700 ring-brand-600/15",
  customer: "bg-sky-50 text-sky-700 ring-sky-600/15",
} as const;

export const COMMUNITY_CHIP =
  "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/15";
export const COMPANY_TYPE_CHIP = {
  customer: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  prospect: "bg-sky-50 text-sky-700 ring-sky-600/15",
  partner: "bg-brand-50 text-brand-700 ring-brand-600/15",
  member_employer: "bg-slate-100 text-slate-600 ring-slate-500/15",
} as const;

export const REVIEW_CHIP = "bg-rose-50 text-rose-700 ring-rose-600/15";

export function Chip({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-2xl border border-[#ece9f5] bg-white p-5 shadow-[0_1px_2px_rgba(23,19,35,0.04)]",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-ink font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** A label and value row for detail lists. Empty values show a quiet dash. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const empty =
    children === null ||
    children === undefined ||
    children === false ||
    children === "" ||
    (Array.isArray(children) && children.length === 0);
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-ink min-w-0 break-words">
        {empty ? (
          <span className="text-slate-400">Not recorded</span>
        ) : (
          children
        )}
      </dd>
    </div>
  );
}
