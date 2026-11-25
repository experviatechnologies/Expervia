import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Contacts list queries for the CRM (SQL 64 crm_contacts). Callers must have
 * checked getCrmSession() first: this reads with the service role so it can
 * join each contact's platform account (members) for the account status.
 */

export const CONTACT_VIEWS = [
  "all",
  "eten",
  "customer",
  "women-in-tech",
  "review",
] as const;
export type ContactView = (typeof CONTACT_VIEWS)[number];

export const ACCOUNT_FILTERS = ["any", "active", "pending", "none"] as const;
export type AccountFilter = (typeof ACCOUNT_FILTERS)[number];

export const CONTACT_SORTS = ["newest", "oldest", "name", "activity"] as const;
export type ContactSort = (typeof CONTACT_SORTS)[number];

export const GENDER_FILTERS = ["any", "female", "male"] as const;
export type GenderFilter = (typeof GENDER_FILTERS)[number];

export type ContactFilters = {
  view: ContactView;
  account: AccountFilter;
  sort: ContactSort;
  q: string;
  gender: GenderFilter;
};

/** Account status, from the linked members row. */
export type AccountStatus = "active" | "pending" | "none";

export type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  audience: "eten" | "customer";
  lifecycle: string;
  leadStatus: string;
  source: string | null;
  tags: string[];
  communities: string[];
  reviewReason: string | null;
  city: string | null;
  country: string | null;
  company: string | null;
  account: AccountStatus;
  firstSeenAt: string;
  lastActivityAt: string | null;
};

const pick = <T extends string>(
  list: readonly T[],
  value: unknown,
  fallback: T,
): T =>
  typeof value === "string" && (list as readonly string[]).includes(value)
    ? (value as T)
    : fallback;

/** Parse untrusted search params into safe filters. */
export function parseContactFilters(
  params: Record<string, string | string[] | undefined>,
): ContactFilters {
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    view: pick(CONTACT_VIEWS, one("view"), "all"),
    account: pick(ACCOUNT_FILTERS, one("account"), "any"),
    sort: pick(CONTACT_SORTS, one("sort"), "newest"),
    q: (one("q") ?? "").trim().slice(0, 100),
    gender: pick(GENDER_FILTERS, one("gender"), "any"),
  };
}

const BASE_COLUMNS =
  "id, first_name, last_name, email, phone, audience, lifecycle, lead_status, source, tags, communities, review_reason, city, country, first_seen_at, last_activity_at, crm_companies(name)";

type RawRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  audience: "eten" | "customer";
  lifecycle: string;
  lead_status: string;
  source: string | null;
  tags: string[] | null;
  communities: string[] | null;
  review_reason: string | null;
  city: string | null;
  country: string | null;
  first_seen_at: string;
  last_activity_at: string | null;
  crm_companies: { name: string } | { name: string }[] | null;
  account:
    | { claimed_at: string | null }
    | { claimed_at: string | null }[]
    | null;
};

const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

function toRow(r: RawRow): ContactRow {
  const member = one(r.account);
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    audience: r.audience,
    lifecycle: r.lifecycle,
    leadStatus: r.lead_status,
    source: r.source,
    tags: r.tags ?? [],
    communities: r.communities ?? [],
    reviewReason: r.review_reason,
    city: r.city,
    country: r.country,
    company: one(r.crm_companies)?.name ?? null,
    account: !member ? "none" : member.claimed_at ? "active" : "pending",
    firstSeenAt: r.first_seen_at,
    lastActivityAt: r.last_activity_at,
  };
}

/**
 * Words for a PostgREST or() filter: drop the characters that have meaning in
 * its syntax so a search can never change the query.
 */
function searchTerms(q: string): string[] {
  return q
    .replace(/[,()*%\\:"']/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
}

// Builder type kept loose on purpose: supabase-js generics without generated
// DB types add noise and no safety here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any;

function buildQuery(
  admin: SupabaseClient,
  f: ContactFilters,
  options: { count?: boolean } = {},
): Query {
  // The person's own account (not owner_id, which also points at members).
  // An account filter needs an inner join so it can filter on it.
  const join =
    f.account === "active" || f.account === "pending"
      ? "account:members!crm_contacts_member_id_fkey!inner(claimed_at)"
      : "account:members!crm_contacts_member_id_fkey(claimed_at)";
  let q: Query = admin.from("crm_contacts").select(`${BASE_COLUMNS}, ${join}`, {
    count: options.count ? "exact" : undefined,
  });

  if (f.view === "eten" || f.view === "customer") q = q.eq("audience", f.view);
  if (f.view === "women-in-tech")
    q = q.contains("communities", ["women-in-tech"]);
  if (f.view === "review") q = q.not("review_reason", "is", null);

  if (f.account === "active") q = q.not("account.claimed_at", "is", null);
  if (f.account === "pending") q = q.is("account.claimed_at", null);
  if (f.account === "none") q = q.is("member_id", null);
  if (f.gender !== "any") q = q.eq("gender", f.gender);

  for (const t of searchTerms(f.q)) {
    const like = `%${t}%`;
    q = q.or(
      `first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`,
    );
  }

  switch (f.sort) {
    case "oldest":
      q = q.order("first_seen_at", { ascending: true });
      break;
    case "name":
      q = q
        .order("first_name", { ascending: true })
        .order("last_name", { ascending: true });
      break;
    case "activity":
      q = q.order("last_activity_at", { ascending: false, nullsFirst: false });
      break;
    default:
      q = q.order("first_seen_at", { ascending: false });
  }
  return q.order("id");
}

export async function listContacts(
  f: ContactFilters,
  page: number,
  pageSize: number,
): Promise<{ rows: ContactRow[]; total: number }> {
  const from = (page - 1) * pageSize;
  const { data, count, error } = await buildQuery(getSupabaseAdmin(), f, {
    count: true,
  }).range(from, from + pageSize - 1);
  if (error) throw new Error(`Could not load contacts: ${error.message}`);
  return { rows: ((data ?? []) as RawRow[]).map(toRow), total: count ?? 0 };
}

/** Every contact matching the filters (for CSV export), read in pages. */
export async function listAllContacts(
  f: ContactFilters,
): Promise<ContactRow[]> {
  const admin = getSupabaseAdmin();
  const rows: ContactRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await buildQuery(admin, f).range(from, from + 999);
    if (error) throw new Error(`Could not export contacts: ${error.message}`);
    rows.push(...((data ?? []) as RawRow[]).map(toRow));
    if (!data || data.length < 1000) return rows;
  }
}

/**
 * How many contacts each tab holds (ignores search and account filter).
 * A count that fails to load is null, so the page never shows a wrong 0.
 */
export async function contactViewCounts(): Promise<
  Record<ContactView, number | null>
> {
  const admin = getSupabaseAdmin();
  const head = () =>
    admin.from("crm_contacts").select("id", { count: "exact", head: true });
  const results = await Promise.all([
    head(),
    head().eq("audience", "eten"),
    head().eq("audience", "customer"),
    head().contains("communities", ["women-in-tech"]),
    head().not("review_reason", "is", null),
  ]);
  const [all, eten, customer, wit, review] = results.map((r) =>
    r.error ? null : (r.count ?? 0),
  );
  return { all, eten, customer, "women-in-tech": wit, review };
}
