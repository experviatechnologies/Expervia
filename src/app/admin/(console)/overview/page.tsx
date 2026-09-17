import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getOverviewMetrics } from "./metrics";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const { counts, pods, verification } = await getOverviewMetrics();

  const community: [string, number][] = [
    ["Total members", counts.totalMembers],
    ["Active", counts.activeMembers],
    ["Pending activation", counts.pendingActivation],
    ["Suspended", counts.suspendedMembers],
  ];
  const content: [string, number][] = [
    ["Posts", counts.posts],
    ["Comments", counts.comments],
  ];
  const credentials: [string, number][] = [
    ["Verified", verification.verified],
    ["Pending review", verification.pending],
  ];

  return (
    <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-6xl py-10">
      <div className="mb-8">
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

      {/* Attention row */}
      {(counts.certsToReview > 0 || counts.openReports > 0) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {counts.certsToReview > 0 && (
            <Link
              href="/admin/certifications"
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400"
            >
              {counts.certsToReview} certification
              {counts.certsToReview === 1 ? "" : "s"} awaiting review →
            </Link>
          )}
          {counts.openReports > 0 && (
            <Link
              href="/admin/reports"
              className="border-destructive/30 bg-destructive/10 text-destructive rounded-full border px-4 py-2 text-sm font-medium"
            >
              {counts.openReports} open report
              {counts.openReports === 1 ? "" : "s"} →
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
            Pods · {counts.multiPodMembers} member
            {counts.multiPodMembers === 1 ? "" : "s"} in ≥2 pods
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
  stats: [string, number][];
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
