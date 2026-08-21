import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { getSupabaseAdmin, EVENT_REGISTRATIONS_TABLE } from "@/lib/supabase";
import { SignOutButton } from "../applications/sign-out-button";
import { AdminTabs } from "../admin-tabs";

export const metadata: Metadata = {
  title: "Event Registrations",
  robots: { index: false, follow: false },
};

type RegistrationRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  job_title: string | null;
  organization: string | null;
  area_of_expertise: string | null;
  membership_status: string | null;
  heard_from: string | null;
  learning_goals: string | null;
  consent: boolean;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function joinTruthy(parts: (string | null)[], sep: string) {
  return parts.filter(Boolean).join(sep);
}

export default async function EventRegistrationsPage() {
  // Defence-in-depth: the proxy already guards /admin, but every protected
  // page verifies the session itself so data can never leak via a matcher gap.
  const manager = await getCurrentManager();
  if (!manager) {
    redirect("/admin/login");
  }

  // Session verified above — now read with the service_role client.
  const { data, error } = await getSupabaseAdmin()
    .from(EVENT_REGISTRATIONS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as RegistrationRow[];

  return (
    <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-7xl py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-primary mb-1 font-mono tracking-widest uppercase">
            Expervia Admin
          </p>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">
            Event Registrations
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Signed in as {manager.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      <AdminTabs active="events" />

      {error ? (
        <div className="glass-card text-destructive rounded-2xl p-8 text-sm">
          Failed to load registrations: {error.message}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card text-on-surface-variant flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <Inbox className="text-on-surface-variant/50 size-10" />
          <p>No event registrations yet.</p>
        </div>
      ) : (
        <>
          <p className="text-on-surface-variant mb-3 text-sm">
            {rows.length} registration{rows.length === 1 ? "" : "s"}
          </p>
          <div className="glass-card overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <Th>Registrant</Th>
                  <Th>Role</Th>
                  <Th>Area of Expertise</Th>
                  <Th>Membership</Th>
                  <Th>Heard Via</Th>
                  <Th>Location</Th>
                  <Th>Goals</Th>
                  <Th>Registered</Th>
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
                        {joinTruthy([row.first_name, row.last_name], " ") || "—"}
                      </div>
                      <a
                        href={`mailto:${row.email}`}
                        className="text-on-surface-variant hover:text-primary block text-xs"
                      >
                        {row.email}
                      </a>
                      {row.phone && (
                        <a
                          href={`tel:${row.phone}`}
                          className="text-on-surface-variant hover:text-primary block text-xs"
                        >
                          {row.phone}
                        </a>
                      )}
                    </td>
                    <Td>{joinTruthy([row.job_title, row.organization], " · ")}</Td>
                    <Td>{row.area_of_expertise}</Td>
                    <Td>{row.membership_status}</Td>
                    <Td>{row.heard_from}</Td>
                    <Td>{joinTruthy([row.city, row.country], ", ")}</Td>
                    <Td>{row.learning_goals}</Td>
                    <td className="text-on-surface-variant px-4 py-4 align-top whitespace-nowrap">
                      {formatDate(row.created_at)}
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
    <td className="text-on-surface-variant max-w-[220px] px-4 py-4 align-top">
      {children ? (
        children
      ) : (
        <span className="text-on-surface-variant/40">—</span>
      )}
    </td>
  );
}
