import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Plus,
  Search,
  User,
  Users,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const metadata = { title: "My Circles" };

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CHIP: Record<string, string> = {
  draft: "bg-white/90 text-[#4B4868]",
  active: "bg-[#E7F6EC] text-[#11703A]",
  completed: "bg-white/90 text-[#4A16C4]",
};

const BANNERS = [
  "linear-gradient(135deg, #35007F 0%, #7530E6 100%)",
  "linear-gradient(135deg, #110263 0%, #4A16C4 100%)",
];

type CircleRow = {
  id: string;
  title: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

function initials(title: string | null): string {
  if (!title) return "C";
  const parts = title.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return (
    parts
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "C"
  );
}

export default async function MyCirclesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mentorship/signin");

  const { data: member } = await supabase
    .from("members")
    .select("mentorship_intent")
    .eq("id", user.id)
    .maybeSingle();
  const isMentor = member?.mentorship_intent === "mentor";

  let circles: CircleRow[] = [];
  if (isMentor) {
    const { data } = await supabase
      .from("mentorship_circles")
      .select("id, title, status, start_date, end_date")
      .eq("mentor_id", user.id)
      .order("created_at", { ascending: false });
    circles = (data ?? []) as CircleRow[];
  } else {
    const { data: cm } = await supabase
      .from("circle_memberships")
      .select("circle_id")
      .eq("member_id", user.id);
    const ids = (cm ?? []).map((r) => r.circle_id);
    if (ids.length) {
      const { data } = await supabase
        .from("mentorship_circles")
        .select("id, title, status, start_date, end_date")
        .in("id", ids)
        .order("created_at", { ascending: false });
      circles = (data ?? []) as CircleRow[];
    }
  }

  // Capability-area pill (real, mentors only).
  let areaLabel: string | null = null;
  if (isMentor) {
    const admin = getSupabaseAdmin();
    const { data: mp } = await admin
      .from("mentor_profiles")
      .select("capability_area_id")
      .eq("member_id", user.id)
      .maybeSingle();
    if (mp?.capability_area_id) {
      const { data: area } = await admin
        .from("capability_areas")
        .select("label")
        .eq("id", mp.capability_area_id)
        .maybeSingle();
      areaLabel = area?.label ?? null;
    }
  }

  const activeCount = circles.filter((c) => c.status === "active").length;

  return (
    <div className="px-6 py-9 md:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-mnt-brand text-[12px] font-bold tracking-[0.12em] uppercase">
              Mentorship
            </span>
            <h1 className="font-display text-mnt-ink mt-1 text-[30px] font-extrabold tracking-[-0.02em]">
              {isMentor ? "My Circles" : "My Circle"}
            </h1>
            <p className="text-mnt-ink-muted mt-1.5 text-[15px]">
              {isMentor
                ? "The Circles you lead."
                : "The Circles you are part of."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-mnt-green/12 text-mnt-green inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold">
              <span className="bg-mnt-green size-[7px] rounded-full" />
              {activeCount} active
            </span>
            {areaLabel && (
              <span className="border-mnt-line text-mnt-ink-muted inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold">
                {areaLabel}
              </span>
            )}
            {isMentor && (
              <Link
                href="/mentorship/circles/new"
                className="bg-mnt-brand text-mnt-on-brand inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold transition hover:brightness-110"
              >
                <Plus className="size-4" strokeWidth={2.4} /> New Circle
              </Link>
            )}
          </div>
        </header>

        {circles.length === 0 ? (
          <div className="border-mnt-line text-mnt-ink-muted rounded-2xl border border-dashed p-10 text-center">
            {isMentor ? (
              <p className="text-[14px] leading-relaxed">
                You aren&apos;t leading any Circles yet. Create one to enrol
                mentees and start meeting.
              </p>
            ) : (
              <>
                <p className="text-[14px] leading-relaxed">
                  You are not in a Circle yet. When a verified mentor enrols you
                  in a Circle, it will appear here.
                </p>
                <Link
                  href="/mentorship/mentors"
                  className="text-mnt-brand mt-3 inline-block text-[13.5px] font-semibold"
                >
                  Find a mentor →
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))] gap-[18px]">
            {circles.map((c, i) => {
              const untitled = !c.title;
              const dates =
                c.start_date || c.end_date
                  ? `${fmtDate(c.start_date)}${c.end_date ? ` to ${fmtDate(c.end_date)}` : ""}`
                  : "Dates not set yet";
              return (
                <article
                  key={c.id}
                  className="bg-mnt-panel border-mnt-line hover:border-mnt-brand/40 flex flex-col overflow-hidden rounded-[20px] border transition hover:shadow-[0_8px_22px_rgba(17,2,99,0.07)]"
                >
                  <div
                    className="relative flex h-[92px] items-center justify-between overflow-hidden px-5"
                    style={{ background: BANNERS[i % BANNERS.length] }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -top-12 -right-10 size-40 rounded-full border-2 border-white/15"
                    />
                    <span className="relative grid size-12 place-items-center rounded-[14px] border border-white/30 bg-white/[0.16] text-[16px] font-extrabold text-white">
                      {initials(c.title)}
                    </span>
                    <span
                      className={
                        "relative rounded-full px-2.5 py-1 text-[12px] font-bold capitalize " +
                        (STATUS_CHIP[c.status] ?? "bg-white/90 text-[#4B4868]")
                      }
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3.5 p-5">
                    <div>
                      <h2 className="text-mnt-ink text-[18px] font-extrabold">
                        {c.title ?? "Circle"}
                      </h2>
                      {untitled && (
                        <div className="text-mnt-faint mt-0.5 text-[13px]">
                          {isMentor
                            ? "You haven't named this Circle yet"
                            : "Your mentor hasn't named this Circle yet"}
                        </div>
                      )}
                    </div>
                    <div className="text-mnt-ink-muted flex flex-col gap-2 text-[13px]">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="text-mnt-faint size-4" />
                        <span
                          className={untitled ? "text-mnt-faint italic" : ""}
                        >
                          {dates}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        {isMentor ? (
                          <Users className="text-mnt-faint size-4" />
                        ) : (
                          <User className="text-mnt-faint size-4" />
                        )}
                        {isMentor ? "You lead this Circle" : "You're a mentee"}
                      </span>
                    </div>
                    <Link
                      href={`/mentorship/circles/${c.id}`}
                      className="bg-mnt-brand text-mnt-on-brand mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[14px] font-bold transition hover:brightness-110"
                    >
                      Open Circle
                      <ArrowRight className="size-4" strokeWidth={2.4} />
                    </Link>
                  </div>
                </article>
              );
            })}

            {/* Role-aware CTA card */}
            <Link
              href={
                isMentor ? "/mentorship/circles/new" : "/mentorship/mentors"
              }
              className="border-mnt-line bg-mnt-panel-2 hover:border-mnt-brand/40 flex min-h-[260px] flex-col items-center justify-center gap-2.5 rounded-[20px] border-[1.5px] border-dashed p-6 text-center transition"
            >
              <span className="bg-mnt-brand/10 text-mnt-brand grid size-[52px] place-items-center rounded-[16px]">
                {isMentor ? (
                  <Plus className="size-6" strokeWidth={2} />
                ) : (
                  <Search className="size-6" strokeWidth={2} />
                )}
              </span>
              <div className="text-mnt-ink text-[16px] font-bold">
                {isMentor ? "Lead another Circle" : "Want more guidance?"}
              </div>
              <div className="text-mnt-ink-muted max-w-[260px] text-[13px] leading-relaxed">
                {isMentor
                  ? "Create a new Circle to enrol more mentees."
                  : "Find a mentor for 1:1 sessions alongside your Circles."}
              </div>
              <span className="text-mnt-brand text-[14px] font-bold">
                {isMentor ? "Create a Circle" : "Find a mentor"}
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
