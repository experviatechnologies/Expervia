import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Building2 } from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import {
  COMPANY_VIEWS,
  companyTypeCounts,
  listCompanies,
  parseCompanyFilters,
  type CompanyFilters as Filters,
} from "@/lib/crm/companies";
import { listOwners } from "@/lib/crm/record";
import {
  COMPANY_TYPE_LABEL,
  COMPANY_VIEW_LABEL,
  shortDate,
} from "@/lib/crm/labels";
import { COMPANY_TYPE_CHIP, Chip } from "@/components/crm/ui";
import { cn } from "@/lib/utils";
import { AddCompany } from "./add-company";
import { CompanyFilters } from "./company-filters";

export const metadata: Metadata = { title: "Companies" };

type SearchParams = Record<string, string | string[] | undefined>;

function hrefWith(f: Filters, changes: Record<string, string | null>) {
  const p = new URLSearchParams();
  const base: Record<string, string> = {
    view: f.view === "all" ? "" : f.view,
    sort: f.sort === "name" ? "" : f.sort,
    q: f.q,
  };
  for (const [k, v] of Object.entries({ ...base, ...changes })) {
    if (v) p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `/crm/companies?${qs}` : "/crm/companies";
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/companies");

  const filters = parseCompanyFilters(await searchParams);
  const [counts, rows, owners] = await Promise.all([
    companyTypeCounts(),
    listCompanies(filters),
    listOwners(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
            Companies
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Customers, prospects, partners and the employers of our members.
          </p>
        </div>
        <AddCompany owners={owners} />
      </div>

      <nav
        aria-label="Company types"
        className="-mx-4 mt-6 overflow-x-auto px-4"
      >
        <ul className="flex min-w-max gap-1 border-b border-[#ece9f5]">
          {COMPANY_VIEWS.map((v) => {
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
                  {COMPANY_VIEW_LABEL[v]}
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
          <CompanyFilters />
        </Suspense>
      </div>

      <section
        aria-label="Companies list"
        className="mt-5 overflow-hidden rounded-2xl border border-[#ece9f5] bg-white shadow-[0_1px_2px_rgba(23,19,35,0.04)]"
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="bg-brand-50 text-brand-700 flex size-12 items-center justify-center rounded-full">
              <Building2 aria-hidden className="size-6" />
            </span>
            <h2 className="text-ink mt-4 font-semibold">No companies found</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-600">
              Try a different search or type, or add the company.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">
                {COMPANY_VIEW_LABEL[filters.view]}, {rows.length} shown
              </caption>
              <thead className="border-b border-[#ece9f5] bg-[#fbfaff] text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-2.5">
                    Company
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Type
                  </th>
                  <th scope="col" className="hidden px-4 py-2.5 md:table-cell">
                    Industry
                  </th>
                  <th scope="col" className="hidden px-4 py-2.5 lg:table-cell">
                    Location
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Contacts
                  </th>
                  <th scope="col" className="hidden px-4 py-2.5 xl:table-cell">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1eef8]">
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className="transition-colors hover:bg-[#fbfaff]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="bg-brand-50 text-brand-700 flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/crm/companies/${c.id}`}
                            className="text-ink hover:text-brand-700 block max-w-[18rem] truncate font-semibold hover:underline"
                          >
                            {c.name}
                          </Link>
                          {c.domain && (
                            <p className="truncate text-xs text-slate-500">
                              {c.domain}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Chip className={COMPANY_TYPE_CHIP[c.type]}>
                        {COMPANY_TYPE_LABEL[c.type]}
                      </Chip>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                      {c.industry ?? (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-slate-600 lg:table-cell">
                      {[c.city, c.country].filter(Boolean).join(", ") || (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="text-ink px-4 py-3 text-right text-sm font-semibold tabular-nums">
                      {c.contacts}
                    </td>
                    <td className="hidden px-4 py-3 text-sm whitespace-nowrap text-slate-600 xl:table-cell">
                      {shortDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
