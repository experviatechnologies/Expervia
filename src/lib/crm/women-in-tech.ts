import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * The Women in Tech segment: contacts whose communities include
 * 'women-in-tech' (set when someone joins through /join?community=
 * women-in-tech). Callers must have checked getCrmSession() first.
 */

const COMMUNITY = "women-in-tech";
const DAY = 86_400_000;
const WEEKS = 8;

export type WitMember = {
  contactId: string;
  name: string;
  email: string | null;
  location: string | null;
  joinedAt: string;
  account: "active" | "pending" | "none";
  pods: string[];
  mentorship: "mentor" | "mentee" | null;
};

export type WitOverview = {
  members: WitMember[];
  activated: number;
  new30: number;
  weeks: { start: string; count: number }[];
  locations: { label: string; count: number }[];
  pods: { label: string; count: number }[];
  mentors: number;
  mentees: number;
  /** Women in the CRM (gender recorded) who have not joined yet. */
  outreach: {
    contactId: string;
    name: string;
    email: string | null;
    source: string | null;
  }[];
  outreachTotal: number;
};

type Raw = {
  id: string;
  member_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  city: string | null;
  country: string | null;
  first_seen_at: string;
  account:
    | { claimed_at: string | null }
    | { claimed_at: string | null }[]
    | null;
};

const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

function mondayOf(ms: number): string {
  const lagos = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ms);
  const d = new Date(`${lagos}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - dow * DAY).toISOString().slice(0, 10);
}

/** "lagos, Nigeria" and "Lagos" both count as "Lagos". */
function cityOf(location: string | null): string {
  const city = (location ?? "").split(",")[0].trim().replace(/\s+/g, " ");
  if (!city) return "Not recorded";
  return city
    .toLowerCase()
    .replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase())
    .replace(/ And /g, " and ");
}

function tally(values: string[], top = 6) {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  const sorted = [...m.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const out = sorted.slice(0, top).map(([label, count]) => ({ label, count }));
  const rest = sorted.slice(top).reduce((n, [, c]) => n + c, 0);
  if (rest) out.push({ label: "Other", count: rest });
  return out;
}

export async function loadWomenInTech(): Promise<WitOverview> {
  const admin = getSupabaseAdmin();
  const [{ data, error }, outreach] = await Promise.all([
    admin
      .from("crm_contacts")
      .select(
        "id, member_id, first_name, last_name, email, city, country, first_seen_at, account:members!crm_contacts_member_id_fkey(claimed_at)",
      )
      .contains("communities", [COMMUNITY])
      .order("first_seen_at", { ascending: false })
      .limit(2000),
    admin
      .from("crm_contacts")
      .select("id, first_name, last_name, email, source", { count: "exact" })
      .eq("gender", "female")
      .not("communities", "cs", `{${COMMUNITY}}`)
      .order("first_seen_at", { ascending: false })
      .limit(10),
  ]);
  if (error) throw new Error(`Could not load Women in Tech: ${error.message}`);
  const rows = (data ?? []) as Raw[];

  const memberIds = rows.map((r) => r.member_id).filter(Boolean) as string[];
  const [profiles, pods, members, mentors] = memberIds.length
    ? await Promise.all([
        admin
          .from("profiles")
          .select("member_id, location")
          .in("member_id", memberIds),
        admin
          .from("pod_memberships")
          .select("member_id, pods!inner(name, is_main)")
          .in("member_id", memberIds),
        admin
          .from("members")
          .select("id, mentorship_intent")
          .in("id", memberIds),
        admin
          .from("mentor_profiles")
          .select("member_id")
          .in("member_id", memberIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const locationById = new Map(
    (profiles.data ?? []).map((p) => [
      p.member_id as string,
      p.location as string | null,
    ]),
  );
  const podsById = new Map<string, string[]>();
  for (const row of pods.data ?? []) {
    const pod = one(
      row.pods as unknown as
        | { name: string; is_main: boolean }
        | { name: string; is_main: boolean }[],
    );
    if (!pod || pod.is_main) continue;
    const list = podsById.get(row.member_id as string) ?? [];
    list.push(pod.name);
    podsById.set(row.member_id as string, list);
  }
  const intentById = new Map(
    (members.data ?? []).map((m) => [
      m.id as string,
      m.mentorship_intent as string | null,
    ]),
  );
  const mentorIds = new Set(
    (mentors.data ?? []).map((m) => m.member_id as string),
  );

  const witMembers: WitMember[] = rows.map((r) => {
    const acc = one(r.account);
    const id = r.member_id;
    const mentorship = id
      ? mentorIds.has(id) || intentById.get(id) === "mentor"
        ? "mentor"
        : intentById.get(id) === "mentee"
          ? "mentee"
          : null
      : null;
    return {
      contactId: r.id,
      name: `${r.first_name} ${r.last_name}`.trim() || "No name",
      email: r.email,
      location:
        (id ? locationById.get(id) : null) ??
        ([r.city, r.country].filter(Boolean).join(", ") || null),
      joinedAt: r.first_seen_at,
      account: !id || !acc ? "none" : acc.claimed_at ? "active" : "pending",
      pods: (id ? podsById.get(id) : null)?.sort() ?? [],
      mentorship,
    };
  });

  const now = Date.now();
  const thisMonday = mondayOf(now);
  const weeks = Array.from({ length: WEEKS }, (_, i) => ({
    start: new Date(
      Date.parse(`${thisMonday}T00:00:00Z`) - (WEEKS - 1 - i) * 7 * DAY,
    )
      .toISOString()
      .slice(0, 10),
    count: 0,
  }));
  const weekIndex = new Map(weeks.map((w, i) => [w.start, i]));
  for (const m of witMembers) {
    const i = weekIndex.get(mondayOf(Date.parse(m.joinedAt)));
    if (i !== undefined) weeks[i].count += 1;
  }

  return {
    members: witMembers,
    activated: witMembers.filter((m) => m.account === "active").length,
    new30: witMembers.filter((m) => now - Date.parse(m.joinedAt) < 30 * DAY)
      .length,
    weeks,
    locations: tally(witMembers.map((m) => cityOf(m.location))),
    pods: tally(witMembers.flatMap((m) => m.pods)),
    mentors: witMembers.filter((m) => m.mentorship === "mentor").length,
    mentees: witMembers.filter((m) => m.mentorship === "mentee").length,
    outreach: (outreach.data ?? []).map((c) => ({
      contactId: c.id,
      name: `${c.first_name} ${c.last_name}`.trim() || "No name",
      email: c.email,
      source: c.source,
    })),
    outreachTotal: outreach.count ?? 0,
  };
}
