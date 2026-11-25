import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCrmSession } from "@/lib/crm/session";
import {
  CONTACT_VIEWS,
  SAVED_FILTER_KEYS,
  contactViewCounts,
  filtersToParams,
  listContacts,
  parseContactFilters,
  type ContactFilters as Filters,
} from "@/lib/crm/contacts";
import { describeFilters } from "@/lib/crm/lists";
import { listOwners } from "@/lib/crm/record";
import { LEAD_STATUS_LABEL, VIEW_LABEL } from "@/lib/crm/labels";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { ContactsTable } from "@/components/crm/contacts-table";
import { ContactFilters } from "./contact-filters";
import { SaveAsList } from "./save-as-list";
import { exportContactsCsv } from "./actions";

export const metadata: Metadata = { title: "Contacts" };

const PAGE_SIZE = 25;

type SearchParams = Record<string, string | string[] | undefined>;

/** URL for this list with some params changed (null removes one). */
function hrefWith(f: Filters, changes: Record<string, string | null>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...filtersToParams(f), ...changes })) {
    if (v) p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `/crm/contacts?${qs}` : "/crm/contacts";
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

  const [counts, first, owners] = await Promise.all([
    contactViewCounts(),
    listContacts(filters, requested, PAGE_SIZE),
    listOwners(),
  ]);
  const lastPage = Math.max(1, Math.ceil(first.total / PAGE_SIZE));
  // A page number past the end (e.g. after narrowing a search) shows the last.
  const page = Math.min(requested, lastPage);
  const { rows, total } =
    page === requested ? first : await listContacts(filters, page, PAGE_SIZE);

  const saved = filtersToParams(filters, SAVED_FILTER_KEYS);
  const ownerName = (id: string) =>
    id === "none"
      ? "No owner"
      : (owners.find((o) => o.id === id)?.name ?? "Former staff member");

  // Filters set from links (not the bar above the table) show as chips.
  const chips: { label: string; clear: string }[] = [
    filters.gender !== "any" && {
      label: filters.gender === "female" ? "Women" : "Men",
      clear: "gender",
    },
    filters.leadStatus !== "any" && {
      label: `Lead status: ${LEAD_STATUS_LABEL[filters.leadStatus]}`,
      clear: "leadStatus",
    },
    filters.source && { label: `Source: ${filters.source}`, clear: "source" },
    filters.tag && { label: `Tag: ${filters.tag}`, clear: "tag" },
    filters.owner && {
      label: `Owner: ${ownerName(filters.owner)}`,
      clear: "owner",
    },
  ].filter(Boolean) as { label: string; clear: string }[];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
            Contacts
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Everyone across Expervia, Mentorship and the ETEN community, with or
            without a platform account.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <ExportCsvButton
            action={exportContactsCsv}
            args={filtersToParams(filters)}
            filename={`crm-contacts-${filters.view}.csv`}
            className="text-ink hover:border-brand-300 hover:bg-brand-50 inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4e0f0] bg-white px-3.5 text-sm font-semibold transition-colors disabled:opacity-50"
          />
          <SaveAsList
            filters={saved}
            summary={describeFilters(filters, owners).join(" · ")}
          />
        </div>
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
                  href={hrefWith(filters, {
                    view: v === "all" ? null : v,
                    page: null,
                  })}
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

      {chips.length > 0 && (
        <ul
          aria-label="Other filters"
          className="mt-3 flex flex-wrap items-center gap-2 text-sm"
        >
          {chips.map((c) => (
            <li key={c.clear}>
              <Link
                href={hrefWith(filters, { [c.clear]: null, page: null })}
                className="bg-brand-50 text-brand-800 hover:bg-brand-100 inline-flex items-center gap-1 rounded-full py-1 pr-2 pl-3 font-semibold"
                aria-label={`Remove filter ${c.label}`}
              >
                {c.label}
                <X aria-hidden className="size-3.5" />
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/crm/contacts"
              className="hover:text-brand-700 font-semibold text-slate-600 hover:underline"
            >
              Clear all filters
            </Link>
          </li>
        </ul>
      )}

      <div className="mt-5">
        <ContactsTable
          rows={rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          caption={VIEW_LABEL[filters.view]}
          pageHref={(p) => hrefWith(filters, { page: String(p) })}
          empty={{
            title: "No contacts found",
            text: "Nothing matches these filters. Try a different search or view.",
            action: (
              <Link
                href="/crm/contacts"
                className="text-brand-700 text-sm font-semibold hover:underline"
              >
                Clear all filters
              </Link>
            ),
          }}
        />
      </div>
    </div>
  );
}
