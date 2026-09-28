import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { RequestControl } from "./request-control";

export const metadata = { title: "Find a mentor" };

const TIER_LABEL: Record<string, string> = {
  verified: "Verified Mentor",
  senior: "Senior Mentor",
  expert: "Expert Mentor",
  master: "Master Mentor",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const { area } = await searchParams;
  const me = await getCurrentMember();
  if (!me) redirect("/mentorship/signin");

  const admin = getSupabaseAdmin();

  const [
    { data: meRow },
    { data: mentorRows },
    { data: areaRows },
    { data: reqRows },
  ] = await Promise.all([
    admin.from("members").select("validated_at").eq("id", me.id).maybeSingle(),
    admin
      .from("mentor_profiles")
      .select("member_id, mentor_status, capability_area_id, verified_at")
      .neq("mentor_status", "candidate")
      .neq("member_id", me.id),
    admin
      .from("capability_areas")
      .select("id, slug, label")
      .eq("active", true)
      .order("sort_order"),
    admin
      .from("mentorship_requests")
      .select("mentor_id, status, created_at")
      .eq("mentee_id", me.id)
      .order("created_at", { ascending: false }),
  ]);

  const isValidated = Boolean(meRow?.validated_at);
  const areas = areaRows ?? [];
  const areaById = new Map(areas.map((a) => [a.id, a.label]));
  const areaId = area ? (areas.find((a) => a.slug === area)?.id ?? null) : null;

  const mentors = (mentorRows ?? []).filter(
    (m) => !areaId || m.capability_area_id === areaId,
  );

  // Names for the mentor cards.
  const { data: profileRows } = mentors.length
    ? await admin
        .from("profiles")
        .select("member_id, full_name, headline")
        .in(
          "member_id",
          mentors.map((m) => m.member_id),
        )
    : { data: [] };
  const profileById = new Map(
    (profileRows ?? []).map((p) => [
      p.member_id,
      {
        name: p.full_name ?? "A mentor",
        headline: p.headline as string | null,
      },
    ]),
  );

  // Latest request status per mentor (rows are newest-first).
  const reqByMentor = new Map<string, "pending" | "accepted" | "declined">();
  for (const r of reqRows ?? []) {
    if (!reqByMentor.has(r.mentor_id) && r.status !== "withdrawn") {
      reqByMentor.set(
        r.mentor_id,
        r.status as "pending" | "accepted" | "declined",
      );
    }
  }

  return (
    <div className="mx-auto max-w-[1140px] px-6 py-8">
      <Link
        href="/mentorship/dashboard"
        className="text-mnt-faint hover:text-mnt-ink text-[13px]"
      >
        ← Back to dashboard
      </Link>

      <header className="mt-3">
        <h1 className="font-display text-2xl font-extrabold">Find a mentor</h1>
        <p className="text-mnt-ink-muted mt-1 text-[14px]">
          Browse verified mentors and request 1:1 guidance in your capability
          area.
        </p>
      </header>

      {!isValidated && (
        <div className="border-mnt-amber/30 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 [background:rgba(245,177,61,0.06)]">
          <p className="text-mnt-ink-muted text-[13.5px]">
            Validate your account to request mentorship.
          </p>
          <Link
            href="/mentorship/validate"
            className="bg-mnt-amber rounded-[10px] px-4 py-2 text-[13px] font-bold text-[#241a05]"
          >
            Validate now
          </Link>
        </div>
      )}

      {/* Area filter */}
      <div className="mt-5 flex flex-wrap gap-2">
        <FilterChip
          label="All areas"
          href="/mentorship/mentors"
          active={!areaId}
        />
        {areas.map((a) => (
          <FilterChip
            key={a.id}
            label={a.label}
            href={`/mentorship/mentors?area=${a.slug}`}
            active={areaId === a.id}
          />
        ))}
      </div>

      {mentors.length === 0 ? (
        <div className="border-mnt-line text-mnt-faint mt-6 rounded-2xl border border-dashed p-10 text-center text-[14px]">
          No verified mentors in this area yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {mentors.map((m) => {
            const p = profileById.get(m.member_id);
            const name = p?.name ?? "A mentor";
            return (
              <div
                key={m.member_id}
                className="bg-mnt-panel border-mnt-line rounded-2xl border p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-mnt-brand/14 text-mnt-brand font-display grid size-11 shrink-0 place-items-center rounded-full text-[15px] font-bold">
                    {initials(name)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold">{name}</div>
                    <div className="text-mnt-green font-mono text-[10.5px]">
                      {TIER_LABEL[m.mentor_status] ?? "Verified Mentor"}
                    </div>
                  </div>
                </div>
                {p?.headline && (
                  <p className="text-mnt-ink-muted mt-3 line-clamp-2 text-[13px]">
                    {p.headline}
                  </p>
                )}
                {m.capability_area_id && (
                  <div className="text-mnt-faint mt-2 text-[12.5px]">
                    {areaById.get(m.capability_area_id) ?? ""}
                  </div>
                )}
                <div className="mt-4">
                  <RequestControl
                    mentorId={m.member_id}
                    initialStatus={reqByMentor.get(m.member_id) ?? null}
                    canRequest={isValidated}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors " +
        (active
          ? "border-mnt-brand bg-mnt-brand/10 text-mnt-ink"
          : "border-mnt-line text-mnt-ink-muted hover:text-mnt-ink")
      }
    >
      {label}
    </Link>
  );
}
