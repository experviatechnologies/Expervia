import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * One contact's full CRM record: their CRM fields, their linked platform
 * account with what they have done across the products, and their timeline.
 * Callers must have checked getCrmSession() first (service-role reads).
 */

export const LEAD_STATUSES = [
  "new",
  "open",
  "in_progress",
  "connected",
  "unqualified",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LIFECYCLES = [
  "subscriber",
  "lead",
  "mql",
  "sql",
  "opportunity",
  "customer",
  "evangelist",
] as const;
export type Lifecycle = (typeof LIFECYCLES)[number];

/** Activity types staff can log by hand (the rest are written by the system). */
export const LOGGABLE_TYPES = ["note", "call", "meeting", "email"] as const;
export type LoggableType = (typeof LOGGABLE_TYPES)[number];

export type Owner = { id: string; name: string };

export type TimelineEntry = {
  id: string;
  type: string;
  product: string;
  event: string | null;
  subject: string | null;
  body: string | null;
  outcome: string | null;
  actorName: string | null;
  occurredAt: string;
};

export type AccountSummary = {
  memberId: string;
  status: "active" | "suspended" | "deactivated";
  claimedAt: string | null;
  origin: "self_signup" | "migrated";
  joinedAt: string;
  lastSignInAt: string | null;
  membershipId: string | null;
  vLevel: number;
  signupSource: string | null;
  mentorshipIntent: string | null;
  headline: string | null;
  jobTitle: string | null;
  pods: { name: string; role: "member" | "lead" | "co_lead" }[];
  mentorStatus: string | null;
  bookingsAsMentee: number;
  bookingsAsMentor: number;
  lastBookingAt: string | null;
  /** Successful payments made, summed per currency (minor units). */
  paid: { currency: string; amount: number; count: number }[];
};

export type ContactRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  company: string | null;
  audience: "eten" | "customer";
  lifecycle: Lifecycle;
  leadStatus: LeadStatus;
  ownerId: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  gender: string | null;
  source: string | null;
  tags: string[];
  communities: string[];
  eten: Record<string, unknown>;
  emailOptIn: boolean;
  reviewReason: string | null;
  firstSeenAt: string;
  lastActivityAt: string | null;
  account: AccountSummary | null;
  timeline: TimelineEntry[];
};

const one = <T>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID_RE.test(v);

/** Staff who can own contacts: operations, Sales Managers and Management. */
export async function listOwners(): Promise<Owner[]> {
  const admin = getSupabaseAdmin();
  const [ops, staff] = await Promise.all([
    admin
      .from("members")
      .select("id")
      .eq("role", "operations")
      .eq("status", "active"),
    admin.from("member_roles").select("member_id"),
  ]);
  const ids = [
    ...new Set([
      ...(ops.data ?? []).map((m) => m.id as string),
      ...(staff.data ?? []).map((r) => r.member_id as string),
    ]),
  ];
  if (ids.length === 0) return [];
  const { data: profiles } = await admin
    .from("profiles")
    .select("member_id, full_name")
    .in("member_id", ids);
  const names = new Map(
    (profiles ?? []).map((p) => [p.member_id as string, p.full_name as string]),
  );
  return ids
    .map((id) => ({ id, name: names.get(id)?.trim() || "Staff member" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadAccount(memberId: string): Promise<AccountSummary | null> {
  const admin = getSupabaseAdmin();
  const [member, user, profile, pods, mentor, asMentee, asMentor, payments] =
    await Promise.all([
      admin
        .from("members")
        .select(
          "status, claimed_at, origin, created_at, membership_id, v_level, signup_source, mentorship_intent",
        )
        .eq("id", memberId)
        .maybeSingle(),
      admin.auth.admin.getUserById(memberId),
      admin
        .from("profiles")
        .select("headline, job_title")
        .eq("member_id", memberId)
        .maybeSingle(),
      admin
        .from("pod_memberships")
        .select("role_in_pod, pods!inner(name, is_main)")
        .eq("member_id", memberId),
      admin
        .from("mentor_profiles")
        .select("mentor_status")
        .eq("member_id", memberId)
        .maybeSingle(),
      admin
        .from("session_bookings")
        .select("starts_at", { count: "exact" })
        .eq("mentee_id", memberId)
        .in("status", ["pending", "accepted"])
        .order("starts_at", { ascending: false })
        .limit(1),
      admin
        .from("session_bookings")
        .select("starts_at", { count: "exact" })
        .eq("mentor_id", memberId)
        .in("status", ["pending", "accepted"])
        .order("starts_at", { ascending: false })
        .limit(1),
      admin
        .from("payments")
        .select("amount, currency")
        .eq("payer_id", memberId)
        .eq("status", "success"),
    ]);
  if (!member.data) return null;
  const m = member.data;

  const paid = new Map<string, { amount: number; count: number }>();
  for (const p of payments.data ?? []) {
    const cur = paid.get(p.currency) ?? { amount: 0, count: 0 };
    paid.set(p.currency, {
      amount: cur.amount + p.amount,
      count: cur.count + 1,
    });
  }
  const lastBooking = [asMentee.data?.[0], asMentor.data?.[0]]
    .map((b) => b?.starts_at as string | undefined)
    .filter(Boolean)
    .sort()
    .pop();

  return {
    memberId,
    status: m.status,
    claimedAt: m.claimed_at,
    origin: m.origin,
    joinedAt: m.created_at,
    lastSignInAt: user.data?.user?.last_sign_in_at ?? null,
    membershipId: m.membership_id ?? null,
    vLevel: m.v_level ?? 0,
    signupSource: m.signup_source ?? null,
    mentorshipIntent: m.mentorship_intent ?? null,
    headline: profile.data?.headline ?? null,
    jobTitle: profile.data?.job_title ?? null,
    pods: (pods.data ?? [])
      .map((row) => {
        const pod = one(
          row.pods as unknown as
            | { name: string; is_main: boolean }
            | { name: string; is_main: boolean }[],
        );
        return pod && !pod.is_main
          ? {
              name: pod.name,
              role: row.role_in_pod as "member" | "lead" | "co_lead",
            }
          : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.name.localeCompare(b.name)),
    mentorStatus: mentor.data?.mentor_status ?? null,
    bookingsAsMentee: asMentee.count ?? 0,
    bookingsAsMentor: asMentor.count ?? 0,
    lastBookingAt: lastBooking ?? null,
    paid: [...paid.entries()].map(([currency, v]) => ({ currency, ...v })),
  };
}

async function loadTimeline(contactId: string): Promise<TimelineEntry[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("crm_activities")
    .select(
      "id, type, product, event, subject, body, payload, actor_id, occurred_at",
    )
    .eq("contact_id", contactId)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`Could not load the timeline: ${error.message}`);

  const actorIds = [
    ...new Set((data ?? []).map((a) => a.actor_id).filter(Boolean)),
  ] as string[];
  const names = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("member_id, full_name")
      .in("member_id", actorIds);
    for (const p of profiles ?? []) names.set(p.member_id, p.full_name);
  }
  return (data ?? []).map((a) => ({
    id: a.id,
    type: a.type,
    product: a.product,
    event: a.event,
    subject: a.subject,
    body: a.body,
    outcome: typeof a.payload?.outcome === "string" ? a.payload.outcome : null,
    actorName: a.actor_id ? (names.get(a.actor_id) ?? "Staff member") : null,
    occurredAt: a.occurred_at,
  }));
}

export async function getContactRecord(
  id: string,
): Promise<ContactRecord | null> {
  if (!isUuid(id)) return null;
  const admin = getSupabaseAdmin();
  const { data: c, error } = await admin
    .from("crm_contacts")
    .select(
      "id, member_id, first_name, last_name, email, phone, job_title, audience, lifecycle, lead_status, owner_id, city, state, country, gender, source, tags, communities, eten, email_opt_in, review_reason, first_seen_at, last_activity_at, crm_companies(name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load the contact: ${error.message}`);
  if (!c) return null;

  const [account, timeline] = await Promise.all([
    c.member_id ? loadAccount(c.member_id) : Promise.resolve(null),
    loadTimeline(c.id),
  ]);

  return {
    id: c.id,
    firstName: c.first_name,
    lastName: c.last_name,
    email: c.email,
    phone: c.phone,
    jobTitle: c.job_title,
    company:
      one(c.crm_companies as { name: string } | { name: string }[] | null)
        ?.name ?? null,
    audience: c.audience,
    lifecycle: c.lifecycle,
    leadStatus: c.lead_status,
    ownerId: c.owner_id,
    city: c.city,
    state: c.state,
    country: c.country,
    gender: c.gender,
    source: c.source,
    tags: c.tags ?? [],
    communities: c.communities ?? [],
    eten: (c.eten ?? {}) as Record<string, unknown>,
    emailOptIn: c.email_opt_in,
    reviewReason: c.review_reason,
    firstSeenAt: c.first_seen_at,
    lastActivityAt: c.last_activity_at,
    account,
    timeline,
  };
}
