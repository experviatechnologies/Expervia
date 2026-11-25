import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isUuid, type TimelineEntry } from "@/lib/crm/record";

/**
 * Companies for the CRM (SQL 64 crm_companies). Callers must have checked
 * getCrmSession() first (service-role reads).
 */

export const COMPANY_TYPES = [
  "customer",
  "prospect",
  "partner",
  "member_employer",
] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const COMPANY_VIEWS = ["all", ...COMPANY_TYPES] as const;
export type CompanyView = (typeof COMPANY_VIEWS)[number];

export const COMPANY_SORTS = ["name", "contacts", "newest"] as const;
export type CompanySort = (typeof COMPANY_SORTS)[number];

export type CompanyFilters = {
  view: CompanyView;
  sort: CompanySort;
  q: string;
};

export type CompanyRow = {
  id: string;
  name: string;
  type: CompanyType;
  industry: string | null;
  domain: string | null;
  city: string | null;
  country: string | null;
  contacts: number;
  createdAt: string;
};

export type CompanyRecord = CompanyRow & {
  phone: string | null;
  description: string | null;
  ownerId: string | null;
  people: {
    id: string;
    name: string;
    email: string | null;
    jobTitle: string | null;
    leadStatus: string;
  }[];
  timeline: TimelineEntry[];
};

const pick = <T extends string>(list: readonly T[], v: unknown, d: T): T =>
  typeof v === "string" && (list as readonly string[]).includes(v)
    ? (v as T)
    : d;

export function parseCompanyFilters(
  params: Record<string, string | string[] | undefined>,
): CompanyFilters {
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    view: pick(COMPANY_VIEWS, one("view"), "all"),
    sort: pick(COMPANY_SORTS, one("sort"), "name"),
    q: (one("q") ?? "").trim().slice(0, 100),
  };
}

type RawCompany = {
  id: string;
  name: string;
  type: CompanyType;
  industry: string | null;
  domain: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  crm_contacts: { count: number }[] | null;
};

const toRow = (c: RawCompany): CompanyRow => ({
  id: c.id,
  name: c.name,
  type: c.type,
  industry: c.industry,
  domain: c.domain,
  city: c.city,
  country: c.country,
  contacts: c.crm_contacts?.[0]?.count ?? 0,
  createdAt: c.created_at,
});

/**
 * All companies matching the filters. There are few enough (hundreds) to load
 * at once, which also lets "most contacts" sort on the embedded count.
 */
export async function listCompanies(f: CompanyFilters): Promise<CompanyRow[]> {
  let q = getSupabaseAdmin()
    .from("crm_companies")
    .select(
      "id, name, type, industry, domain, city, country, created_at, crm_contacts(count)",
    )
    .limit(1000);
  if (f.view !== "all") q = q.eq("type", f.view);
  const term = f.q.replace(/[,()*%\\:"']/g, " ").trim();
  if (term) q = q.or(`name.ilike.%${term}%,domain.ilike.%${term}%`);
  const { data, error } = await q;
  if (error) throw new Error(`Could not load companies: ${error.message}`);

  const rows = ((data ?? []) as RawCompany[]).map(toRow);
  rows.sort((a, b) =>
    f.sort === "contacts"
      ? b.contacts - a.contacts || a.name.localeCompare(b.name)
      : f.sort === "newest"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.name.localeCompare(b.name),
  );
  return rows;
}

export async function companyTypeCounts(): Promise<
  Record<CompanyView, number | null>
> {
  const admin = getSupabaseAdmin();
  const head = () =>
    admin.from("crm_companies").select("id", { count: "exact", head: true });
  const results = await Promise.all([
    head(),
    ...COMPANY_TYPES.map((t) => head().eq("type", t)),
  ]);
  const counts = results.map((r) => (r.error ? null : (r.count ?? 0)));
  return Object.fromEntries(
    COMPANY_VIEWS.map((v, i) => [v, counts[i]]),
  ) as Record<CompanyView, number | null>;
}

export async function getCompanyRecord(
  id: string,
): Promise<CompanyRecord | null> {
  if (!isUuid(id)) return null;
  const admin = getSupabaseAdmin();
  const { data: c, error } = await admin
    .from("crm_companies")
    .select(
      "id, name, type, industry, domain, city, country, phone, description, owner_id, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load the company: ${error.message}`);
  if (!c) return null;

  const [people, activities] = await Promise.all([
    admin
      .from("crm_contacts")
      .select("id, first_name, last_name, email, job_title, lead_status")
      .eq("company_id", id)
      .order("first_name")
      .limit(500),
    admin
      .from("crm_activities")
      .select(
        "id, type, product, event, subject, body, payload, actor_id, occurred_at",
      )
      .eq("company_id", id)
      .order("occurred_at", { ascending: false })
      .limit(200),
  ]);

  const actorIds = [
    ...new Set((activities.data ?? []).map((a) => a.actor_id).filter(Boolean)),
  ] as string[];
  const names = new Map<string, string>();
  if (actorIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("member_id, full_name")
      .in("member_id", actorIds);
    for (const p of profiles ?? []) names.set(p.member_id, p.full_name);
  }

  return {
    id: c.id,
    name: c.name,
    type: c.type,
    industry: c.industry,
    domain: c.domain,
    city: c.city,
    country: c.country,
    phone: c.phone,
    description: c.description,
    ownerId: c.owner_id,
    createdAt: c.created_at,
    contacts: people.data?.length ?? 0,
    people: (people.data ?? []).map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`.trim() || "No name",
      email: p.email,
      jobTitle: p.job_title,
      leadStatus: p.lead_status,
    })),
    timeline: (activities.data ?? []).map((a) => ({
      id: a.id,
      type: a.type,
      product: a.product,
      event: a.event,
      subject: a.subject,
      body: a.body,
      outcome:
        typeof a.payload?.outcome === "string" ? a.payload.outcome : null,
      actorName: a.actor_id ? (names.get(a.actor_id) ?? "Staff member") : null,
      occurredAt: a.occurred_at,
    })),
  };
}
