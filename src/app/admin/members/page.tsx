import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SignOutButton } from "../applications/sign-out-button";
import { AdminTabs } from "../admin-tabs";
import { MembersManager, type MemberRow } from "./members-manager";

export const metadata: Metadata = {
  title: "Members",
  robots: { index: false, follow: false },
};

/** Gather auth emails (id → email) across all pages, capped for safety. */
async function loadEmails(
  admin: ReturnType<typeof getSupabaseAdmin>,
): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error || !data?.users?.length) break;
    for (const u of data.users) if (u.email) emails.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }
  return emails;
}

export default async function MembersPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const me = await getCurrentMember();
  const admin = getSupabaseAdmin();

  const [{ data: memberRows }, { data: profileRows }, emails] =
    await Promise.all([
      admin
        .from("members")
        .select("id, status, role, origin, claimed_at, created_at")
        .order("created_at", { ascending: false }),
      admin.from("profiles").select("member_id, full_name"),
      loadEmails(admin),
    ]);

  const names = new Map<string, string | null>();
  for (const p of profileRows ?? []) names.set(p.member_id, p.full_name);

  const rawMembers = memberRows ?? [];
  const members: MemberRow[] = rawMembers.map((m) => ({
    id: m.id,
    fullName: names.get(m.id) ?? null,
    email: emails.get(m.id) ?? null,
    status: m.status,
    role: m.role,
    origin: m.origin,
    claimedAt: m.claimed_at,
    createdAt: m.created_at,
  }));

  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-6xl py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-primary mb-1 font-mono tracking-widest uppercase">
            Expervia Admin
          </p>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">
            Members
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            {members.length} member{members.length === 1 ? "" : "s"} ·{" "}
            {activeCount} active. Suspend or deactivate accounts here — the
            change takes effect on their next request.
          </p>
        </div>
        <SignOutButton />
      </div>

      <AdminTabs active="members" />

      {members.length === 0 ? (
        <div className="glass-card text-on-surface-variant flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <Users className="text-on-surface-variant/50 size-10" />
          <p>No members yet.</p>
        </div>
      ) : (
        <MembersManager members={members} key={me?.id} />
      )}
    </div>
  );
}
