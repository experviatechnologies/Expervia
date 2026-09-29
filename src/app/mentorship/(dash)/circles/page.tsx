import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata = { title: "My Circles" };

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_TONE: Record<string, string> = {
  draft: "text-mnt-ink-muted bg-mnt-panel-2",
  active: "text-mnt-green bg-mnt-green/12",
  completed: "text-mnt-brand bg-mnt-brand/12",
};

type CircleRow = {
  id: string;
  title: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

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

  return (
    <div className="mx-auto max-w-[1140px] px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            {isMentor ? "My Circles" : "My Circle"}
          </h1>
          <p className="text-mnt-ink-muted mt-1 text-[14px]">
            {isMentor
              ? "The Circles you lead."
              : "The Circles you are part of."}
          </p>
        </div>
        {isMentor && (
          <Link
            href="/mentorship/circles/new"
            className="bg-mnt-brand text-mnt-on-brand rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition hover:brightness-110"
          >
            + New Circle
          </Link>
        )}
      </header>

      {circles.length === 0 ? (
        <div className="border-mnt-line text-mnt-ink-muted mt-6 rounded-2xl border border-dashed p-10 text-center">
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
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {circles.map((c) => (
            <Link
              key={c.id}
              href={`/mentorship/circles/${c.id}`}
              className="bg-mnt-panel border-mnt-line hover:border-mnt-brand/40 block rounded-2xl border p-5 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-[16px] font-bold">
                  {c.title ?? "Circle"}
                </h2>
                <span
                  className={
                    "rounded-full px-2.5 py-1 font-mono text-[10px] capitalize " +
                    (STATUS_TONE[c.status] ??
                      "text-mnt-ink-muted bg-mnt-panel-2")
                  }
                >
                  {c.status}
                </span>
              </div>
              {(c.start_date || c.end_date) && (
                <div className="text-mnt-faint mt-2 text-[12.5px]">
                  {fmtDate(c.start_date)}
                  {c.end_date ? ` to ${fmtDate(c.end_date)}` : ""}
                </div>
              )}
              <span className="text-mnt-brand mt-3 inline-block text-[13px] font-semibold">
                Open Circle
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
