import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Star } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getMentorSlots } from "@/lib/eten/availability";
import { canRateMentor, summarizeRatings } from "@/lib/eten/ratings";
import { RequestControl } from "../request-control";
import { BookingPanel, type MyBooking } from "./booking-panel";
import { RatingForm } from "./rating-form";

/** Five stars, filled to the nearest whole rating. */
function Stars({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span className={"inline-flex items-center gap-0.5 " + (className ?? "")}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            "size-4 " +
            (n <= filled ? "fill-mnt-amber text-mnt-amber" : "text-mnt-faint")
          }
        />
      ))}
    </span>
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "A mentee";
}

export const metadata = { title: "Book a mentor" };

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

export default async function MentorBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentMember();
  if (!me) redirect("/mentorship/signin");
  if (id === me.id) redirect("/mentorship/mentors");

  const admin = getSupabaseAdmin();

  const { data: mentor } = await admin
    .from("mentor_profiles")
    .select("member_id, mentor_status, capability_area_id")
    .eq("member_id", id)
    .maybeSingle();
  if (!mentor || mentor.mentor_status === "candidate") notFound();

  const [
    { data: meRow },
    { data: profile },
    { data: areaRow },
    { data: reqRows },
    { data: bookingRows },
    { data: pricingRow },
    { data: ratingRows },
    slotsResult,
  ] = await Promise.all([
    admin.from("members").select("validated_at").eq("id", me.id).maybeSingle(),
    admin
      .from("profiles")
      .select("full_name, headline, bio")
      .eq("member_id", id)
      .maybeSingle(),
    mentor.capability_area_id
      ? admin
          .from("capability_areas")
          .select("label")
          .eq("id", mentor.capability_area_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("mentorship_requests")
      .select("status, created_at")
      .eq("mentee_id", me.id)
      .eq("mentor_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("session_bookings")
      .select("id, starts_at, duration_minutes, status")
      .eq("mentee_id", me.id)
      .eq("mentor_id", id)
      .in("status", ["pending", "accepted"])
      .order("starts_at"),
    admin
      .from("mentor_pricing")
      .select("paid_sessions_enabled, currency, standard_amount")
      .eq("member_id", id)
      .maybeSingle(),
    admin
      .from("mentor_ratings")
      .select("mentee_id, rating, review, updated_at")
      .eq("mentor_id", id)
      .order("updated_at", { ascending: false }),
    getMentorSlots(id, { days: 14 }),
  ]);

  const isValidated = Boolean(meRow?.validated_at);
  const name = profile?.full_name ?? "A mentor";

  const latestReq = (reqRows ?? []).find((r) => r.status !== "withdrawn");
  const reqStatus =
    latestReq && latestReq.status !== "completed"
      ? (latestReq.status as "pending" | "accepted" | "declined")
      : null;

  const myBookings: MyBooking[] = (bookingRows ?? []).map((b) => ({
    id: b.id,
    startsAt: b.starts_at,
    durationMinutes: b.duration_minutes,
    status: b.status,
  }));

  // Paid-session pricing, surfaced to the mentee only when the mentor has paid
  // sessions on with a standard price. Null means the free request flow.
  const pricing =
    pricingRow?.paid_sessions_enabled && pricingRow.standard_amount
      ? {
          currency: pricingRow.currency as string,
          standardAmount: pricingRow.standard_amount as number,
        }
      : null;

  // Ratings: overall summary, this mentee's own rating, and recent written
  // reviews (with reviewer first names). Eligibility gates the rating form.
  const ratings = ratingRows ?? [];
  const ratingSummary = summarizeRatings(ratings);
  const myRating = ratings.find((r) => r.mentee_id === me.id) ?? null;
  const reviews = ratings.filter((r) => (r.review ?? "").trim()).slice(0, 8);

  const reviewerNames = new Map<string, string>();
  if (reviews.length) {
    const { data: reviewerRows } = await admin
      .from("profiles")
      .select("member_id, full_name")
      .in(
        "member_id",
        reviews.map((r) => r.mentee_id),
      );
    for (const p of reviewerRows ?? [])
      reviewerNames.set(p.member_id, firstName(p.full_name ?? "A mentee"));
  }

  const canRate = await canRateMentor(admin, me.id, id);

  return (
    <div className="mx-auto max-w-[820px] px-6 py-8">
      <Link
        href="/mentorship/mentors"
        className="text-mnt-faint hover:text-mnt-ink text-[12.5px]"
      >
        ← All mentors
      </Link>

      <header className="mt-4 flex items-center gap-4">
        <span className="bg-mnt-brand/14 text-mnt-brand font-display grid size-14 shrink-0 place-items-center rounded-full text-[18px] font-bold">
          {initials(name)}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold">{name}</h1>
          <div className="text-mnt-green font-mono text-[11px]">
            {TIER_LABEL[mentor.mentor_status] ?? "Verified Mentor"}
            {areaRow?.label ? (
              <span className="text-mnt-faint"> · {areaRow.label}</span>
            ) : null}
          </div>
          {ratingSummary.count > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <Stars value={ratingSummary.avg} />
              <span className="text-mnt-ink-muted text-[12.5px]">
                {ratingSummary.avg.toFixed(1)} · {ratingSummary.count} rating
                {ratingSummary.count > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </header>

      {profile?.headline && (
        <p className="text-mnt-ink mt-4 text-[14px]">{profile.headline}</p>
      )}
      {profile?.bio && (
        <p className="text-mnt-ink-muted mt-2 text-[13.5px] leading-relaxed whitespace-pre-line">
          {profile.bio}
        </p>
      )}

      <div className="bg-mnt-panel border-mnt-line mt-6 rounded-2xl border p-5">
        <div className="text-mnt-ink text-[14px] font-bold">
          Request 1:1 mentorship
        </div>
        <p className="text-mnt-ink-muted mt-1 text-[13px]">
          An ongoing mentoring relationship. Separate from booking a single
          session below.
        </p>
        <div className="mt-3">
          <RequestControl
            mentorId={id}
            initialStatus={reqStatus}
            canRequest={isValidated}
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-display text-[17px] font-bold">Book a session</h2>
        <p className="text-mnt-ink-muted mt-1 text-[13.5px]">
          Pick an open time below. Times are shown in your local timezone.{" "}
          {pricing
            ? "This mentor charges for sessions; you'll pay securely to confirm."
            : "The mentor confirms before the session is booked."}
        </p>
        <BookingPanel
          mentorId={id}
          status={slotsResult.status}
          mentorTimezone={slotsResult.timezone}
          durationMinutes={slotsResult.durationMinutes}
          slots={slotsResult.slots}
          canBook={isValidated}
          myBookings={myBookings}
          pricing={pricing}
        />
      </div>

      {/* Ratings & reviews */}
      <div className="mt-8">
        <h2 className="font-display text-[17px] font-bold">
          Ratings & reviews
        </h2>

        {canRate && (
          <div className="mt-3">
            <RatingForm
              mentorId={id}
              initialRating={myRating?.rating ?? null}
              initialReview={myRating?.review ?? null}
            />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {reviews.length === 0 ? (
            <p className="text-mnt-faint text-[13px]">
              {ratingSummary.count > 0
                ? "No written reviews yet."
                : canRate
                  ? "Be the first to rate this mentor."
                  : "No ratings yet."}
            </p>
          ) : (
            reviews.map((r, i) => (
              <div
                key={i}
                className="bg-mnt-panel border-mnt-line rounded-2xl border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13.5px] font-semibold">
                    {reviewerNames.get(r.mentee_id) ?? "A mentee"}
                  </span>
                  <Stars value={r.rating} />
                </div>
                <p className="text-mnt-ink-muted mt-2 text-[13.5px] leading-relaxed">
                  {r.review}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
