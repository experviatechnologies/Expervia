import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { MntDashShell } from "@/components/mentorship/mnt-dash-shell";

export const metadata = { title: "Mentor dashboard" };

const lbl =
  "text-mnt-faint font-mono text-[10.5px] tracking-[0.13em] uppercase";

function initials(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function MentorDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mentorship/signin");

  const [{ data: member }, { data: profile }] = await Promise.all([
    supabase
      .from("members")
      .select("mentorship_intent")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("member_id", user.id)
      .maybeSingle(),
  ]);

  // Non-mentors get the mentee view.
  if (member?.mentorship_intent !== "mentor") redirect("/mentorship/dashboard");

  const name = profile?.full_name ?? "there";

  const { data: mp } = await supabase
    .from("mentor_profiles")
    .select("mentor_status, capability_area_id, verified_at")
    .eq("member_id", user.id)
    .maybeSingle();
  const verified = mp?.mentor_status === "verified";

  let areaLabel: string | null = null;
  if (mp?.capability_area_id) {
    const { data: area } = await supabase
      .from("capability_areas")
      .select("label")
      .eq("id", mp.capability_area_id)
      .maybeSingle();
    areaLabel = area?.label ?? null;
  }

  const { data: circleRows } = await supabase
    .from("mentorship_circles")
    .select("id, title, status")
    .eq("mentor_id", user.id)
    .order("created_at", { ascending: false });
  const circles = circleRows ?? [];

  let mentees = 0;
  let graduates = 0;
  let pending = 0;
  if (circles.length) {
    const ids = circles.map((c) => c.id);
    const [{ count: active }, { count: done }, { data: assignmentRows }] =
      await Promise.all([
        supabase
          .from("circle_memberships")
          .select("*", { count: "exact", head: true })
          .in("circle_id", ids)
          .eq("status", "active"),
        supabase
          .from("circle_memberships")
          .select("*", { count: "exact", head: true })
          .in("circle_id", ids)
          .eq("status", "completed"),
        supabase.from("circle_assignments").select("id").in("circle_id", ids),
      ]);
    mentees = active ?? 0;
    graduates = done ?? 0;
    const aIds = (assignmentRows ?? []).map((a) => a.id);
    if (aIds.length) {
      const { count: sub } = await supabase
        .from("evidence_submissions")
        .select("*", { count: "exact", head: true })
        .in("assignment_id", aIds)
        .eq("status", "submitted");
      pending = sub ?? 0;
    }
  }
  const activeCircles = circles.filter((c) => c.status === "active").length;

  const footer = verified ? (
    <div className="border-mnt-green/30 rounded-xl border p-3.5 [background:rgba(52,211,153,0.06)]">
      <div className="flex items-center gap-2">
        <span className="bg-mnt-green size-2 rounded-full" />
        <span className="text-mnt-green font-mono text-[10.5px] tracking-[0.1em] uppercase">
          Verified Mentor
        </span>
      </div>
      <p className="text-mnt-ink-muted mt-2 text-[12px] leading-relaxed">
        {areaLabel ? `${areaLabel} · ` : ""}Verified{" "}
        {fmtDate(mp?.verified_at ?? null)}
      </p>
    </div>
  ) : (
    <div className="border-mnt-amber/30 rounded-xl border p-3.5 [background:rgba(245,177,61,0.06)]">
      <div className="flex items-center gap-2">
        <span className="bg-mnt-amber size-2 rounded-full" />
        <span className="text-mnt-amber font-mono text-[10.5px] tracking-[0.1em] uppercase">
          Not yet verified
        </span>
      </div>
      <p className="text-mnt-ink-muted mt-2 text-[12px] leading-relaxed">
        The ETEN Readiness Panel verifies mentors before they can lead a Circle.
      </p>
    </div>
  );

  return (
    <MntDashShell
      user={{ initials: initials(profile?.full_name), name, role: "Mentor" }}
      nav={[
        { label: "Dashboard", href: "/mentorship/mentor", active: true },
        { label: "My Circles" },
        { label: "Profile" },
      ]}
      footer={footer}
    >
      <div className="px-6 py-8 md:px-9">
        <div className={lbl}>Mentor workspace</div>
        <h1 className="font-display mt-1.5 text-[26px] font-extrabold">
          Welcome, {name.split(" ")[0]}
        </h1>

        {!verified && (
          <div className="border-mnt-amber/30 mt-5 rounded-2xl border p-4 [background:linear-gradient(120deg,rgba(245,177,61,0.10),rgba(245,177,61,0.03))]">
            <div className="text-[14px] font-bold">Verification pending</div>
            <div className="text-mnt-ink-muted mt-0.5 text-[12.5px]">
              You can set up your profile now. Once the ETEN Readiness Panel
              verifies you in your capability area, you will be able to create
              and lead Circles.
            </div>
          </div>
        )}

        {/* stat tiles */}
        <div className="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <Tile label="Active Circles" value={activeCircles} />
          <Tile label="Mentees" value={mentees} />
          <Tile
            label="Pending reviews"
            value={pending}
            tone={pending > 0 ? "text-mnt-amber" : undefined}
          />
          <Tile
            label="Circle graduates"
            value={graduates}
            tone={graduates > 0 ? "text-mnt-green" : undefined}
          />
        </div>

        {/* circles I lead */}
        <div className="bg-mnt-panel border-mnt-line mt-4 rounded-2xl border p-[18px]">
          <div className={`${lbl} mb-3.5`}>Circles I lead</div>
          {circles.length === 0 ? (
            <p className="text-mnt-ink-muted text-[13px] leading-relaxed">
              {verified
                ? "You are not leading any Circles yet."
                : "Once you are verified, your Circles will appear here."}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {circles.map((c) => (
                <Link
                  key={c.id}
                  href={`/mentorship/circles/${c.id}`}
                  className="bg-mnt-panel-2 border-mnt-line hover:border-mnt-brand/40 block rounded-xl border p-3.5 transition"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-[15px] font-bold">
                      {c.title ?? "Circle"}
                    </h4>
                    <span className="text-mnt-ink-muted font-mono text-[10px] capitalize">
                      {c.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </MntDashShell>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-4">
      <div className={lbl}>{label}</div>
      <div
        className={`font-display mt-2 text-[26px] font-extrabold ${tone ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}
