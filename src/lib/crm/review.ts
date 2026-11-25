import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * The CRM review queue: contacts flagged for a human check (SQL 64
 * review_reason). Today the only reason is 'phone_match': the lead's phone
 * number belongs to an existing account with a different email. Callers must
 * have checked getCrmSession() first (service-role reads).
 */

export type ReviewPerson = {
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  firstSeenAt: string | null;
  location: string | null;
};

export type ReviewItem = {
  contactId: string;
  reason: string;
  lead: ReviewPerson & { audience: "eten" | "customer"; tags: string[] };
  /** The existing account the phone number belongs to, if it still exists. */
  match: {
    memberId: string;
    /** That member's own CRM contact (the merge target). */
    contactId: string | null;
    membershipId: string | null;
    activated: boolean;
    person: ReviewPerson;
  } | null;
};

const name = (first?: string | null, last?: string | null) =>
  `${first ?? ""} ${last ?? ""}`.trim() || "No name";

export async function reviewCount(): Promise<number | null> {
  const { count, error } = await getSupabaseAdmin()
    .from("crm_contacts")
    .select("id", { count: "exact", head: true })
    .not("review_reason", "is", null);
  return error ? null : (count ?? 0);
}

export async function listReviewItems(): Promise<ReviewItem[]> {
  const admin = getSupabaseAdmin();
  const { data: leads, error } = await admin
    .from("crm_contacts")
    .select(
      "id, first_name, last_name, email, phone, source, first_seen_at, city, country, audience, tags, review_reason, eten",
    )
    .not("review_reason", "is", null)
    .order("first_seen_at", { ascending: false })
    .limit(200);
  if (error)
    throw new Error(`Could not load the review queue: ${error.message}`);
  if (!leads?.length) return [];

  const memberIds = [
    ...new Set(
      leads
        .map((l) => l.eten?.suggested_member_id)
        .filter((v): v is string => typeof v === "string"),
    ),
  ];

  const [members, contacts, profiles, phones, users] = await Promise.all([
    admin
      .from("members")
      .select("id, membership_id, claimed_at")
      .in("id", memberIds),
    admin
      .from("crm_contacts")
      .select(
        "id, member_id, first_name, last_name, email, phone, source, first_seen_at, city, country",
      )
      .in("member_id", memberIds),
    admin
      .from("profiles")
      .select("member_id, full_name, location")
      .in("member_id", memberIds),
    admin
      .from("member_contact")
      .select("member_id, phone")
      .in("member_id", memberIds),
    Promise.all(memberIds.map((id) => admin.auth.admin.getUserById(id))),
  ]);

  const memberById = new Map((members.data ?? []).map((m) => [m.id, m]));
  const contactByMember = new Map(
    (contacts.data ?? []).map((c) => [c.member_id as string, c]),
  );
  const profileById = new Map(
    (profiles.data ?? []).map((p) => [p.member_id, p]),
  );
  const phoneById = new Map(
    (phones.data ?? []).map((p) => [p.member_id, p.phone]),
  );
  const emailById = new Map(
    users
      .map((u) => u.data?.user)
      .filter(Boolean)
      .map((u) => [u!.id, u!.email ?? null]),
  );

  return leads.map((l) => {
    const memberId =
      typeof l.eten?.suggested_member_id === "string"
        ? l.eten.suggested_member_id
        : null;
    const m = memberId ? memberById.get(memberId) : undefined;
    const c = memberId ? contactByMember.get(memberId) : undefined;
    const p = memberId ? profileById.get(memberId) : undefined;
    return {
      contactId: l.id,
      reason: l.review_reason as string,
      lead: {
        name: name(l.first_name, l.last_name),
        email: l.email,
        phone: l.phone,
        source: l.source,
        firstSeenAt: l.first_seen_at,
        location: [l.city, l.country].filter(Boolean).join(", ") || null,
        audience: l.audience,
        tags: l.tags ?? [],
      },
      match:
        memberId && m
          ? {
              memberId,
              contactId: c?.id ?? null,
              membershipId: m.membership_id ?? null,
              activated: Boolean(m.claimed_at),
              person: {
                name: p?.full_name?.trim() || name(c?.first_name, c?.last_name),
                email: emailById.get(memberId) ?? c?.email ?? null,
                phone: phoneById.get(memberId) ?? c?.phone ?? null,
                source: c?.source ?? null,
                firstSeenAt: c?.first_seen_at ?? null,
                location:
                  p?.location ??
                  ([c?.city, c?.country].filter(Boolean).join(", ") || null),
              },
            }
          : null,
    };
  });
}
