import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExternalLink, FileDown, Inbox, Search } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { getSupabaseAdmin, APPLICATIONS_TABLE } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Community Applications",
  robots: { index: false, follow: false },
};

type ApplicationRow = {
  id: string;
  vendor: "huawei" | "microsoft";
  full_name: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  location: string | null;
  solution_area: string | null;
  certifications: string | null;
  availability: string | null;
  resume_path: string | null;
  created_at: string;
};

const VENDORS = [
  { key: "all", label: "All" },
  { key: "huawei", label: "Huawei" },
  { key: "microsoft", label: "Microsoft" },
] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ vendor?: string; q?: string }>;
}) {
  // Defence-in-depth: the proxy already guards /admin, but every protected
  // page verifies the session itself so data can never leak via a matcher gap.
  const manager = await getCurrentManager();
  if (!manager) {
    redirect("/admin/login");
  }

  const { vendor, q } = await searchParams;
  const activeVendor =
    vendor === "huawei" || vendor === "microsoft" ? vendor : "all";
  const search = (q ?? "").trim();

  // Session verified above — now read with the service_role client.
  let query = getSupabaseAdmin()
    .from(APPLICATIONS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (activeVendor !== "all") {
    query = query.eq("vendor", activeVendor);
  }
  if (search) {
    const safe = search.replace(/[%,]/g, " ");
    query = query.or(
      `full_name.ilike.%${safe}%,email.ilike.%${safe}%,location.ilike.%${safe}%`,
    );
  }

  const { data, error } = await query;
  const rows = (data ?? []) as ApplicationRow[];

  const hrefFor = (v: string) => {
    const p = new URLSearchParams();
    if (v !== "all") p.set("vendor", v);
    if (search) p.set("q", search);
    const qs = p.toString();
    return qs ? `?${qs}` : "/admin/applications";
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 py-7 md:px-8">
      {/* Page heading */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
            Community applications
          </h1>
          <p className="text-eten-ink-muted mt-1.5 text-[15px]">
            <b className="text-eten-ink">{rows.length}</b> application
            {rows.length === 1 ? "" : "s"}
            {activeVendor !== "all" ? ` · ${activeVendor}` : ""} · signed in as{" "}
            {manager.email}
          </p>
        </div>
      </header>

      {/* Table card */}
      <section className="bg-eten-panel border-eten-line flex min-w-0 flex-col rounded-[18px] border">
        {/* Toolbar */}
        <div className="border-eten-line flex flex-wrap items-center gap-3 border-b p-4 sm:px-5">
          <div
            role="group"
            aria-label="Filter by track"
            className="bg-eten-panel-hi flex gap-1 rounded-xl p-1"
          >
            {VENDORS.map(({ key, label }) => {
              const active = key === activeVendor;
              return (
                <a
                  key={key}
                  href={hrefFor(key)}
                  aria-current={active ? "true" : undefined}
                  className={
                    "rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-colors " +
                    (active
                      ? "bg-eten-panel text-eten-ink shadow-sm"
                      : "text-eten-ink-muted hover:text-eten-ink")
                  }
                >
                  {label}
                </a>
              );
            })}
          </div>

          <form
            method="get"
            className="border-eten-line bg-eten-panel-hi text-eten-faint flex h-11 max-w-[380px] min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3.5"
          >
            {activeVendor !== "all" && (
              <input type="hidden" name="vendor" value={activeVendor} />
            )}
            <Search className="size-[18px] shrink-0" strokeWidth={1.8} />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search name, email, location"
              aria-label="Search applicants"
              className="text-eten-ink min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-current"
            />
          </form>

          {search && (
            <a
              href={hrefFor(activeVendor)}
              className="text-eten-accent text-[13px] font-semibold"
            >
              Clear
            </a>
          )}
        </div>

        {/* Table */}
        {error ? (
          <div className="text-destructive p-10 text-center text-sm">
            Failed to load applications: {error.message}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-eten-ink-muted flex flex-col items-center gap-3 p-16 text-center">
            <Inbox className="text-eten-faint size-10" />
            <p>No applications match these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-sm">
              <thead>
                <tr className="bg-eten-panel-hi text-left">
                  <Th className="pl-5">Applicant</Th>
                  <Th>Track</Th>
                  <Th>Solution area</Th>
                  <Th>Certifications</Th>
                  <Th>Availability</Th>
                  <Th>Location</Th>
                  <Th>Applied</Th>
                  <Th className="pr-5 text-right">Résumé</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-eten-line-soft hover:bg-eten-hover border-b align-top last:border-0"
                  >
                    <td className="py-4 pr-3 pl-5">
                      <div className="flex gap-3">
                        <span className="bg-eten-accent-soft text-eten-accent grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-bold">
                          {initials(row.full_name)}
                        </span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-eten-ink font-bold">
                            {row.full_name}
                          </span>
                          <a
                            href={`mailto:${row.email}`}
                            className="text-eten-ink-muted hover:text-eten-accent text-[13px]"
                          >
                            {row.email}
                          </a>
                          {row.phone && (
                            <a
                              href={`tel:${row.phone}`}
                              className="text-eten-ink-muted hover:text-eten-accent text-[13px]"
                            >
                              {row.phone}
                            </a>
                          )}
                          {row.linkedin && (
                            <a
                              href={row.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-eten-accent mt-0.5 inline-flex items-center gap-1 text-[13px] font-semibold"
                            >
                              LinkedIn <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <VendorBadge vendor={row.vendor} />
                    </td>
                    <Td className="text-eten-ink font-medium">
                      {row.solution_area}
                    </Td>
                    <td className="px-3 py-4">
                      <CertChips value={row.certifications} />
                    </td>
                    <Td className="whitespace-nowrap">{row.availability}</Td>
                    <Td>{row.location}</Td>
                    <td className="text-eten-ink-muted px-3 py-4 whitespace-nowrap">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="py-4 pr-5 pl-3 text-right">
                      {row.resume_path ? (
                        <a
                          href={`/api/admin/resume?path=${encodeURIComponent(
                            row.resume_path,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border-eten-line text-eten-accent hover:bg-eten-hover inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-semibold"
                        >
                          <FileDown className="size-4" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-eten-faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <div className="text-eten-ink-muted flex items-center justify-between px-5 py-3.5 text-[13px]">
            <span>
              Showing <b className="text-eten-ink">{rows.length}</b> application
              {rows.length === 1 ? "" : "s"}
            </span>
            <span className="text-eten-faint">Newest first</span>
          </div>
        )}
      </section>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        "text-eten-ink-muted border-eten-line border-b px-3 py-3 text-[12px] font-bold " +
        className
      }
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={"text-eten-ink-muted max-w-[220px] px-3 py-4 " + className}>
      {children ? children : <span className="text-eten-faint">—</span>}
    </td>
  );
}

function CertChips({ value }: { value: string | null }) {
  const certs = (value ?? "")
    .split(/[,;]/)
    .map((c) => c.trim())
    .filter(Boolean);
  if (certs.length === 0) return <span className="text-eten-faint">—</span>;
  return (
    <div className="flex max-w-[220px] flex-wrap gap-1.5">
      {certs.map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="bg-eten-panel-hi border-eten-line text-eten-ink-muted rounded-[7px] border px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function VendorBadge({ vendor }: { vendor: "huawei" | "microsoft" }) {
  const styles =
    vendor === "huawei"
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  const label = vendor === "huawei" ? "Huawei" : "Microsoft";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${styles}`}
    >
      {label}
    </span>
  );
}
