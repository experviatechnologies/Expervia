import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SignOutButton } from "../applications/sign-out-button";
import { AdminTabs } from "../admin-tabs";

export const metadata: Metadata = {
  title: "Audit Log",
  robots: { index: false, follow: false },
};

/** Human labels for the action codes written by writeAudit(). */
const ACTION_LABEL: Record<string, string> = {
  "member.status.active": "Reactivated a member",
  "member.status.suspended": "Suspended a member",
  "member.status.deactivated": "Deactivated a member",
  "cert.verified": "Verified a certification",
  "cert.rejected": "Rejected a certification",
  "cert.unverified": "Reset a certification to pending",
  "report.actioned": "Actioned a report",
  "report.dismissed": "Dismissed a report",
  "post.removed": "Removed a post",
  "comment.removed": "Removed a comment",
};

function timestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AuditLogPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();

  const { data: rows } = await admin
    .from("audit_log")
    .select("id, actor_id, action, target_type, target_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const entries = rows ?? [];
  const actorIds = [
    ...new Set(entries.map((e) => e.actor_id).filter(Boolean)),
  ] as string[];
  const { data: actorRows } = actorIds.length
    ? await admin
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", actorIds)
    : { data: [] };
  const nameById = new Map(
    (actorRows ?? []).map((a) => [a.member_id, a.full_name]),
  );

  return (
    <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-5xl py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-primary mb-1 font-mono tracking-widest uppercase">
            Expervia Admin
          </p>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">
            Audit Log
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            A record of moderation and admin actions (most recent 200).
          </p>
        </div>
        <SignOutButton />
      </div>

      <AdminTabs active="audit" />

      {entries.length === 0 ? (
        <div className="glass-card text-on-surface-variant flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <ScrollText className="text-on-surface-variant/50 size-10" />
          <p>No audit entries yet.</p>
        </div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Action</Th>
                <Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="text-on-surface-variant px-4 py-3 align-top whitespace-nowrap">
                    {timestamp(e.created_at)}
                  </td>
                  <td className="text-on-surface px-4 py-3 align-top">
                    {e.actor_id
                      ? (nameById.get(e.actor_id) ?? "A member")
                      : "System"}
                  </td>
                  <td className="text-on-surface px-4 py-3 align-top">
                    {ACTION_LABEL[e.action] ?? e.action}
                  </td>
                  <td className="text-on-surface-variant px-4 py-3 align-top">
                    {e.target_type && (
                      <span className="font-mono text-xs">{e.target_type}</span>
                    )}
                    {e.reason && (
                      <span className="block text-xs italic">{e.reason}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
