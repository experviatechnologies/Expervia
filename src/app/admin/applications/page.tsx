import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExternalLink, FileDown, Inbox } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { getSupabaseAdmin, APPLICATIONS_TABLE } from "@/lib/supabase";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Community Applications",
  robots: { index: false, follow: false },
};

type ApplicationRow = {
  id: string;
  vendor: "huawei" | "microsoft";
  full_name: string;
  email: string;
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

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ vendor?: string }>;
}) {
  // Defence-in-depth: the proxy already guards /admin, but every protected
  // page verifies the session itself so data can never leak via a matcher gap.
  const manager = await getCurrentManager();
  if (!manager) {
    redirect("/admin/login");
  }

  const { vendor } = await searchParams;
  const activeVendor =
    vendor === "huawei" || vendor === "microsoft" ? vendor : "all";

  // Session verified above — now read with the service_role client.
  let query = getSupabaseAdmin()
    .from(APPLICATIONS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (activeVendor !== "all") {
    query = query.eq("vendor", activeVendor);
  }

  const { data, error } = await query;
  const rows = (data ?? []) as ApplicationRow[];

  return (
    <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-7xl py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-primary mb-1 font-mono tracking-widest uppercase">
            Expervia Admin
          </p>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">
            Community Applications
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Signed in as {manager.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      {/* Vendor filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {VENDORS.map(({ key, label }) => {
          const isActive = key === activeVendor;
          const href = key === "all" ? "/admin/applications" : `?vendor=${key}`;
          return (
            <a
              key={key}
              href={href}
              className={
                isActive
                  ? "bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold"
                  : "border-outline-variant text-on-surface-variant hover:text-on-surface rounded-full border px-4 py-2 text-sm transition-colors"
              }
            >
              {label}
            </a>
          );
        })}
      </div>

      {error ? (
        <div className="glass-card text-destructive rounded-2xl p-8 text-sm">
          Failed to load applications: {error.message}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card text-on-surface-variant flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <Inbox className="text-on-surface-variant/50 size-10" />
          <p>
            No applications yet{activeVendor !== "all" ? " for this track" : ""}
            .
          </p>
        </div>
      ) : (
        <>
          <p className="text-on-surface-variant mb-3 text-sm">
            {rows.length} application{rows.length === 1 ? "" : "s"}
          </p>
          <div className="glass-card overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <Th>Applicant</Th>
                  <Th>Track</Th>
                  <Th>Solution Area</Th>
                  <Th>Certifications</Th>
                  <Th>Availability</Th>
                  <Th>Location</Th>
                  <Th>Applied</Th>
                  <Th>Résumé</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="text-on-surface font-medium">
                        {row.full_name}
                      </div>
                      <a
                        href={`mailto:${row.email}`}
                        className="text-on-surface-variant hover:text-primary text-xs"
                      >
                        {row.email}
                      </a>
                      {row.linkedin && (
                        <a
                          href={row.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary mt-1 flex items-center gap-1 text-xs hover:underline"
                        >
                          LinkedIn <ExternalLink className="size-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <VendorBadge vendor={row.vendor} />
                    </td>
                    <Td>{row.solution_area}</Td>
                    <Td>{row.certifications}</Td>
                    <Td>{row.availability}</Td>
                    <Td>{row.location}</Td>
                    <td className="text-on-surface-variant px-4 py-4 align-top whitespace-nowrap">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {row.resume_path ? (
                        <a
                          href={`/api/admin/resume?path=${encodeURIComponent(
                            row.resume_path,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
                        >
                          <FileDown className="size-4" />
                          Download
                        </a>
                      ) : (
                        <span className="text-on-surface-variant/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-label-sm text-on-surface-variant px-4 py-3 font-mono font-normal tracking-wider uppercase">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="text-on-surface-variant max-w-[200px] px-4 py-4 align-top">
      {children ? (
        children
      ) : (
        <span className="text-on-surface-variant/40">—</span>
      )}
    </td>
  );
}

function VendorBadge({ vendor }: { vendor: "huawei" | "microsoft" }) {
  const styles =
    vendor === "huawei"
      ? "bg-red-500/10 text-red-400"
      : "bg-blue-500/10 text-blue-400";
  const label = vendor === "huawei" ? "Huawei" : "Microsoft";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}
