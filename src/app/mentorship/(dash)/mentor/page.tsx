import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ApplyMentorControl } from "./apply-control";
import { RequestDecisionControl } from "./request-decision-control";
import { BookingDecisionControl } from "./booking-decision-control";
import { AddToCircleControl } from "./add-to-circle-control";

export const metadata = { title: "Mentor dashboard" };

const lbl =
  "text-mnt-faint font-mono text-[10.5px] tracking-[0.13em] uppercase";

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
      .select("mentorship_intent, validated_at")
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
  const isValidated = Boolean(member?.validated_at);

  const { data: mp } = await supabase
    .from("mentor_profiles")
    .select("mentor_status, capability_area_id, verified_at")
    .eq("member_id", user.id)
    .maybeSingle();
  const verified = mp?.mentor_status === "verified";

  // Not verified: is there an application under review, and what areas can they
  // apply in?
  let pendingArea: string | null | undefined;
  let areas: { slug: string; label: string }[] = [];
  if (!verified) {
    const { data: pending } = await supabase
      .from("mentor_nominations")
      .select("capability_area_id")
      .eq("member_id", user.id)
      .eq("status", "pending")
      .maybeSingle();
    if (pending) {
      pendingArea = "your capability area";
      if (pending.capability_area_id) {
        const { data: a } = await supabase
          .from("capability_areas")
          .select("label")
          .eq("id", pending.capability_area_id)
          .maybeSingle();
        pendingArea = a?.label ?? pendingArea;
      }
    } else {
      const { data: list } = await supabase
        .from("capability_areas")
        .select("slug, label")
        .eq("active", true)
        .order("sort_order");
      areas = list ?? [];
    }
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

  // Incoming 1:1 mentorship requests (verified mentors only). RLS returns rows
  // addressed to this mentor.
  type IncomingRequest = {
    id: string;
    mentee_id: string;
    message: string | null;
    capability_area_id: string | null;
    created_at: string;
  };
  let incoming: IncomingRequest[] = [];
  const menteeName = new Map<string, string>();
  if (verified) {
    const { data: reqRows } = await supabase
      .from("mentorship_requests")
      .select("id, mentee_id, message, capability_area_id, created_at")
      .eq("mentor_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    incoming = (reqRows ?? []) as IncomingRequest[];
    if (incoming.length) {
      const { data: mp2 } = await supabase
        .from("profiles")
        .select("member_id, full_name")
        .in(
          "member_id",
          incoming.map((r) => r.mentee_id),
        );
      for (const p of mp2 ?? [])
        menteeName.set(p.member_id, p.full_name ?? "A member");
    }
  }

  // Accepted 1:1 mentees not yet placed in one of this mentor's Circles.
  type AcceptedRow = { id: string; mentee_id: string };
  let toPlace: AcceptedRow[] = [];
  const placeName = new Map<string, string>();
  if (verified) {
    const { data: acceptedRows } = await supabase
      .from("mentorship_requests")
      .select("id, mentee_id")
      .eq("mentor_id", user.id)
      .eq("status", "accepted");
    const accepted = (acceptedRows ?? []) as AcceptedRow[];
    if (accepted.length) {
      let enrolled = new Set<string>();
      if (circles.length) {
        const { data: cms } = await supabase
          .from("circle_memberships")
          .select("member_id")
          .in(
            "circle_id",
            circles.map((c) => c.id),
          );
        enrolled = new Set((cms ?? []).map((r) => r.member_id));
      }
      toPlace = accepted.filter((a) => !enrolled.has(a.mentee_id));
      if (toPlace.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("member_id, full_name")
          .in(
            "member_id",
            toPlace.map((a) => a.mentee_id),
          );
        for (const p of profs ?? [])
          placeName.set(p.member_id, p.full_name ?? "A member");
      }
    }
  }
  const openCircles = circles
    .filter((c) => c.status !== "completed")
    .map((c) => ({ id: c.id, title: c.title }));

  // Pending session-booking requests (from the availability calendar). Times are
  // shown in the mentor's own timezone, so formatting is deterministic server-side.
  type BookingRow = {
    id: string;
    mentee_id: string;
    starts_at: string;
    duration_minutes: number;
  };
  let bookingReqs: BookingRow[] = [];
  const bookingMenteeName = new Map<string, string>();
  let mentorTz = "UTC";
  if (verified) {
    const [{ data: prefsRow }, { data: bRows }] = await Promise.all([
      supabase
        .from("mentor_scheduling_prefs")
        .select("timezone")
        .eq("member_id", user.id)
        .maybeSingle(),
      supabase
        .from("session_bookings")
        .select("id, mentee_id, starts_at, duration_minutes")
        .eq("mentor_id", user.id)
        .eq("status", "pending")
        .order("starts_at"),
    ]);
    mentorTz = prefsRow?.timezone ?? "UTC";
    bookingReqs = (bRows ?? []) as BookingRow[];
    if (bookingReqs.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("member_id, full_name")
        .in(
          "member_id",
          bookingReqs.map((b) => b.mentee_id),
        );
      for (const p of profs ?? [])
        bookingMenteeName.set(p.member_id, p.full_name ?? "A member");
    }
  }
  const fmtWhen = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: mentorTz,
    });

  return (
    <div className="px-6 py-8 md:px-9">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className={lbl}>Mentor workspace</div>
          <h1 className="font-display mt-1.5 text-[26px] font-extrabold">
            Welcome, {name.split(" ")[0]}
          </h1>
        </div>
        {verified && (
          <Link
            href="/mentorship/circles/new"
            className="bg-mnt-brand text-mnt-on-brand rounded-[10px] px-4 py-2.5 text-[13px] font-bold"
          >
            + New Circle
          </Link>
        )}
      </div>

      {!verified && (
        <div className="border-mnt-amber/30 mt-5 rounded-2xl border p-4 [background:linear-gradient(120deg,rgba(245,177,61,0.10),rgba(245,177,61,0.03))]">
          {pendingArea ? (
            <>
              <div className="text-[14px] font-bold">
                Application under review
              </div>
              <div className="text-mnt-ink-muted mt-0.5 text-[12.5px]">
                The ETEN Readiness Panel is reviewing your application to mentor
                in {pendingArea}. You will be able to create Circles once you
                are verified.
              </div>
            </>
          ) : (
            <>
              <div className="text-[14px] font-bold">
                Become a verified mentor
              </div>
              {isValidated ? (
                <>
                  <div className="text-mnt-ink-muted mt-0.5 text-[12.5px]">
                    Apply for verification in your capability area. The ETEN
                    Readiness Panel reviews every mentor before they can lead a
                    Circle.
                  </div>
                  {areas.length > 0 && <ApplyMentorControl areas={areas} />}
                </>
              ) : (
                <>
                  <div className="text-mnt-ink-muted mt-0.5 text-[12.5px]">
                    Mentoring is for validated ETEN members. Complete your ETEN
                    membership first, then apply for verification.
                  </div>
                  <a
                    href="/mentorship/validate"
                    className="bg-mnt-amber mt-3 inline-block rounded-[10px] px-4 py-2 text-[13px] font-bold text-[#241a05]"
                  >
                    Validate my account
                  </a>
                </>
              )}
            </>
          )}
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

      {/* incoming 1:1 requests */}
      {verified && (
        <div className="bg-mnt-panel border-mnt-line mt-4 rounded-2xl border p-[18px]">
          <div className={`${lbl} mb-3.5`}>
            Incoming requests · {incoming.length}
          </div>
          {incoming.length === 0 ? (
            <p className="text-mnt-ink-muted text-[13px] leading-relaxed">
              No pending mentorship requests. Mentees can request you from the
              mentor directory.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {incoming.map((r) => (
                <div
                  key={r.id}
                  className="bg-mnt-panel-2 border-mnt-line rounded-xl border p-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold">
                        {menteeName.get(r.mentee_id) ?? "A member"}
                      </div>
                      {r.message && (
                        <p className="text-mnt-ink-muted mt-1 text-[13px] whitespace-pre-line">
                          {r.message}
                        </p>
                      )}
                      <div className="text-mnt-faint mt-1 text-[11.5px]">
                        {fmtDate(r.created_at)}
                      </div>
                    </div>
                    <RequestDecisionControl requestId={r.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* session booking requests (from availability) */}
      {verified && (
        <div className="bg-mnt-panel border-mnt-line mt-4 rounded-2xl border p-[18px]">
          <div className={`${lbl} mb-3.5`}>
            Session requests · {bookingReqs.length}
          </div>
          {bookingReqs.length === 0 ? (
            <p className="text-mnt-ink-muted text-[13px] leading-relaxed">
              No pending session requests. Mentees book these from your
              availability. Set your times under Availability.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {bookingReqs.map((b) => (
                <div
                  key={b.id}
                  className="bg-mnt-panel-2 border-mnt-line flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5"
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold">
                      {bookingMenteeName.get(b.mentee_id) ?? "A member"}
                    </div>
                    <div className="text-mnt-ink-muted mt-0.5 text-[12.5px]">
                      {fmtWhen(b.starts_at)} · {b.duration_minutes} min
                    </div>
                    <div className="text-mnt-faint mt-0.5 text-[11px]">
                      Your timezone ({mentorTz})
                    </div>
                  </div>
                  <BookingDecisionControl bookingId={b.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* accepted 1:1 mentees to place in a Circle */}
      {verified && toPlace.length > 0 && (
        <div className="bg-mnt-panel border-mnt-line mt-4 rounded-2xl border p-[18px]">
          <div className={`${lbl} mb-1.5`}>
            Accepted · place in a Circle · {toPlace.length}
          </div>
          <p className="text-mnt-ink-muted mb-3.5 text-[12.5px] leading-relaxed">
            Add each mentee you accepted to a new or existing Circle. Mentees
            can join a Circle that is already running.
          </p>
          <div className="flex flex-col gap-3">
            {toPlace.map((a) => (
              <div
                key={a.id}
                className="bg-mnt-panel-2 border-mnt-line flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5"
              >
                <div className="text-[14px] font-bold">
                  {placeName.get(a.mentee_id) ?? "A member"}
                </div>
                <AddToCircleControl
                  menteeId={a.mentee_id}
                  circles={openCircles}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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
