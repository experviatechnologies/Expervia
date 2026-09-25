import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { MntDashShell } from "@/components/mentorship/mnt-dash-shell";
import { vLevelBadge } from "@/lib/eten/v-levels";

export const metadata = { title: "Dashboard" };

const lbl =
  "text-mnt-faint font-mono text-[10.5px] tracking-[0.13em] uppercase";

function initials(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default async function MenteeDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mentorship/signin");

  const [{ data: member }, { data: profile }] = await Promise.all([
    supabase
      .from("members")
      .select("validated_at, mentorship_intent, mentorship_capability_area_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("member_id", user.id)
      .maybeSingle(),
  ]);

  // Mentors get their own workspace.
  if (member?.mentorship_intent === "mentor") redirect("/mentorship/mentor");

  const isValidated = Boolean(member?.validated_at);
  const name = profile?.full_name ?? "there";

  // Capability area label (public read).
  let areaLabel: string | null = null;
  if (member?.mentorship_capability_area_id) {
    const { data: area } = await supabase
      .from("capability_areas")
      .select("label")
      .eq("id", member.mentorship_capability_area_id)
      .maybeSingle();
    areaLabel = area?.label ?? null;
  }

  // Active circle membership (RLS-scoped to the caller).
  const { data: cm } = await supabase
    .from("circle_memberships")
    .select("circle_id, target_v_level, target_capability")
    .eq("member_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  let circle: {
    id: string;
    title: string | null;
    status: string;
    mentorName: string;
  } | null = null;
  if (cm) {
    const { data: c } = await supabase
      .from("mentorship_circles")
      .select("id, title, status, mentor_id")
      .eq("id", cm.circle_id)
      .maybeSingle();
    if (c) {
      const { data: mp } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("member_id", c.mentor_id)
        .maybeSingle();
      circle = {
        id: c.id,
        title: c.title,
        status: c.status,
        mentorName: mp?.full_name ?? "A mentor",
      };
    }
  }

  const footer = isValidated ? (
    <div className="border-mnt-green/30 rounded-xl border p-3.5 [background:rgba(52,211,153,0.06)]">
      <div className="flex items-center gap-2">
        <span className="bg-mnt-green size-2 rounded-full" />
        <span className="text-mnt-green font-mono text-[10.5px] tracking-[0.1em] uppercase">
          ETEN-Validated
        </span>
      </div>
      <p className="text-mnt-ink-muted mt-2 text-[12px] leading-relaxed">
        You can join live Circles and earn recognition.
      </p>
    </div>
  ) : (
    <div className="border-mnt-amber/30 rounded-xl border p-3.5 [background:rgba(245,177,61,0.06)]">
      <div className="flex items-center gap-2">
        <span className="bg-mnt-amber size-2 rounded-full" />
        <span className="text-mnt-amber font-mono text-[10.5px] tracking-[0.1em] uppercase">
          Prospect
        </span>
      </div>
      <p className="text-mnt-ink-muted mt-2 mb-2.5 text-[12px] leading-relaxed">
        Validate with ETEN membership to join live Circles.
      </p>
      <Link
        href="/mentorship/validate"
        className="bg-mnt-amber block rounded-[9px] py-2 text-center text-[12.5px] font-bold text-[#241a05]"
      >
        Validate now
      </Link>
    </div>
  );

  return (
    <MntDashShell
      user={{ initials: initials(profile?.full_name), name, role: "Mentee" }}
      nav={[
        { label: "Dashboard", href: "/mentorship/dashboard", active: true },
        {
          label: "My Circle",
          href: circle ? `/mentorship/circles/${circle.id}` : undefined,
        },
        { label: "Notifications", href: "/mentorship/notifications" },
        { label: "Profile" },
      ]}
      footer={footer}
    >
      <div className="px-6 py-8 md:px-9">
        <div className={lbl}>Mentorship</div>
        <h1 className="font-display mt-1.5 text-[26px] font-extrabold">
          Welcome back, {name.split(" ")[0]}
        </h1>

        {!isValidated && (
          <div className="border-mnt-amber/30 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 [background:linear-gradient(120deg,rgba(245,177,61,0.10),rgba(245,177,61,0.03))]">
            <div className="flex items-center gap-3">
              <span className="bg-mnt-amber/18 text-mnt-amber grid size-[26px] place-items-center rounded-lg font-bold">
                !
              </span>
              <div>
                <div className="text-[14px] font-bold">
                  You are a Prospect, one step from going live
                </div>
                <div className="text-mnt-ink-muted mt-0.5 text-[12.5px]">
                  Validate through ETEN membership to be placed in a live Circle
                  and count toward recognition.
                </div>
              </div>
            </div>
            <Link
              href="/mentorship/validate"
              className="bg-mnt-amber rounded-[10px] px-4 py-2.5 text-[13px] font-bold whitespace-nowrap text-[#241a05]"
            >
              Validate account
            </Link>
          </div>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* Goal */}
          <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
            <div className={lbl}>My goal</div>
            {cm && cm.target_v_level != null ? (
              <>
                <div className="font-display mt-3 text-xl font-extrabold">
                  {vLevelBadge(cm.target_v_level)}
                </div>
                {cm.target_capability && (
                  <div className="text-mnt-ink-muted mt-2 text-[13px]">
                    {cm.target_capability}
                  </div>
                )}
              </>
            ) : (
              <p className="text-mnt-ink-muted mt-3 text-[13px] leading-relaxed">
                {areaLabel ? (
                  <>
                    Your area is{" "}
                    <span className="text-mnt-ink">{areaLabel}</span>. You will
                    set a target level when you join a Circle.
                  </>
                ) : (
                  "You will set a goal when you join a Circle."
                )}
              </p>
            )}
          </div>

          {/* Circle */}
          <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
            <div className={lbl}>My Circle</div>
            {circle ? (
              <Link
                href={`/mentorship/circles/${circle.id}`}
                className="mt-3 block"
              >
                <h3 className="font-display text-[17px] font-bold">
                  {circle.title ?? "Your Circle"}
                </h3>
                <div className="text-mnt-ink-muted mt-1 text-[13px]">
                  Mentor: {circle.mentorName}
                </div>
                <span className="text-mnt-brand mt-2 inline-block text-[13px] font-semibold">
                  Open Circle
                </span>
              </Link>
            ) : (
              <p className="text-mnt-ink-muted mt-3 text-[13px] leading-relaxed">
                You are not in a Circle yet.{" "}
                {isValidated
                  ? "You will be matched to one in your capability area."
                  : "Validate your account to be placed in a live Circle."}
              </p>
            )}
          </div>
        </div>
      </div>
    </MntDashShell>
  );
}
