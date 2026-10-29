import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Check,
  CircleDot,
  Clock,
  FileCheck,
  GraduationCap,
  Plus,
  Users,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requestOrigin } from "@/lib/eten/request-origin";
import { BookingLinkCard } from "./booking-link-card";
import { ApplyMentorControl } from "./apply-control";
import { RequestDecisionControl } from "./request-decision-control";
import { BookingDecisionControl } from "./booking-decision-control";
import { AddToCircleControl } from "./add-to-circle-control";

export const metadata = { title: "Mentor dashboard" };

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
    .select("mentor_status, capability_area_id, verified_at, handle")
    .eq("member_id", user.id)
    .maybeSingle();
  const verified = mp?.mentor_status === "verified";
  const bookingOrigin = verified ? await requestOrigin() : "";

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
    guest_goal: string | null;
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
        .select("id, mentee_id, starts_at, duration_minutes, guest_goal")
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

  const firstName = name.split(/\s+/)[0];
  const todoCount = incoming.length + bookingReqs.length + toPlace.length;

  return (
    <div className="px-6 py-8 md:px-9">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
        {/* Greeting */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-mnt-brand text-[13px] font-semibold">
              Mentor workspace
            </div>
            <h1 className="font-display text-mnt-ink mt-1.5 text-[30px] font-extrabold tracking-[-0.02em]">
              Welcome back, {firstName}
            </h1>
            <p className="text-mnt-ink-muted mt-1.5 text-[15px]">
              {verified
                ? todoCount > 0
                  ? `You have ${todoCount} thing${todoCount === 1 ? "" : "s"} waiting for you today.`
                  : "You are all caught up. Nice work."
                : "Complete verification to start leading Circles."}
            </p>
          </div>
          {verified && (
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/mentorship/availability"
                className="border-mnt-line text-mnt-ink hover:bg-mnt-panel-2 inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors"
              >
                <Clock className="size-4" strokeWidth={1.8} />
                Set availability
              </Link>
              <Link
                href="/mentorship/circles/new"
                className="bg-mnt-brand text-mnt-on-brand inline-flex h-11 items-center gap-2 rounded-xl px-[18px] text-sm font-bold"
              >
                <Plus className="size-4" strokeWidth={2.4} />
                New Circle
              </Link>
            </div>
          )}
        </div>

        {verified && (
          <BookingLinkCard
            mentorId={user.id}
            initialHandle={mp?.handle ?? null}
            origin={bookingOrigin}
          />
        )}

        {!verified && (
          <div className="border-mnt-amber/30 rounded-2xl border p-4 [background:linear-gradient(120deg,rgba(245,177,61,0.10),rgba(245,177,61,0.03))]">
            {pendingArea ? (
              <>
                <div className="text-mnt-ink text-[14px] font-bold">
                  Application under review
                </div>
                <div className="text-mnt-ink-muted mt-0.5 text-[12.5px]">
                  The ETEN Readiness Panel is reviewing your application to
                  mentor in {pendingArea}. You will be able to create Circles
                  once you are verified.
                </div>
              </>
            ) : (
              <>
                <div className="text-mnt-ink text-[14px] font-bold">
                  Become a verified mentor
                </div>
                {isValidated ? (
                  <>
                    <div className="text-mnt-ink-muted mt-0.5 text-[12.5px]">
                      Apply for verification in your capability area. The ETEN
                      Readiness Panel reviews every mentor before they can lead
                      a Circle.
                    </div>
                    {areas.length > 0 && <ApplyMentorControl areas={areas} />}
                  </>
                ) : (
                  <>
                    <div className="text-mnt-ink-muted mt-0.5 text-[12.5px]">
                      Mentoring is for validated ETEN members. Complete your
                      ETEN membership first, then apply for verification.
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

        {/* Stats */}
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))] gap-4">
          <Stat
            Icon={CircleDot}
            tone="brand"
            label="Active circles"
            value={activeCircles}
          />
          <Stat Icon={Users} tone="brand" label="Mentees" value={mentees} />
          <Stat
            Icon={FileCheck}
            tone="amber"
            label="Pending reviews"
            value={pending}
          />
          <Stat
            Icon={GraduationCap}
            tone="green"
            label="Circle graduates"
            value={graduates}
          />
        </div>

        {/* Needs your attention */}
        {verified && (
          <section className="bg-mnt-panel border-mnt-line flex flex-col gap-[18px] rounded-[18px] border p-6">
            <div className="flex items-center gap-2.5">
              <h2 className="text-mnt-ink text-[17px] font-bold">
                Needs your attention
              </h2>
              {todoCount > 0 && (
                <span className="bg-mnt-brand text-mnt-on-brand rounded-full px-2.5 py-0.5 text-[13px] font-bold">
                  {todoCount}
                </span>
              )}
            </div>

            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
              {/* Mentee requests */}
              <div className="border-mnt-line flex flex-col gap-3.5 rounded-[16px] border p-[18px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-mnt-faint font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
                    Mentee requests
                  </span>
                  <span className="bg-mnt-panel-2 text-mnt-ink-muted rounded-full px-2 py-0.5 text-[12px] font-bold">
                    {incoming.length}
                  </span>
                </div>
                {incoming.length === 0 ? (
                  <div className="bg-mnt-panel-2 text-mnt-ink-muted flex items-center gap-2.5 rounded-xl p-3.5 text-[13px]">
                    <Check className="text-mnt-green size-[18px]" />
                    You&apos;re all caught up on mentee requests.
                  </div>
                ) : (
                  incoming.map((r) => (
                    <div key={r.id} className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-mnt-brand/12 text-mnt-brand grid size-[42px] shrink-0 place-items-center rounded-full text-[14px] font-bold">
                          {(menteeName.get(r.mentee_id) ?? "A member")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="text-mnt-ink text-[15px] font-bold">
                            {menteeName.get(r.mentee_id) ?? "A member"}
                          </div>
                          <div className="text-mnt-ink-muted text-[13px]">
                            Wants to join your mentorship ·{" "}
                            {fmtDate(r.created_at)}
                          </div>
                          {r.message && (
                            <p className="text-mnt-ink-muted mt-1 text-[13px] whitespace-pre-line">
                              {r.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <RequestDecisionControl requestId={r.id} />
                    </div>
                  ))
                )}
              </div>

              {/* Session requests */}
              <div className="border-mnt-line flex flex-col gap-3.5 rounded-[16px] border p-[18px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-mnt-faint font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
                    Session requests
                  </span>
                  <span className="bg-mnt-panel-2 text-mnt-ink-muted rounded-full px-2 py-0.5 text-[12px] font-bold">
                    {bookingReqs.length}
                  </span>
                </div>
                {bookingReqs.length === 0 ? (
                  <div className="bg-mnt-panel-2 text-mnt-ink-muted flex items-start gap-2.5 rounded-xl p-3.5 text-[13px] leading-relaxed">
                    <Calendar className="text-mnt-brand mt-0.5 size-[18px] shrink-0" />
                    <span>
                      No pending session requests. Mentees book these from your
                      availability.{" "}
                      <Link
                        href="/mentorship/availability"
                        className="text-mnt-brand font-semibold"
                      >
                        Set your times
                      </Link>
                    </span>
                  </div>
                ) : (
                  bookingReqs.map((b) => (
                    <div key={b.id} className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="border-mnt-line w-[52px] shrink-0 overflow-hidden rounded-xl border text-center">
                          <span className="bg-mnt-brand text-mnt-on-brand block py-[3px] text-[11px] font-bold">
                            {new Date(b.starts_at)
                              .toLocaleString("en-GB", {
                                month: "short",
                                timeZone: mentorTz,
                              })
                              .toUpperCase()}
                          </span>
                          <span className="text-mnt-ink block py-[3px] text-[20px] font-extrabold">
                            {new Date(b.starts_at).toLocaleString("en-GB", {
                              day: "2-digit",
                              timeZone: mentorTz,
                            })}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <div className="text-mnt-ink text-[15px] font-bold">
                            {bookingMenteeName.get(b.mentee_id) ?? "A member"}
                          </div>
                          <div className="text-mnt-ink text-[13px]">
                            {fmtWhen(b.starts_at)} · {b.duration_minutes} min
                          </div>
                          <div className="text-mnt-faint text-[12px]">
                            Your timezone ({mentorTz})
                          </div>
                        </div>
                      </div>
                      {b.guest_goal && (
                        <div className="bg-mnt-panel-2 text-mnt-ink-muted rounded-xl px-3 py-2.5 text-[13px] leading-relaxed">
                          <span className="text-mnt-ink font-semibold">
                            Wants help with:
                          </span>{" "}
                          {b.guest_goal}
                        </div>
                      )}
                      <BookingDecisionControl bookingId={b.id} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Place accepted mentees in a Circle */}
            {toPlace.length > 0 && (
              <div className="border-mnt-brand/40 flex flex-col gap-3.5 rounded-[16px] border-[1.5px] p-[18px] [background:rgba(74,22,196,0.04)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-mnt-brand font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
                      Accepted · place in a circle
                    </span>
                    <span className="bg-mnt-brand text-mnt-on-brand rounded-full px-2 py-px text-[12px] font-bold">
                      {toPlace.length}
                    </span>
                  </div>
                  <p className="text-mnt-ink-muted mt-1.5 text-[13px]">
                    Add each mentee you accepted to a new or existing Circle.
                  </p>
                </div>
                {toPlace.map((a) => (
                  <div
                    key={a.id}
                    className="bg-mnt-panel border-mnt-line flex flex-wrap items-center gap-3 rounded-[14px] border p-3.5"
                  >
                    <span className="bg-mnt-brand/12 text-mnt-brand grid size-[38px] shrink-0 place-items-center rounded-full text-[13px] font-bold">
                      {(placeName.get(a.mentee_id) ?? "A member")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                    <span className="text-mnt-ink flex-[1_1_200px] text-[15px] font-bold">
                      {placeName.get(a.mentee_id) ?? "A member"}
                    </span>
                    <AddToCircleControl
                      menteeId={a.mentee_id}
                      circles={openCircles}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Circles I lead */}
        <section className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-mnt-ink text-[17px] font-bold">
              Circles I lead
            </h2>
            {circles.length > 0 && (
              <span className="bg-mnt-brand/12 text-mnt-brand rounded-full px-2.5 py-0.5 text-[13px] font-bold">
                {circles.length}
              </span>
            )}
          </div>
          {circles.length === 0 ? (
            <div className="bg-mnt-panel border-mnt-line text-mnt-ink-muted rounded-[18px] border p-6 text-[13px] leading-relaxed">
              {verified
                ? "You are not leading any Circles yet."
                : "Once you are verified, your Circles will appear here."}
            </div>
          ) : (
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5">
              {circles.map((c) => {
                const active = c.status === "active";
                const untitled = !c.title;
                return (
                  <Link
                    key={c.id}
                    href={`/mentorship/circles/${c.id}`}
                    className="bg-mnt-panel border-mnt-line hover:border-mnt-brand/40 flex flex-col gap-3.5 rounded-[16px] border p-[18px] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <span
                        className={
                          "grid size-10 place-items-center rounded-xl " +
                          (active
                            ? "bg-mnt-brand/12 text-mnt-brand"
                            : "bg-mnt-panel-2 text-mnt-faint")
                        }
                      >
                        <CircleDot className="size-5" strokeWidth={1.8} />
                      </span>
                      <span
                        className={
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold capitalize " +
                          (active
                            ? "bg-mnt-green/12 text-mnt-green"
                            : "bg-mnt-panel-2 text-mnt-faint")
                        }
                      >
                        <span
                          className={
                            "size-1.5 rounded-full " +
                            (active ? "bg-mnt-green" : "bg-mnt-faint")
                          }
                        />
                        {c.status}
                      </span>
                    </div>
                    <div>
                      <div className="text-mnt-ink text-[16px] font-bold">
                        {c.title ?? "Circle"}
                      </div>
                      {untitled && (
                        <div className="mt-1 text-[12px] text-amber-600 dark:text-amber-400">
                          No title yet. Add one so mentees can find it.
                        </div>
                      )}
                    </div>
                    <div className="text-mnt-brand flex items-center justify-end gap-1.5 text-[13px] font-bold">
                      Open circle
                      <ArrowRight className="size-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  Icon,
  tone,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "brand" | "amber" | "green";
  label: string;
  value: number;
}) {
  const square =
    tone === "amber"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : tone === "green"
        ? "bg-mnt-green/12 text-mnt-green"
        : "bg-mnt-brand/12 text-mnt-brand";
  return (
    <div className="bg-mnt-panel border-mnt-line flex items-center gap-4 rounded-2xl border p-5">
      <span
        className={
          "grid size-[46px] shrink-0 place-items-center rounded-[14px] " +
          square
        }
      >
        <Icon className="size-[22px]" strokeWidth={1.8} />
      </span>
      <div>
        <div className="text-mnt-ink-muted text-[13px] font-semibold">
          {label}
        </div>
        <div className="text-mnt-ink text-[28px] font-extrabold tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}
