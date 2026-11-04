import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toCsv } from "@/lib/csv";
import { DownloadCsvButton } from "@/components/shared/download-csv-button";
import { SystemHealth } from "./system-health";

export const metadata: Metadata = {
  title: "Tracker readiness",
  robots: { index: false, follow: false },
};

type Admin = ReturnType<typeof getSupabaseAdmin>;

/** PostgREST caps a request at 1,000 rows; page through larger tables. */
async function fetchAll<T>(
  build: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

async function loadEmails(admin: Admin): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error || !data?.users?.length) break;
    for (const u of data.users) if (u.email) emails.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }
  return emails;
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

/**
 * Presales tracker readiness (Phase 3, step 3.4): is the live ETEN data good
 * enough for the tracker to work? Per pod: leader and backup set, engineers
 * with skills, known seniority and declared presales availability. Plus the
 * people who need a nudge, exportable for outreach.
 */
export default async function TrackerReadinessPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();
  let loaded;
  try {
    loaded = await Promise.all([
      admin.from("pods").select("id, slug, name, is_main").order("name"),
      fetchAll<{ id: string; status: string; claimed_at: string | null }>(
        (a, b) =>
          admin
            .from("members")
            .select("id, status, claimed_at")
            .order("id")
            .range(a, b),
      ),
      fetchAll<{ member_id: string; full_name: string | null }>((a, b) =>
        admin
          .from("profiles")
          .select("member_id, full_name")
          .order("member_id")
          .range(a, b),
      ),
      fetchAll<{
        id: string;
        pod_id: string;
        member_id: string;
        role_in_pod: string;
      }>((a, b) =>
        admin
          .from("pod_memberships")
          .select("id, pod_id, member_id, role_in_pod")
          .order("id")
          .range(a, b),
      ),
      fetchAll<{
        member_id: string;
        opted_in: boolean;
        seniority: string | null;
        availability_reviewed_at: string | null;
      }>((a, b) =>
        admin
          .from("presales_profiles")
          .select("member_id, opted_in, seniority, availability_reviewed_at")
          .order("member_id")
          .range(a, b),
      ),
      fetchAll<{ member_id: string }>((a, b) =>
        admin
          .from("member_skills")
          .select("member_id")
          .order("member_id")
          .order("skill_id")
          .range(a, b),
      ),
      fetchAll<{ mentor_id: string }>((a, b) =>
        admin
          .from("mentor_availability")
          .select("mentor_id")
          .contains("purposes", ["presales"])
          .eq("is_active", true)
          .order("id")
          .range(a, b),
      ),
      admin
        .from("presales_settings")
        .select("fresh_days")
        .eq("id", true)
        .maybeSingle(),
      loadEmails(admin),
    ]);
  } catch (e) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-eten-ink text-2xl font-extrabold">
          Tracker readiness
        </h1>
        <p className="text-eten-ink-muted mt-3 text-sm">
          Couldn&apos;t load the tracker data. Make sure migrations 46 to 49
          have been run in Supabase.
        </p>
        <p className="text-eten-faint mt-2 font-mono text-xs">
          {e instanceof Error ? e.message : String(e)}
        </p>
      </div>
    );
  }
  const [
    { data: podRows },
    members,
    profiles,
    memberships,
    presales,
    skillRows,
    windows,
    { data: settings },
    emails,
  ] = loaded;

  const freshDays = settings?.fresh_days ?? 14;
  // Request-time clock (server component: rendered once per request).
  const freshCutoff = new Date().getTime() - freshDays * 86_400_000;
  const pods = (podRows ?? []).filter((p) => !p.is_main);
  const specialistIds = new Set(pods.map((p) => p.id));
  const nameOf = new Map(
    profiles.map((p) => [p.member_id, p.full_name ?? "Unnamed member"]),
  );
  const memberById = new Map(members.map((m) => [m.id, m]));
  const presalesBy = new Map(presales.map((p) => [p.member_id, p]));
  const withSkills = new Set(skillRows.map((s) => s.member_id));
  const withWindows = new Set(windows.map((w) => w.mentor_id));
  const activeIds = new Set(
    members.filter((m) => m.status === "active").map((m) => m.id),
  );

  // Engineers: active members of at least one specialist pod.
  const podsOf = new Map<string, string[]>();
  for (const m of memberships) {
    if (!specialistIds.has(m.pod_id) || !activeIds.has(m.member_id)) continue;
    podsOf.set(m.member_id, [...(podsOf.get(m.member_id) ?? []), m.pod_id]);
  }
  const engineers = [...podsOf.keys()];
  const activated = (id: string) => Boolean(memberById.get(id)?.claimed_at);
  const optedIn = (id: string) => presalesBy.get(id)?.opted_in ?? false;
  const fresh = (id: string) => {
    const r = presalesBy.get(id)?.availability_reviewed_at;
    return r ? Date.parse(r) >= freshCutoff : false;
  };

  const totals = {
    engineers: engineers.length,
    activated: engineers.filter(activated).length,
    profiles: engineers.filter((id) => presalesBy.has(id)).length,
    optedIn: engineers.filter(optedIn).length,
    skills: engineers.filter((id) => withSkills.has(id)).length,
    seniority: engineers.filter((id) => presalesBy.get(id)?.seniority).length,
    availability: engineers.filter((id) => withWindows.has(id)).length,
    fresh: engineers.filter(fresh).length,
  };

  const podRowsOut = pods.map((pod) => {
    const rows = memberships.filter((m) => m.pod_id === pod.id);
    const lead = rows.find((m) => m.role_in_pod === "lead");
    const backup = rows.find((m) => m.role_in_pod === "co_lead");
    const people = rows
      .map((m) => m.member_id)
      .filter((id) => activeIds.has(id));
    return {
      pod,
      lead: lead ? nameOf.get(lead.member_id) : null,
      backup: backup ? nameOf.get(backup.member_id) : null,
      engineers: people.length,
      skills: people.filter((id) => withSkills.has(id)).length,
      seniority: people.filter((id) => presalesBy.get(id)?.seniority).length,
      availability: people.filter((id) => withWindows.has(id)).length,
    };
  });
  const podsWithLead = podRowsOut.filter((r) => r.lead).length;

  // People who need a nudge.
  const noPod = members
    .filter((m) => m.status === "active" && m.claimed_at && !podsOf.has(m.id))
    .map((m) => m.id);
  const neverActivated = members
    .filter((m) => m.status === "active" && !m.claimed_at)
    .map((m) => m.id);
  const noSkills = engineers.filter(
    (id) => activated(id) && !withSkills.has(id),
  );
  const noAvailability = engineers.filter(
    (id) => activated(id) && optedIn(id) && !withWindows.has(id),
  );
  const optedOut = engineers.filter((id) => presalesBy.has(id) && !optedIn(id));

  const groups = [
    {
      key: "no_pod",
      title: "Active members with no specialist pod",
      help: "Not in the tracker until they join a pod.",
      ids: noPod,
    },
    {
      key: "never_activated",
      title: "Accounts never activated",
      help: "Can't sign in to set availability or respond to invitations.",
      ids: neverActivated,
    },
    {
      key: "no_skills",
      title: "Engineers with no skills listed",
      help: "Pod Leaders and Sales can't match them on skills.",
      ids: noSkills,
    },
    {
      key: "no_availability",
      title: "Opted-in engineers with no presales availability",
      help: "Never selectable until they declare when they're free.",
      ids: noAvailability,
    },
    {
      key: "opted_out",
      title: "Engineers who opted out of presales",
      help: "Stepped back in their settings.",
      ids: optedOut,
    },
  ];
  const csv = toCsv(
    ["Group", "Name", "Email", "Pods"],
    groups.flatMap((g) =>
      g.ids.map((id) => [
        g.title,
        nameOf.get(id) ?? "",
        emails.get(id) ?? "",
        (podsOf.get(id) ?? [])
          .map((p) => pods.find((x) => x.id === p)?.name)
          .join("; "),
      ]),
    ),
  );

  const tiles = [
    {
      label: "Engineers",
      value: totals.engineers,
      sub: `${totals.activated} activated`,
    },
    {
      label: "Pods with a Pod Leader",
      value: `${podsWithLead}/${pods.length}`,
      sub: `${podRowsOut.filter((r) => r.backup).length} with a backup`,
      warn: podsWithLead < pods.length,
    },
    {
      label: "Presales profiles",
      value: totals.profiles,
      sub: `${totals.optedIn} opted in`,
      warn: totals.profiles < totals.engineers,
    },
    {
      label: "Skills listed",
      value: `${pct(totals.skills, totals.engineers)}%`,
      sub: `${totals.skills} of ${totals.engineers}`,
    },
    {
      label: "Seniority known",
      value: `${pct(totals.seniority, totals.engineers)}%`,
      sub: `${totals.seniority} of ${totals.engineers}`,
    },
    {
      label: "Presales availability declared",
      value: `${pct(totals.availability, totals.engineers)}%`,
      sub: `${totals.availability} of ${totals.engineers}`,
      warn: totals.availability === 0,
    },
    {
      label: `Reviewed in the last ${freshDays} days`,
      value: `${pct(totals.fresh, totals.engineers)}%`,
      sub: `${totals.fresh} of ${totals.engineers}`,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-7 md:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[680px]">
          <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
            Tracker readiness
          </h1>
          <p className="text-eten-ink-muted mt-1.5 text-sm">
            Is ETEN&apos;s live data ready for the Availability &amp; Presales
            Tracker? Every pod needs a Pod Leader to receive nomination
            requests, and engineers become selectable once they list skills and
            declare presales availability.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tracker"
            className="border-eten-line text-eten-ink hover:bg-eten-hover inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold"
          >
            Open the tracker <ExternalLink className="size-3.5" />
          </Link>
          <Link
            href="/admin/tracker-readiness/import"
            className="border-eten-line text-eten-ink hover:bg-eten-hover inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold"
          >
            Import roster
          </Link>
          <DownloadCsvButton
            csv={csv}
            filename="tracker-readiness-follow-ups.csv"
            label="Export follow-ups"
          />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="bg-eten-panel border-eten-line rounded-2xl border p-4"
          >
            <p className="text-eten-ink-muted text-[12.5px] leading-snug">
              {t.label}
            </p>
            <p
              className={
                "mt-1.5 text-[24px] font-extrabold " +
                (t.warn ? "text-amber-600" : "text-eten-ink")
              }
            >
              {t.value}
            </p>
            <p className="text-eten-faint text-[12px]">{t.sub}</p>
          </div>
        ))}
      </div>

      <section className="bg-eten-panel border-eten-line mt-6 overflow-hidden rounded-2xl border">
        <h2 className="text-eten-ink border-eten-line-soft border-b px-5 py-4 text-sm font-bold">
          Pods
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-eten-line-soft border-b text-left">
                {[
                  "Pod",
                  "Pod Leader",
                  "Backup",
                  "Engineers",
                  "Skills listed",
                  "Seniority known",
                  "Availability declared",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-eten-faint px-4 py-3 font-mono text-[11px] font-bold tracking-wider uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {podRowsOut.map((r) => (
                <tr
                  key={r.pod.id}
                  className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pods/${r.pod.slug}`}
                      className="text-eten-ink font-semibold hover:underline"
                    >
                      {r.pod.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {r.lead ? (
                      <span className="text-eten-ink inline-flex items-center gap-1.5">
                        <CheckCircle2
                          className="text-eten-verified size-4"
                          aria-hidden
                        />{" "}
                        {r.lead}
                      </span>
                    ) : (
                      <Link
                        href={`/admin/pods/${r.pod.slug}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-amber-600 hover:underline"
                      >
                        <AlertTriangle className="size-4" aria-hidden /> Assign
                      </Link>
                    )}
                  </td>
                  <td className="text-eten-ink-muted px-4 py-3">
                    {r.backup ?? (
                      <span className="text-eten-faint">Not set</span>
                    )}
                  </td>
                  <td className="text-eten-ink px-4 py-3 tabular-nums">
                    {r.engineers}
                  </td>
                  {[r.skills, r.seniority, r.availability].map((n, i) => (
                    <td key={i} className="px-4 py-3">
                      <span className="text-eten-ink tabular-nums">
                        {pct(n, r.engineers)}%
                      </span>
                      <span className="text-eten-faint ml-1.5 text-xs tabular-nums">
                        ({n})
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-eten-ink mb-3 text-sm font-bold">System health</h2>
        <SystemHealth />
      </section>

      <section className="mt-6">
        <h2 className="text-eten-ink mb-3 text-sm font-bold">Needs a nudge</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((g) => (
            <details
              key={g.key}
              className="bg-eten-panel border-eten-line group rounded-2xl border"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4">
                <span>
                  <span className="text-eten-ink block text-sm font-semibold">
                    {g.title}
                  </span>
                  <span className="text-eten-faint block text-xs">
                    {g.help}
                  </span>
                </span>
                <span className="text-eten-ink text-xl font-extrabold tabular-nums">
                  {g.ids.length}
                </span>
              </summary>
              {g.ids.length > 0 && (
                <ul className="border-eten-line-soft max-h-[320px] overflow-y-auto border-t px-4 py-2">
                  {g.ids
                    .map((id) => ({
                      id,
                      name: nameOf.get(id) ?? "Unnamed member",
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((p) => (
                      <li key={p.id} className="py-1 text-sm">
                        <Link
                          href={`/admin/members/${p.id}`}
                          className="text-eten-ink hover:underline"
                        >
                          {p.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </details>
          ))}
        </div>
        <p className="text-eten-faint mt-3 text-xs">
          Export follow-ups downloads every group above with names, emails and
          pods, for outreach. Members manage their own availability once the
          member-side tracker pages go live (Phase 4).
        </p>
      </section>
    </div>
  );
}
