import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { missingDetails, type DetailKey } from "./member-details";

/**
 * Member details completion for admins (7 Nov 2026): who has given the
 * required details (phone, location, job title, experience, CV, consent),
 * overall, by field and by pod, and who still needs a reminder. Counts active,
 * activated members only (operations accounts are exempt from the step;
 * members who never activated can't sign in to complete it).
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;
type Row = Record<string, unknown>;

export const NUDGE_COOLDOWN_DAYS = 3;

export type IncompleteMember = {
  id: string;
  name: string;
  email: string;
  missing: DetailKey[];
  pods: string[];
  lastSignIn: string | null;
  lastNudged: string | null;
};

export type DetailsReport = {
  total: number;
  complete: number;
  notActivated: number;
  missingByField: Record<DetailKey, number>;
  pods: {
    id: string;
    name: string;
    slug: string;
    members: number;
    complete: number;
  }[];
  incomplete: IncompleteMember[];
};

async function all(
  build: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Row[];
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

async function authUsers(admin: Admin) {
  const out = new Map<string, { email: string; lastSignIn: string | null }>();
  for (let page = 1; page < 50; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    for (const u of users)
      out.set(u.id, {
        email: u.email ?? "",
        lastSignIn: u.last_sign_in_at ?? null,
      });
    if (users.length < 1000) break;
  }
  return out;
}

export async function loadDetailsReport(): Promise<DetailsReport> {
  const admin = getSupabaseAdmin();
  const since = new Date(
    Date.now() - NUDGE_COOLDOWN_DAYS * 86_400_000,
  ).toISOString();
  const [members, profiles, contacts, memberships, pods, nudges, users] =
    await Promise.all([
      all((a, b) =>
        admin
          .from("members")
          .select("id, status, role, claimed_at")
          .order("id")
          .range(a, b),
      ),
      all((a, b) =>
        admin
          .from("profiles")
          .select(
            "member_id, full_name, location, job_title, years_experience, resume_path",
          )
          .order("member_id")
          .range(a, b),
      ),
      all((a, b) =>
        admin
          .from("member_contact")
          .select("member_id, phone, consent_at")
          .order("member_id")
          .range(a, b),
      ),
      all((a, b) =>
        admin
          .from("pod_memberships")
          .select("member_id, pod_id")
          .order("member_id")
          .order("pod_id")
          .range(a, b),
      ),
      admin
        .from("pods")
        .select("id, name, slug, is_main")
        .eq("is_main", false)
        .order("name"),
      all((a, b) =>
        admin
          .from("audit_log")
          .select("target_id, created_at")
          .eq("action", "member.details_nudged")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .order("id")
          .range(a, b),
      ),
      authUsers(admin),
    ]);

  const profileBy = new Map(profiles.map((p) => [p.member_id as string, p]));
  const contactBy = new Map(contacts.map((c) => [c.member_id as string, c]));
  const lastNudge = new Map<string, string>();
  for (const n of nudges) {
    const id = n.target_id as string;
    if (!lastNudge.has(id)) lastNudge.set(id, n.created_at as string);
  }
  const podList = (pods.data ?? []) as {
    id: string;
    name: string;
    slug: string;
  }[];
  const podName = new Map(podList.map((p) => [p.id, p.name]));
  const podsOf = new Map<string, string[]>();
  for (const m of memberships) {
    const list = podsOf.get(m.member_id as string) ?? [];
    list.push(m.pod_id as string);
    podsOf.set(m.member_id as string, list);
  }

  const missingByField = {
    fullName: 0,
    phone: 0,
    location: 0,
    jobTitle: 0,
    yearsExperience: 0,
    cv: 0,
    consent: 0,
  } as Record<DetailKey, number>;
  const podStats = new Map(
    podList.map((p) => [p.id, { members: 0, complete: 0 }]),
  );
  const incomplete: IncompleteMember[] = [];
  let total = 0;
  let complete = 0;
  let notActivated = 0;

  for (const m of members) {
    if (m.status !== "active" || m.role === "operations") continue;
    if (!m.claimed_at) {
      notActivated++;
      continue;
    }
    total++;
    const id = m.id as string;
    const p = profileBy.get(id);
    const c = contactBy.get(id);
    const missing = missingDetails({
      fullName: (p?.full_name as string) ?? null,
      phone: (c?.phone as string) ?? null,
      location: (p?.location as string) ?? null,
      jobTitle: (p?.job_title as string) ?? null,
      yearsExperience: (p?.years_experience as number | null) ?? null,
      hasCv: Boolean(p?.resume_path),
      consentAt: (c?.consent_at as string) ?? null,
    });
    const memberPods = (podsOf.get(id) ?? []).filter((pid) =>
      podStats.has(pid),
    );
    for (const pid of memberPods) {
      const s = podStats.get(pid)!;
      s.members++;
      if (!missing.length) s.complete++;
    }
    if (!missing.length) {
      complete++;
      continue;
    }
    for (const k of missing) missingByField[k]++;
    const u = users.get(id);
    incomplete.push({
      id,
      name: (p?.full_name as string) || "Unnamed member",
      email: u?.email ?? "",
      missing,
      pods: memberPods.map((pid) => podName.get(pid) ?? "").filter(Boolean),
      lastSignIn: u?.lastSignIn ?? null,
      lastNudged: lastNudge.get(id) ?? null,
    });
  }

  incomplete.sort(
    (a, b) =>
      b.missing.length - a.missing.length || a.name.localeCompare(b.name),
  );
  return {
    total,
    complete,
    notActivated,
    missingByField,
    pods: podList
      .map((p) => ({ ...p, ...podStats.get(p.id)! }))
      .filter((p) => p.members > 0)
      .sort((a, b) => a.complete / a.members - b.complete / b.members),
    incomplete,
  };
}
