import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
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

  const [
    { data: memberRows },
    { data: profileRows },
    { data: podRows },
    { data: membershipRows },
    emails,
  ] = await Promise.all([
    admin
      .from("members")
      .select("id, status, role, origin, claimed_at, created_at, v_level")
      .order("created_at", { ascending: false }),
    admin.from("profiles").select("member_id, full_name"),
    admin.from("pods").select("id, name, is_main"),
    admin.from("pod_memberships").select("member_id, pod_id"),
    loadEmails(admin),
  ]);

  const names = new Map<string, string | null>();
  for (const p of profileRows ?? []) names.set(p.member_id, p.full_name);

  // Specialist-pod names per member (the Main Community pod is excluded — it's
  // shared by everyone and adds no signal here).
  const podName = new Map<string, string>();
  for (const p of podRows ?? []) if (!p.is_main) podName.set(p.id, p.name);
  const podsByMember = new Map<string, string[]>();
  for (const m of membershipRows ?? []) {
    const name = podName.get(m.pod_id);
    if (!name) continue;
    const list = podsByMember.get(m.member_id) ?? [];
    list.push(name);
    podsByMember.set(m.member_id, list);
  }

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
    vLevel: m.v_level,
    pods: (podsByMember.get(m.id) ?? []).sort(),
  }));

  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
          Members
        </h1>
        <p className="text-eten-ink-muted mt-1 text-sm">
          {members.length} member{members.length === 1 ? "" : "s"} ·{" "}
          {activeCount} active. Search and filter the community, open any
          profile, or change an account&apos;s status.
        </p>
      </header>

      {members.length === 0 ? (
        <div className="bg-eten-panel border-eten-line text-eten-faint flex flex-col items-center gap-3 rounded-2xl border p-16 text-center">
          <Users className="text-eten-faint/50 size-10" />
          <p>No members yet.</p>
        </div>
      ) : (
        <MembersManager members={members} key={me?.id} />
      )}
    </div>
  );
}
