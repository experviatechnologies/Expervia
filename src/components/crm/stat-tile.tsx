/** A headline number with a label and optional detail; a link when href is set. */
import Link from "next/link";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("en-GB");

export function StatTile({
  label,
  value,
  detail,
  href,
  children,
}: {
  label: string;
  value: number;
  detail?: React.ReactNode;
  href?: string;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-ink mt-1 text-3xl font-semibold tracking-tight">
        {fmt(value)}
      </p>
      {detail && <div className="mt-1 text-xs text-slate-500">{detail}</div>}
      {children}
    </>
  );
  const className =
    "block rounded-2xl border border-[#ece9f5] bg-white p-5 shadow-[0_1px_2px_rgba(23,19,35,0.04)]";
  return href ? (
    <Link
      href={href}
      className={cn(
        className,
        "hover:border-brand-300 focus-visible:outline-brand-400 transition-colors focus-visible:outline-2",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
