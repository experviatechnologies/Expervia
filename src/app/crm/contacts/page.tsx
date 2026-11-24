import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCrmSession } from "@/lib/crm/session";
import {
  CONTACT_VIEWS,
  contactViewCounts,
  listContacts,
  parseContactFilters,
  type AccountStatus,
  type ContactFilters as Filters,
  type ContactRow,
} from "@/lib/crm/contacts";
import {
  AUDIENCE_LABEL,
  COMMUNITY_LABEL,
  REVIEW_LABEL,
  VIEW_LABEL,
  fullName,
  initialsOf,
  shortDate,
} from "@/lib/crm/labels";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { ContactFilters } from "./contact-filters";
import { exportContactsCsv } from "./actions";

export const metadata: Metadata = { title: "Contacts" };

const PAGE_SIZE = 25;

type SearchParams = Record<string, string | string[] | undefined>;

/** URL for this list with some params changed (null removes one). */
function hrefWith(f: Filters, changes: Record<string, string | null>) {
  const p = new URLSearchParams();
  const base: Record<string, string> = {
    view: f.view === "all" ? "" : f.view,
    account: f.account === "any" ? "" : f.account,
    sort: f.sort === "newest" ? "" : f.sort,
    q: f.q,
  };
  for (const [k, v] of Object.entries({ ...base, ...changes })) {
    if (v) p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `/crm/contacts?${qs}` : "/crm/contacts";
}

const ACCOUNT_CHIP: Record<
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

function Chip({
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

function ContactCells({ c }: { c: ContactRow }) {
  const name = fullName(c.firstName, c.lastName);
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
            <p className="text-ink truncate font-semibold">{name}</p>
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
        <Chip
          className={
            c.audience === "eten"
              ? "bg-brand-50 text-brand-700 ring-brand-600/15"
              : "bg-sky-50 text-sky-700 ring-sky-600/15"
          }
        >
          {AUDIENCE_LABEL[c.audience]}
        </Chip>
      </td>
      <td className="px-4 py-3">
        <Chip className={account.className}>{account.label}</Chip>
      </td>
      <td className="hidden px-4 py-3 text-sm whitespace-nowrap text-slate-600 lg:table-cell">
        {c.source ?? ""}
        {c.company && (
          <p className="max-w-[14rem] truncate text-xs text-slate-500">
            {c.company}
          </p>
        )}
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {c.communities.map((k) => (
            <Chip
              key={k}
              className="bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/15"
            >
              {COMMUNITY_LABEL[k] ?? k}
            </Chip>
          ))}
          {c.reviewReason && (
            <Chip className="bg-rose-50 text-rose-700 ring-rose-600/15">
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

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Defence in depth: the layout gates too, but data never loads without this.
  const session = await getCrmSession();
  if (!session) redirect("/crm");

  const params = await searchParams;
  const filters = parseContactFilters(params);
  const pageParam = Array.isArray(params.page) ? params.page[0] : params.page;
  const requested = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const [counts, first] = await Promise.all([
    contactViewCounts(),
    listContacts(filters, requested, PAGE_SIZE),
  ]);
  const lastPage = Math.max(1, Math.ceil(first.total / PAGE_SIZE));
  // A page number past the end (e.g. after narrowing a search) shows the last.
  const page = Math.min(requested, lastPage);
  const { rows, total } =
    page === requested ? first : await listContacts(filters, page, PAGE_SIZE);

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const exportArgs = Object.fromEntries(
    Object.entries({
      view: filters.view,
      account: filters.account,
      sort: filters.sort,
      q: filters.q,
    }).filter(([, v]) => v),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
            Contacts
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Everyone across Expervia, Mentorship and the ETEN community, with or
            without a platform account.
          </p>
        </div>
        <ExportCsvButton
          action={exportContactsCsv}
          args={exportArgs}
          filename={`crm-contacts-${filters.view}.csv`}
          className="text-ink hover:border-brand-300 hover:bg-brand-50 inline-flex h-10 items-center gap-2 self-start rounded-lg border border-[#e4e0f0] bg-white px-3.5 text-sm font-semibold transition-colors disabled:opacity-50 sm:self-auto"
        />
      </div>

      <nav
        aria-label="Contact views"
        className="-mx-4 mt-6 overflow-x-auto px-4"
      >
        <ul className="flex min-w-max gap-1 border-b border-[#ece9f5]">
          {CONTACT_VIEWS.map((v) => {
            const active = filters.view === v;
            return (
              <li key={v}>
                <Link
                  href={hrefWith(filters, { view: v === "all" ? null : v })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "border-brand-600 text-brand-700"
                      : "hover:text-ink border-transparent text-slate-500",
                  )}
                >
                  {VIEW_LABEL[v]}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs tabular-nums",
                      active
                        ? "bg-brand-100 text-brand-800"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {counts[v]?.toLocaleString("en-GB") ?? "–"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-5">
        <Suspense>
          <ContactFilters />
        </Suspense>
      </div>

      <section
        aria-label="Contacts list"
        className="mt-5 overflow-hidden rounded-2xl border border-[#ece9f5] bg-white shadow-[0_1px_2px_rgba(23,19,35,0.04)]"
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="bg-brand-50 text-brand-700 flex size-12 items-center justify-center rounded-full">
              <Users aria-hidden className="size-6" />
            </span>
            <h2 className="text-ink mt-4 font-semibold">No contacts found</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-600">
              Nothing matches these filters. Try a different search or view.
            </p>
            <Link
              href="/crm/contacts"
              className="text-brand-700 mt-4 text-sm font-semibold hover:underline"
            >
              Clear all filters
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">
                {VIEW_LABEL[filters.view]}, {from} to {to} of {total}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1eef8]">
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className="transition-colors hover:bg-[#fbfaff]"
                  >
                    <ContactCells c={c} />
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
                href={hrefWith(filters, { page: String(page - 1) })}
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
                href={hrefWith(filters, { page: String(page + 1) })}
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
    </div>
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
