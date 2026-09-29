import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  MntDashShell,
  type MntNavItem,
} from "@/components/mentorship/mnt-dash-shell";

/**
 * Shared shell for the authenticated mentorship area. Rendering the sidebar here
 * (once) keeps it fixed while the main content swaps between pages, instead of
 * each page bringing its own shell or a bare "back" link. Role, nav, footer card
 * and account block are computed here; MntNavLinks derives the active item from
 * the URL.
 */
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

export default async function MentorshipDashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mentorship/signin");

  const [{ data: member }, { data: profile }] = await Promise.all([
    supabase
      .from("members")
      .select("mentorship_intent, validated_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("member_id", user.id)
      .maybeSingle(),
  ]);

  const isMentor = member?.mentorship_intent === "mentor";
  const isValidated = Boolean(member?.validated_at);
  const name = profile?.full_name ?? "there";
  const user_ = {
    initials: initials(profile?.full_name),
    name,
    role: isMentor ? "Mentor" : "Mentee",
  };

  let nav: MntNavItem[];
  let footer: React.ReactNode;

  if (isMentor) {
    const { data: mp } = await supabase
      .from("mentor_profiles")
      .select("mentor_status, capability_area_id, verified_at")
      .eq("member_id", user.id)
      .maybeSingle();
    const verified = Boolean(mp && mp.mentor_status !== "candidate");
    let areaLabel: string | null = null;
    if (mp?.capability_area_id) {
      const { data: area } = await supabase
        .from("capability_areas")
        .select("label")
        .eq("id", mp.capability_area_id)
        .maybeSingle();
      areaLabel = area?.label ?? null;
    }

    nav = [
      { label: "Dashboard", href: "/mentorship/mentor" },
      { label: "My Circles" },
      { label: "Notifications", href: "/mentorship/notifications" },
      { label: "Profile", href: "/mentorship/profile" },
    ];

    footer = verified ? (
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
          The ETEN Readiness Panel verifies mentors before they can lead a
          Circle.
        </p>
      </div>
    );
  } else {
    const { data: cm } = await supabase
      .from("circle_memberships")
      .select("circle_id")
      .eq("member_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    nav = [
      { label: "Dashboard", href: "/mentorship/dashboard" },
      {
        label: "My Circle",
        href: cm ? `/mentorship/circles/${cm.circle_id}` : undefined,
      },
      { label: "Find a mentor", href: "/mentorship/mentors" },
      { label: "Notifications", href: "/mentorship/notifications" },
      { label: "Profile", href: "/mentorship/profile" },
    ];

    footer = isValidated ? (
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
  }

  return (
    <MntDashShell user={user_} nav={nav} footer={footer}>
      {children}
    </MntDashShell>
  );
}
