import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Migrated members who were provisioned an ETEN account but never claimed it
 * (origin = 'migrated' AND claimed_at IS NULL) — i.e. people who got an invite
 * but haven't signed in. Used by the admin "Pending migration" panel to see,
 * re-invite, and export them. Service_role read (ops-gated by the caller).
 */

export type PendingMember = {
  memberId: string;
  email: string | null;
  fullName: string | null;
  location: string | null;
  jobTitle: string | null;
  industryExperience: string | null;
  invitedAt: string;
};

/** id → auth email, paginated across all users. */
async function emailById(admin: SupabaseClient): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error || !data?.users?.length) break;
    for (const u of data.users) if (u.email) map.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }
  return map;
}

export async function listPendingMigration(
  admin: SupabaseClient,
): Promise<PendingMember[]> {
  const { data: members } = await admin
    .from("members")
    .select("id, created_at")
    .eq("origin", "migrated")
    .is("claimed_at", null)
    .order("created_at", { ascending: true });

  const ids = (members ?? []).map((m) => m.id);
  if (ids.length === 0) return [];

  const [{ data: profiles }, emails] = await Promise.all([
    admin
      .from("profiles")
      .select("member_id, full_name, location, job_title, industry_experience")
      .in("member_id", ids),
    emailById(admin),
  ]);

  const pById = new Map((profiles ?? []).map((p) => [p.member_id, p]));

  return (members ?? []).map((m) => {
    const p = pById.get(m.id);
    return {
      memberId: m.id,
      email: emails.get(m.id) ?? null,
      fullName: p?.full_name ?? null,
      location: p?.location ?? null,
      jobTitle: p?.job_title ?? null,
      industryExperience: p?.industry_experience ?? null,
      invitedAt: m.created_at,
    };
  });
}
