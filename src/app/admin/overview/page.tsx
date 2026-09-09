import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SignOutButton } from "../applications/sign-out-button";
import { AdminTabs } from "../admin-tabs";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();
  const head = { count: "exact" as const, head: true };

  const [
    totalMembers,
    activatedMembers,
    pendingMembers,
    suspendedMembers,
    posts,
    comments,
    verifiedCerts,
    pendingCerts,
    openReports,
    { data: podRows },
    { data: membershipRows },
  ] = await Promise.all([
    admin.from("members").select("*", head),
    admin.from("members").select("*", head).not("claimed_at", "is", null),
    admin.from("members").select("*", head).is("claimed_at", null),
    admin.from("members").select("*", head).eq("status", "suspended"),
    admin.from("posts").select("*", head).eq("is_removed", false),
    admin.from("comments").select("*", head).eq("is_removed", false),
    admin
      .from("certifications")
      .select("*", head)
      .eq("verification_status", "verified"),
    admin
      .from("certifications")
      .select("*", head)
      .eq("verification_status", "unverified"),
    admin.from("reports").select("*", head).eq("status", "open"),
    admin.from("pods").select("id, name, is_main").order("name"),
    admin.from("pod_memberships").select("pod_id"),
  ]);

  const podCounts = new Map<string, number>();
  for (const m of membershipRows ?? []) {
    podCounts.set(m.pod_id, (podCounts.get(m.pod_id) ?? 0) + 1);
  }
  const pods = (podRows ?? [])
    .filter((p) => !p.is_main)
    .map((p) => ({ name: p.name, members: podCounts.get(p.id) ?? 0 }));

  const community: [string, number, string?][] = [
    ["Total members", totalMembers.count ?? 0],
    ["Activated", activatedMembers.count ?? 0],
    ["Pending activation", pendingMembers.count ?? 0],
    ["Suspended", suspendedMembers.count ?? 0],
  ];
  const content: [string, number][] = [
    ["Posts", posts.count ?? 0],
    ["Comments", comments.count ?? 0],
  ];
  const credentials: [string, number][] = [
    ["Verified", verifiedCerts.count ?? 0],
    ["Pending review", pendingCerts.count ?? 0],
  ];

  return (
    <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-6xl py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-primary mb-1 font-mono tracking-widest uppercase">
            Expervia Admin
          </p>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">
            Overview
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Platform health at a glance.
          </p>
        </div>
        <SignOutButton />
      </div>

      <AdminTabs active="overview" />

      {/* Attention row */}
      {((pendingCerts.count ?? 0) > 0 || (openReports.count ?? 0) > 0) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {(pendingCerts.count ?? 0) > 0 && (
            <Link
              href="/admin/certifications"
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400"
            >
              {pendingCerts.count} certification
              {pendingCerts.count === 1 ? "" : "s"} awaiting review →
            </Link>
          )}
          {(openReports.count ?? 0) > 0 && (
            <Link
              href="/admin/reports"
              className="border-destructive/30 bg-destructive/10 text-destructive rounded-full border px-4 py-2 text-sm font-medium"
            >
              {openReports.count} open report
              {openReports.count === 1 ? "" : "s"} →
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-8">
        <StatGroup title="Community" stats={community} />
        <StatGroup title="Content" stats={content} />
        <StatGroup title="Credentials" stats={credentials} />

        <section>
          <h2 className="text-label-sm text-on-surface-variant mb-3 font-mono tracking-wider uppercase">
            Pods
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {pods.map(({ name, members }) => (
              <div key={name} className="bg-surface-container rounded-lg p-3">
                <dt className="text-on-surface-variant truncate text-xs">
                  {name}
                </dt>
                <dd className="text-on-surface text-lg font-semibold">
                  {members}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}

function StatGroup({
  title,
  stats,
}: {
  title: string;
  stats: [string, number, string?][];
}) {
  return (
    <section>
      <h2 className="text-label-sm text-on-surface-variant mb-3 font-mono tracking-wider uppercase">
        {title}
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-surface-container rounded-lg p-4">
            <dt className="text-on-surface-variant text-xs">{label}</dt>
            <dd className="text-on-surface text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
