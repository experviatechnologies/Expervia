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
  phone: string | null;
  source: string | null;
  fullName: string | null;
  location: string | null;
  jobTitle: string | null;
  industryExperience: string | null;
  invitedAt: string;
  /** Latest time a resend invite was sent to this member (null = never re-sent). */
  lastResentAt: string | null;
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

  // Phone wasn't copied into the ETEN profile at migration — it stayed on the
  // original signup rows. Join it back by email (prefer the application's phone,
  // fall back to the event registration's) and note which source they came from.
  const [
    { data: profiles },
    { data: apps },
    { data: events },
    { data: resendRows },
    emails,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("member_id, full_name, location, job_title, industry_experience")
      .in("member_id", ids),
    admin.from("community_applications").select("email, phone"),
    admin.from("event_registrations").select("email, phone"),
    // Resend history — latest "invite re-sent" per member drives ordering so a
    // batch resend targets the least-recently-contacted people, not the same
    // ones each time.
    admin
      .from("audit_log")
      .select("target_id, created_at")
      .eq("action", "member.invite_resent")
      .order("created_at", { ascending: false }),
    emailById(admin),
  ]);

  const lastResentByMember = new Map<string, string>();
  for (const r of resendRows ?? []) {
    if (r.target_id && !lastResentByMember.has(r.target_id)) {
      lastResentByMember.set(r.target_id, r.created_at); // first = latest (desc)
    }
  }

  const norm = (e: string | null | undefined) =>
    (e ?? "").trim().toLowerCase() || null;
  const appByEmail = new Map<string, string | null>();
  for (const a of apps ?? []) {
    const e = norm(a.email);
    if (e) appByEmail.set(e, a.phone ?? null);
  }
  const eventByEmail = new Map<string, string | null>();
  for (const ev of events ?? []) {
    const e = norm(ev.email);
    if (e) eventByEmail.set(e, ev.phone ?? null);
  }

  const pById = new Map((profiles ?? []).map((p) => [p.member_id, p]));

  const result = (members ?? []).map((m) => {
    const p = pById.get(m.id);
    const email = emails.get(m.id) ?? null;
    const key = norm(email);
    const inApp = key ? appByEmail.has(key) : false;
    const inEvent = key ? eventByEmail.has(key) : false;
    const phone =
      (key ? appByEmail.get(key) : null) ||
      (key ? eventByEmail.get(key) : null) ||
      null;
    const source =
      inApp && inEvent
        ? "Application + event"
        : inApp
          ? "Application"
          : inEvent
            ? "Event"
            : null;
    return {
      memberId: m.id,
      email,
      phone,
      source,
      fullName: p?.full_name ?? null,
      location: p?.location ?? null,
      jobTitle: p?.job_title ?? null,
      industryExperience: p?.industry_experience ?? null,
      invitedAt: m.created_at,
      lastResentAt: lastResentByMember.get(m.id) ?? null,
    };
  });

  // Least-recently-contacted first: never-resent people lead, then oldest
  // resend. So "Resend to first 50" always targets fresh people, and after a
  // refresh the just-sent batch moves to the bottom — batches don't overlap.
  result.sort((a, b) => {
    const av = a.lastResentAt ?? "";
    const bv = b.lastResentAt ?? "";
    if (av !== bv) return av < bv ? -1 : 1;
    return a.invitedAt < b.invitedAt ? -1 : 1;
  });

  return result;
}
