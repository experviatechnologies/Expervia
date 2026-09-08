import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SignOutButton } from "../applications/sign-out-button";
import { AdminTabs } from "../admin-tabs";
import { ReportsManager, type ReportRow } from "./reports-manager";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

export default async function AdminReportsPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();

  const { data: reportRows } = await admin
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, status, created_at",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const reports = reportRows ?? [];

  // Gather context: reporter names + a snippet of each reported post/comment.
  const reporterIds = [...new Set(reports.map((r) => r.reporter_id))];
  const postIds = reports
    .filter((r) => r.target_type === "post")
    .map((r) => r.target_id);
  const commentIds = reports
    .filter((r) => r.target_type === "comment")
    .map((r) => r.target_id);

  const [{ data: reporterRows }, { data: postRows }, { data: commentRows }] =
    await Promise.all([
      reporterIds.length
        ? admin
            .from("profiles")
            .select("member_id, full_name")
            .in("member_id", reporterIds)
        : Promise.resolve({
            data: [] as { member_id: string; full_name: string }[],
          }),
      postIds.length
        ? admin.from("posts").select("id, body, is_removed").in("id", postIds)
        : Promise.resolve({
            data: [] as { id: string; body: string; is_removed: boolean }[],
          }),
      commentIds.length
        ? admin
            .from("comments")
            .select("id, body, post_id, is_removed")
            .in("id", commentIds)
        : Promise.resolve({
            data: [] as {
              id: string;
              body: string;
              post_id: string;
              is_removed: boolean;
            }[],
          }),
    ]);

  const reporterName = new Map(
    (reporterRows ?? []).map((r) => [r.member_id, r.full_name]),
  );
  const postById = new Map((postRows ?? []).map((p) => [p.id, p]));
  const commentById = new Map((commentRows ?? []).map((c) => [c.id, c]));

  const rows: ReportRow[] = reports.map((r) => {
    let snippet: string | null = null;
    let postId: string | null = null;
    let alreadyRemoved = false;
    if (r.target_type === "post") {
      const p = postById.get(r.target_id);
      snippet = p?.body ?? null;
      postId = p ? r.target_id : null;
      alreadyRemoved = p?.is_removed ?? false;
    } else if (r.target_type === "comment") {
      const c = commentById.get(r.target_id);
      snippet = c?.body ?? null;
      postId = c?.post_id ?? null;
      alreadyRemoved = c?.is_removed ?? false;
    }
    return {
      id: r.id,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      reporterName: reporterName.get(r.reporter_id) ?? "A member",
      createdAt: r.created_at,
      snippet,
      postId,
      alreadyRemoved,
    };
  });

  return (
    <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-5xl py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-primary mb-1 font-mono tracking-widest uppercase">
            Expervia Admin
          </p>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">
            Reports
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            {rows.length} open report{rows.length === 1 ? "" : "s"}. Review
            flagged content, remove it, or dismiss the report.
          </p>
        </div>
        <SignOutButton />
      </div>

      <AdminTabs active="reports" />

      {rows.length === 0 ? (
        <div className="glass-card text-on-surface-variant flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <ShieldAlert className="text-on-surface-variant/50 size-10" />
          <p>No open reports. All clear.</p>
        </div>
      ) : (
        <ReportsManager reports={rows} />
      )}
    </div>
  );
}
