import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Numbers for the CRM dashboard. Callers must have checked getCrmSession().
 *
 * Contacts are few enough (low thousands) to aggregate here from one paged
 * read. If the CRM grows past ~20k contacts, move these counts into a SQL view.
 *
 * "New contacts" leaves out source 'Migrated member': those people were moved
 * onto the platform in one batch, so their dates would show a false spike
 * (the same rule the admin overview uses for member growth).
 */

const LAGOS = "Africa/Lagos";
const DAY = 86_400_000;
const WEEKS = 12;
const TOP_SOURCES = 6;

export type WeekBucket = {
  /** Monday of the week, YYYY-MM-DD (Lagos). */
  start: string;
  eten: number;
  customer: number;
};

export type RecentActivity = {
  id: string;
  type: string;
  product: string;
  subject: string | null;
  body: string | null;
  occurredAt: string;
  actorName: string | null;
  contactId: string | null;
  contactName: string;
};

export type Dashboard = {
  total: number;
  eten: number;
  customer: number;
  active: number;
  pending: number;
  /** Platform accounts, counted like the admin overview's Total members
   *  (staff logins left out), so the two numbers can be compared. */
  accounts: number;
  staffAccounts: number;
  noAccount: number;
  womenInTech: number;
  review: number;
  mine: number;
  new30: number;
  newPrev30: number;
  weeks: WeekBucket[];
  sources: { label: string; count: number }[];
  recent: RecentActivity[];
};

type Row = {
  audience: "eten" | "customer";
  source: string | null;
  first_seen_at: string;
  communities: string[] | null;
  review_reason: string | null;
  owner_id: string | null;
  member_id: string | null;
  account:
    | { claimed_at: string | null; role: string }
    | { claimed_at: string | null; role: string }[]
    | null;
};

/** YYYY-MM-DD of a moment in Lagos time. */
function lagosDate(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ms);
}

/** Monday (YYYY-MM-DD) of the Lagos week containing `ms`. */
function mondayOf(ms: number): string {
  const day = new Date(`${lagosDate(ms)}T00:00:00Z`);
  const dow = (day.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(day.getTime() - dow * DAY).toISOString().slice(0, 10);
}

async function loadRows(): Promise<Row[]> {
  const admin = getSupabaseAdmin();
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("crm_contacts")
      .select(
        "audience, source, first_seen_at, communities, review_reason, owner_id, member_id, account:members!crm_contacts_member_id_fkey(claimed_at, role)",
      )
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(`Could not load contacts: ${error.message}`);
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < 1000) return rows;
  }
}

async function loadRecent(): Promise<RecentActivity[]> {
  const admin = getSupabaseAdmin();
  // Leave out the one-off import entries; show what people and products did.
  const { data, error } = await admin
    .from("crm_activities")
    .select(
      "id, type, product, subject, body, occurred_at, actor_id, contact_id, crm_contacts(first_name, last_name)",
    )
    .or(
      "dedupe_key.is.null,and(dedupe_key.not.like.import:*,dedupe_key.not.like.account:*)",
    )
    .order("occurred_at", { ascending: false })
    .limit(8);
  if (error) throw new Error(`Could not load activity: ${error.message}`);

  const actorIds = [
    ...new Set((data ?? []).map((a) => a.actor_id).filter(Boolean)),
  ] as string[];
  const names = new Map<string, string>();
  if (actorIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("member_id, full_name")
      .in("member_id", actorIds);
    for (const p of profiles ?? []) names.set(p.member_id, p.full_name);
  }
  return (data ?? []).map((a) => {
    const c = (
      Array.isArray(a.crm_contacts) ? a.crm_contacts[0] : a.crm_contacts
    ) as { first_name: string; last_name: string } | null;
    return {
      id: a.id,
      type: a.type,
      product: a.product,
      subject: a.subject,
      body: a.body,
      occurredAt: a.occurred_at,
      actorName: a.actor_id ? (names.get(a.actor_id) ?? "Staff member") : null,
      contactId: a.contact_id,
      contactName:
        `${c?.first_name ?? ""} ${c?.last_name ?? ""}`.trim() || "No name",
    };
  });
}

export async function loadDashboard(viewerId: string): Promise<Dashboard> {
  const [rows, recent] = await Promise.all([loadRows(), loadRecent()]);
  const now = Date.now();

  // Week buckets: the last 12 Lagos weeks, oldest first.
  const thisMonday = mondayOf(now);
  const weeks: WeekBucket[] = Array.from({ length: WEEKS }, (_, i) => ({
    start: new Date(
      Date.parse(`${thisMonday}T00:00:00Z`) - (WEEKS - 1 - i) * 7 * DAY,
    )
      .toISOString()
      .slice(0, 10),
    eten: 0,
    customer: 0,
  }));
  const weekIndex = new Map(weeks.map((w, i) => [w.start, i]));

  const d: Dashboard = {
    total: rows.length,
    eten: 0,
    customer: 0,
    active: 0,
    pending: 0,
    accounts: 0,
    staffAccounts: 0,
    noAccount: 0,
    womenInTech: 0,
    review: 0,
    mine: 0,
    new30: 0,
    newPrev30: 0,
    weeks,
    sources: [],
    recent,
  };
  const sourceCounts = new Map<string, number>();

  for (const r of rows) {
    d[r.audience] += 1;
    const account = Array.isArray(r.account) ? r.account[0] : r.account;
    if (!r.member_id || !account) d.noAccount += 1;
    else if (account.role === "operations") d.staffAccounts += 1;
    else if (account.claimed_at) d.active += 1;
    else d.pending += 1;
    if (r.communities?.includes("women-in-tech")) d.womenInTech += 1;
    if (r.review_reason) d.review += 1;
    if (r.owner_id === viewerId) d.mine += 1;

    const source = r.source ?? "Unknown";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);

    if (source === "Migrated member") continue;
    const seen = Date.parse(r.first_seen_at);
    const age = now - seen;
    if (age >= 0 && age < 30 * DAY) d.new30 += 1;
    else if (age >= 30 * DAY && age < 60 * DAY) d.newPrev30 += 1;
    const w = weekIndex.get(mondayOf(seen));
    if (w !== undefined) weeks[w][r.audience] += 1;
  }

  d.accounts = d.active + d.pending;
  const sorted = [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]);
  d.sources = sorted
    .slice(0, TOP_SOURCES)
    .map(([label, count]) => ({ label, count }));
  const rest = sorted.slice(TOP_SOURCES).reduce((n, [, c]) => n + c, 0);
  if (rest > 0) d.sources.push({ label: "Other", count: rest });

  return d;
}
