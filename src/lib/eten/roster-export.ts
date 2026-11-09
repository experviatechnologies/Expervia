import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toCsv } from "@/lib/csv";
import { missingDetails } from "./member-details";

/**
 * A pod's member roster as CSV for its Pod Leaders and ETEN staff (7 Nov
 * 2026): contact details, experience, skills, certifications and a CV link.
 * Read with service_role; the caller has already checked the viewer may export
 * this pod (canExportPodRoster). The CV link opens only for permitted viewers
 * (/api/members/<id>/cv), so the file itself never leaves the private bucket.
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;

const ROLE: Record<string, string> = {
  lead: "Pod Leader",
  co_lead: "Backup leader",
  member: "Member",
};

async function emailsFor(admin: Admin, ids: Set<string>) {
  const out = new Map<string, string>();
  for (let page = 1; page < 50 && out.size < ids.size; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    for (const u of users) if (ids.has(u.id) && u.email) out.set(u.id, u.email);
    if (users.length < 1000) break;
  }
  return out;
}

const day = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Africa/Lagos",
      })
    : "";

export async function buildPodRosterCsv(
  podId: string,
  origin: string,
): Promise<{ csv: string; count: number }> {
  const admin = getSupabaseAdmin();
  const { data: memberships, error } = await admin
    .from("pod_memberships")
    .select("member_id, role_in_pod, joined_at")
    .eq("pod_id", podId);
  if (error) throw new Error(error.message);
  const rows = memberships ?? [];
  const ids = rows.map((r) => r.member_id as string);
  if (!ids.length) {
    return { csv: toCsv(HEADERS, []), count: 0 };
  }

  const [profiles, contacts, members, skills, certs, emails] =
    await Promise.all([
      admin
        .from("profiles")
        .select(
          "member_id, full_name, location, job_title, years_experience, resume_path",
        )
        .in("member_id", ids),
      admin
        .from("member_contact")
        .select("member_id, phone, linkedin_url, consent_at")
        .in("member_id", ids),
      admin.from("members").select("id, status, v_level").in("id", ids),
      admin
        .from("member_skills")
        .select("member_id, level, skills(name)")
        .in("member_id", ids),
      admin
        .from("certifications")
        .select("member_id, name, verification_status")
        .in("member_id", ids),
      emailsFor(admin, new Set(ids)),
    ]);

  const by = <T extends { member_id: string }>(list: T[] | null) => {
    const m = new Map<string, T[]>();
    for (const r of list ?? []) {
      const arr = m.get(r.member_id) ?? [];
      arr.push(r);
      m.set(r.member_id, arr);
    }
    return m;
  };
  const profileBy = new Map(
    (profiles.data ?? []).map((p) => [p.member_id as string, p]),
  );
  // member_contact may not exist before migration 59: contact columns stay empty.
  const contactBy = new Map(
    (contacts.data ?? []).map((c) => [c.member_id as string, c]),
  );
  const memberBy = new Map(
    (members.data ?? []).map((m) => [m.id as string, m]),
  );
  const skillsBy = by(
    skills.data as unknown as {
      member_id: string;
      level: string | null;
      skills: { name: string } | null;
    }[],
  );
  const certsBy = by(
    certs.data as {
      member_id: string;
      name: string;
      verification_status: string;
    }[],
  );

  const order: Record<string, number> = { lead: 0, co_lead: 1, member: 2 };
  const out = rows
    .map((r) => {
      const id = r.member_id as string;
      const p = profileBy.get(id);
      const c = contactBy.get(id);
      const m = memberBy.get(id);
      const complete =
        missingDetails({
          fullName: (p?.full_name as string) ?? null,
          phone: (c?.phone as string) ?? null,
          location: (p?.location as string) ?? null,
          jobTitle: (p?.job_title as string) ?? null,
          yearsExperience: (p?.years_experience as number | null) ?? null,
          hasCv: Boolean(p?.resume_path),
          consentAt: (c?.consent_at as string) ?? null,
        }).length === 0;
      return {
        sort: [
          order[r.role_in_pod as string] ?? 3,
          String(p?.full_name ?? ""),
        ] as const,
        cells: [
          (p?.full_name as string) ?? "",
          emails.get(id) ?? "",
          (c?.phone as string) ?? "",
          (p?.location as string) ?? "",
          (p?.job_title as string) ?? "",
          (p?.years_experience as number | null) ?? "",
          (skillsBy.get(id) ?? [])
            .map((s) =>
              s.skills?.name
                ? `${s.skills.name}${s.level ? ` (${s.level})` : ""}`
                : "",
            )
            .filter(Boolean)
            .join("; "),
          (certsBy.get(id) ?? [])
            .map(
              (x) =>
                `${x.name}${x.verification_status === "verified" ? " (verified)" : ""}`,
            )
            .join("; "),
          p?.resume_path ? `${origin}/api/members/${id}/cv` : "",
          (c?.linkedin_url as string) ?? "",
          ROLE[r.role_in_pod as string] ?? (r.role_in_pod as string),
          m?.v_level != null ? `V${m.v_level}` : "",
          (m?.status as string) ?? "",
          complete ? "Yes" : "No",
          day(r.joined_at as string | null),
        ],
      };
    })
    .sort(
      (a, b) => a.sort[0] - b.sort[0] || a.sort[1].localeCompare(b.sort[1]),
    );

  return {
    csv: toCsv(
      HEADERS,
      out.map((o) => o.cells),
    ),
    count: out.length,
  };
}

const HEADERS = [
  "Name",
  "Email",
  "Phone",
  "Location",
  "Job title",
  "Years of experience",
  "Skills",
  "Certifications",
  "CV (sign in to open)",
  "LinkedIn",
  "Role in pod",
  "V-level",
  "Account status",
  "Details complete",
  "Joined pod",
];
