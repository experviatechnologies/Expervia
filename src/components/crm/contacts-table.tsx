/**
 * The contacts table used by the Contacts list and by list pages: columns,
 * empty state and pagination. Server component. A row's source links to the
 * contacts list filtered by that source.
 */
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { ContactRow } from "@/lib/crm/contacts";
import {
  AUDIENCE_LABEL,
  COMMUNITY_LABEL,
  REVIEW_LABEL,
  fullName,
  initialsOf,
  shortDate,
} from "@/lib/crm/labels";
import {
  ACCOUNT_CHIP,
  AUDIENCE_CHIP,
  COMMUNITY_CHIP,
  REVIEW_CHIP,
  Chip,
} from "@/components/crm/ui";
import { cn } from "@/lib/utils";

function ContactCells({ c }: { c: ContactRow }) {
  const account = ACCOUNT_CHIP[c.account];
  return (
    <>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="bg-brand-50 text-brand-700 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          >
            {initialsOf(c.firstName, c.lastName)}
          </span>
          <div className="min-w-0">
            <Link
              href={`/crm/contacts/${c.id}`}
              className="text-ink hover:text-brand-700 block truncate font-semibold hover:underline focus-visible:underline"
            >
              {fullName(c.firstName, c.lastName)}
            </Link>
            <p className="truncate text-xs text-slate-500">
              {c.email ?? "No email"}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-sm whitespace-nowrap text-slate-600 md:table-cell">
        {c.phone ?? <span className="text-slate-400">None</span>}
      </td>
      <td className="px-4 py-3">
        <Chip className={AUDIENCE_CHIP[c.audience]}>
          {AUDIENCE_LABEL[c.audience]}
        </Chip>
      </td>
      <td className="px-4 py-3">
        <Chip className={account.className}>{account.label}</Chip>
      </td>
      <td className="hidden px-4 py-3 text-sm whitespace-nowrap text-slate-600 lg:table-cell">
        {c.source && (
          <Link
            href={`/crm/contacts?source=${encodeURIComponent(c.source)}`}
            className="hover:text-brand-700 hover:underline"
            title={`Show everyone from ${c.source}`}
          >
            {c.source}
          </Link>
        )}
        {c.company && (
          <p className="max-w-[14rem] truncate text-xs text-slate-500">
            {c.company}
          </p>
        )}
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {c.communities.map((k) => (
            <Chip key={k} className={COMMUNITY_CHIP}>
              {COMMUNITY_LABEL[k] ?? k}
            </Chip>
          ))}
          {c.reviewReason && (
            <Chip className={REVIEW_CHIP}>
              <AlertTriangle aria-hidden className="size-3" />
              {REVIEW_LABEL[c.reviewReason] ?? "Needs review"}
            </Chip>
          )}
        </div>
      </td>
      <td className="hidden px-4 py-3 text-sm whitespace-nowrap text-slate-600 xl:table-cell">
        {shortDate(c.firstSeenAt)}
      </td>
    </>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex h-9 items-center gap-1 rounded-lg border border-[#e4e0f0] bg-white px-3 font-semibold";
  if (disabled) {
    return (
      <span aria-disabled className={cn(className, "text-slate-300")}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        className,
        "text-ink hover:border-brand-300 hover:bg-brand-50 transition-colors",
      )}
    >
      {children}
    </Link>
  );
}

export function ContactsTable({
  rows,
  total,
  page,
  pageSize,
  caption,
  pageHref,
  empty,
  rowAction,
  actionLabel,
}: {
  rows: ContactRow[];
  total: number;
  page: number;
  pageSize: number;
  caption: string;
  pageHref: (page: number) => string;
  empty: { title: string; text: string; action?: React.ReactNode };
  /** Optional extra cell per row (e.g. "Remove from list"). */
  rowAction?: (c: ContactRow) => React.ReactNode;
  actionLabel?: string;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <section
      aria-label="Contacts"
      className="overflow-hidden rounded-2xl border border-[#ece9f5] bg-white shadow-[0_1px_2px_rgba(23,19,35,0.04)]"
    >
      {rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="bg-brand-50 text-brand-700 flex size-12 items-center justify-center rounded-full">
            <Users aria-hidden className="size-6" />
          </span>
          <h2 className="text-ink mt-4 font-semibold">{empty.title}</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-600">{empty.text}</p>
          {empty.action && <div className="mt-4">{empty.action}</div>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">
              {caption}, {from} to {to} of {total}
            </caption>
            <thead className="border-b border-[#ece9f5] bg-[#fbfaff] text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-4 py-2.5">
                  Contact
                </th>
                <th scope="col" className="hidden px-4 py-2.5 md:table-cell">
                  Phone
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Audience
                </th>
                <th scope="col" className="px-4 py-2.5">
                  Account
                </th>
                <th scope="col" className="hidden px-4 py-2.5 lg:table-cell">
                  Source
                </th>
                <th scope="col" className="hidden px-4 py-2.5 lg:table-cell">
                  Communities and flags
                </th>
                <th scope="col" className="hidden px-4 py-2.5 xl:table-cell">
                  First seen
                </th>
                {rowAction && (
                  <th scope="col" className="px-4 py-2.5">
                    <span className="sr-only">{actionLabel ?? "Actions"}</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eef8]">
              {rows.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-[#fbfaff]">
                  <ContactCells c={c} />
                  {rowAction && (
                    <td className="px-4 py-3 text-right">{rowAction(c)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="flex flex-col gap-3 border-t border-[#ece9f5] px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing <span className="text-ink font-semibold">{from}</span> to{" "}
            <span className="text-ink font-semibold">{to}</span> of{" "}
            <span className="text-ink font-semibold">
              {total.toLocaleString("en-GB")}
            </span>
          </p>
          <nav aria-label="Pages" className="flex items-center gap-2">
            <PageLink
              href={pageHref(page - 1)}
              disabled={page <= 1}
              label="Previous page"
            >
              <ChevronLeft aria-hidden className="size-4" />
              Previous
            </PageLink>
            <span className="tabular-nums">
              Page {page} of {lastPage}
            </span>
            <PageLink
              href={pageHref(page + 1)}
              disabled={page >= lastPage}
              label="Next page"
            >
              Next
              <ChevronRight aria-hidden className="size-4" />
            </PageLink>
          </nav>
        </div>
      )}
    </section>
  );
}
