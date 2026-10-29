import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, MapPin, ShieldCheck, Star } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getMentorSlots } from "@/lib/eten/availability";
import { getFxRate } from "@/lib/eten/fx";
import { requestOrigin } from "@/lib/eten/request-origin";
import { summarizeRatings, canRateMentor } from "@/lib/eten/ratings";
import { RatingForm } from "../../(dash)/mentors/[id]/rating-form";
import { ShareLink } from "@/components/shared/share-link";
import {
  GuestBookingWidget,
  type SessionTypeOption,
} from "./guest-booking-widget";

export const metadata = { title: "Book a session" };

const TIER_LABEL: Record<string, string> = {
  verified: "Verified Mentor",
  senior: "Senior Mentor",
  expert: "Expert Mentor",
  master: "Master Mentor",
};

const SESSION_TIERS: {
  id: SessionTypeOption["id"];
  column: "standard_amount" | "specialist_amount" | "expert_amount";
  title: string;
  text: string;
}[] = [
  {
    id: "standard",
    column: "standard_amount",
    title: "Career chat",
    text: "Career direction, a CV review or a study plan for your next certification.",
  },
  {
    id: "specialist",
    column: "specialist_amount",
    title: "Technical deep dive",
    text: "Work through a design, a migration or an interview problem together.",
  },
  {
    id: "expert",
    column: "expert_amount",
    title: "Architecture review",
    text: "Bring a real problem or design. Leave with clear, written feedback.",
  },
];

const HOW_STEPS = [
  { n: 1, t: "Pick a session", d: "Choose what you want to work on." },
  { n: 2, t: "Choose a time", d: "Open times appear in your own time zone." },
  {
    n: 3,
    t: "Pay securely",
    d: "ETEN holds payment until the session is done.",
  },
  {
    n: 4,
    t: "Meet on video",
    d: "Get the link by email, plus a reminder an hour before.",
  },
];

const FAQS = [
  {
    q: "Can I book if I don't have an ETEN account?",
    a: "Yes. Book and pay here, and we'll email you a link to set up your account so you can join and manage the session.",
  },
  {
    q: "What happens after I pay?",
    a: "You get a confirmation email with the video link, and a reminder an hour before. ETEN holds your payment and releases it to the mentor after the session.",
  },
  {
    q: "Can I reschedule or cancel?",
    a: "You can reschedule for free up to 24 hours before the session. Cancel more than 24 hours before for a full refund.",
  },
  {
    q: "Who checks the mentors?",
    a: "Every mentor is reviewed by the ETEN Readiness Panel before they are verified and can take bookings.",
  },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "your mentor";
}

const card = "bg-mnt-panel border-mnt-line rounded-[20px] border p-6";

/**
 * The whole public booking page, by mentor id. Rendered both at
 * /mentorship/book/[mentorId] and at /m/[handle] (which resolves the handle to
 * an id first), so a mentor's custom link and their id link show the same page.
 */
export async function BookingView({ mentorId }: { mentorId: string }) {
  const admin = getSupabaseAdmin();

  const { data: mentor } = await admin
    .from("mentor_profiles")
    .select("member_id, mentor_status, capability_area_id, handle")
    .eq("member_id", mentorId)
    .maybeSingle();
  if (!mentor || mentor.mentor_status === "candidate") notFound();

  const origin = await requestOrigin();
  const shareUrl = mentor.handle
    ? `${origin}/m/${mentor.handle}`
    : `${origin}/mentorship/book/${mentorId}`;

  const [
    { data: profile },
    { data: areaRow },
    { data: pricing },
    { data: ratingRows },
    { data: circleRows },
    { count: sessionsHeld },
    slotsResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name, headline, bio")
      .eq("member_id", mentorId)
      .maybeSingle(),
    mentor.capability_area_id
      ? admin
          .from("capability_areas")
          .select("label")
          .eq("id", mentor.capability_area_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("mentor_pricing")
      .select(
        "paid_sessions_enabled, currency, standard_amount, specialist_amount, expert_amount, extension_enabled, extension_amount",
      )
      .eq("member_id", mentorId)
      .maybeSingle(),
    admin
      .from("mentor_ratings")
      .select("mentee_id, rating, review, updated_at")
      .eq("mentor_id", mentorId)
      .order("updated_at", { ascending: false }),
    admin
      .from("mentorship_circles")
      .select("id, title, status, format")
      .eq("mentor_id", mentorId)
      .neq("format", "one_to_one")
      .eq("status", "active"),
    admin
      .from("session_bookings")
      .select("id", { count: "exact", head: true })
      .eq("mentor_id", mentorId)
      .eq("status", "accepted"),
    getMentorSlots(mentorId, { days: 21 }),
  ]);

  const name = profile?.full_name ?? "A mentor";
  const fName = firstName(name);
  const areaLabel = areaRow?.label ?? "Mentorship";
  const tierLabel = TIER_LABEL[mentor.mentor_status] ?? "Verified Mentor";
  const ratings = summarizeRatings(
    (ratingRows ?? []).map((r) => ({ rating: r.rating })),
  );

  const paidEnabled = Boolean(pricing?.paid_sessions_enabled);
  const currency = pricing?.currency ?? "NGN";
  const defaultMinutes = slotsResult.durationMinutes;

  const paidTiers: SessionTypeOption[] = paidEnabled
    ? SESSION_TIERS.flatMap((tier) => {
        const amount = pricing?.[tier.column] as number | null | undefined;
        if (!amount || amount <= 0) return [];
        return [
          {
            id: tier.id,
            title: tier.title,
            text: tier.text,
            mins: defaultMinutes,
            amount,
          },
        ];
      })
    : [];

  // A mentor with paid tiers takes paid sessions; otherwise the booking is a
  // free request the mentor confirms, offered as a single session type.
  const isPaidMentor = paidTiers.length > 0;
  const sessionTypes: SessionTypeOption[] = isPaidMentor
    ? paidTiers
    : [
        {
          id: "standard",
          title: "Mentoring session",
          text: `A 1:1 session with ${fName}. ${fName} confirms your request before it's booked.`,
          mins: defaultMinutes,
          amount: 0,
        },
      ];

  // Bookable whenever the mentor is open (free or paid). Only a mentor who has
  // marked themselves unavailable is not bookable.
  const canBook = slotsResult.status !== "unavailable";

  // Optional 30-minute extension (paid mentors only).
  const extensionAmount = pricing?.extension_amount as
    | number
    | null
    | undefined;
  const extensionOption =
    isPaidMentor && pricing?.extension_enabled && extensionAmount
      ? { amount: extensionAmount, minutes: 30 }
      : null;

  // Live FX so an international guest can pay (and see prices) in USD. Null when
  // the mentor already prices in USD, isn't paid, or the rate is unavailable.
  const usdRate =
    isPaidMentor && canBook && currency !== "USD"
      ? await getFxRate(currency, "USD")
      : null;

  // Reviewer names for real testimonials.
  const reviewMenteeIds = Array.from(
    new Set((ratingRows ?? []).filter((r) => r.review).map((r) => r.mentee_id)),
  );
  const { data: reviewerRows } = reviewMenteeIds.length
    ? await admin
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", reviewMenteeIds)
    : { data: [] };
  const reviewerName = new Map(
    (reviewerRows ?? []).map((r) => [r.member_id, r.full_name ?? "A mentee"]),
  );
  const reviews = (ratingRows ?? [])
    .filter((r) => r.review)
    .slice(0, 8)
    .map((r) => ({
      quote: r.review as string,
      name: reviewerName.get(r.mentee_id) ?? "A mentee",
      rating: r.rating,
    }));

  // Auth-aware: a signed-in mentee who has been mentored by this mentor can
  // leave a rating here (ported from the mentor profile). Guests never see it.
  const me = await getCurrentMember();
  const myRating = me
    ? ((ratingRows ?? []).find((r) => r.mentee_id === me.id) ?? null)
    : null;
  const canRate =
    me && me.id !== mentorId
      ? await canRateMentor(admin, me.id, mentorId)
      : false;

  const stats = [
    {
      v: ratings.count > 0 ? `${ratings.avg.toFixed(1)} ★` : "New",
      l: ratings.count > 0 ? `${ratings.count} reviews` : "No reviews yet",
    },
    { v: String(sessionsHeld ?? 0), l: "Sessions held" },
    { v: String((circleRows ?? []).length), l: "Circles led" },
    { v: `${defaultMinutes} min`, l: "Session length" },
  ];

  return (
    <div data-app-surface className="bg-mnt-bg text-mnt-ink min-h-screen">
      {/* Top bar */}
      <header className="bg-mnt-panel border-mnt-line border-b">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/expervia-logo.png"
              alt="Expervia Technologies"
              data-app-logo
              className="h-7 w-auto"
            />
            <span className="text-mnt-brand bg-mnt-brand/10 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] uppercase">
              ETEN Mentorship
            </span>
          </div>
          <nav className="flex items-center gap-1.5">
            <Link
              href="/mentorship/mentors"
              className="text-mnt-ink-muted hover:text-mnt-ink px-3 py-2 text-[14px] font-semibold"
            >
              Find more mentors
            </Link>
            <Link
              href="/mentorship/signin"
              className="border-mnt-line text-mnt-ink hover:border-mnt-brand inline-flex h-10 items-center rounded-full border px-4 text-[14px] font-bold transition"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden [background:linear-gradient(120deg,#110263_0%,#35007F_50%,#7530E6_100%)]">
        <div className="relative mx-auto flex max-w-[1200px] flex-wrap items-start justify-between gap-6 px-6 pt-10 pb-24 text-white">
          <div className="flex flex-col gap-2.5">
            <span className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-bold tracking-[0.06em] text-[#d9ccfb] uppercase">
              Book from anywhere · times shown in your zone
            </span>
            <h1 className="max-w-[640px] text-[32px] leading-[1.15] font-extrabold tracking-[-0.02em] md:text-[36px]">
              Book a 1:1 session with {name}
            </h1>
            <p className="max-w-[620px] text-[16px] leading-relaxed text-[#e4dbfc]">
              {name} is a verified ETEN mentor in {areaLabel}. Pick a session
              and grab a time in your own zone
              {isPaidMentor ? ", and pay securely" : ""}, no account needed to
              start.
            </p>
          </div>
          <ShareLink
            url={shareUrl}
            variant="hero"
            message={`Book a session with ${name} on ETEN:`}
          />
        </div>
      </section>

      <div className="relative mx-auto -mt-16 flex max-w-[1200px] flex-wrap items-start gap-6 px-6 pb-12">
        {/* Left column */}
        <div className="flex min-w-0 flex-[3_1_560px] flex-col gap-5">
          {/* Profile */}
          <section
            className={card + " shadow-[0_10px_30px_rgba(17,2,99,0.06)]"}
          >
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative shrink-0">
                <span className="bg-mnt-brand/14 text-mnt-brand border-mnt-panel grid size-[104px] place-items-center rounded-full border-4 text-[32px] font-extrabold shadow-[0_4px_14px_rgba(17,2,99,0.18)]">
                  {initials(name)}
                </span>
                {canBook && (
                  <span
                    className="bg-mnt-green border-mnt-panel absolute right-1.5 bottom-1.5 size-[18px] rounded-full border-[3px]"
                    aria-label="Accepting bookings"
                  />
                )}
              </div>
              <div className="min-w-0 flex-[1_1_280px]">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-mnt-ink text-[26px] font-extrabold tracking-[-0.01em]">
                    {name}
                  </h2>
                  <span className="bg-mnt-green/12 text-mnt-green inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold">
                    <ShieldCheck className="size-3.5" /> Verified mentor
                  </span>
                </div>
                {profile?.headline && (
                  <div className="text-mnt-ink mt-1 text-[15px]">
                    {profile.headline}
                  </div>
                )}
                <div className="text-mnt-ink-muted mt-1.5 flex flex-wrap gap-4 text-[13px]">
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="size-3.5" /> {areaLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {tierLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5 grid [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))] gap-2.5">
              {stats.map((s) => (
                <div
                  key={s.l}
                  className="bg-mnt-panel-2 rounded-[14px] px-3.5 py-3"
                >
                  <div className="text-mnt-ink text-[20px] font-extrabold">
                    {s.v}
                  </div>
                  <div className="text-mnt-ink-muted text-[12px]">{s.l}</div>
                </div>
              ))}
            </div>
          </section>

          {/* About */}
          {profile?.bio && (
            <section className={card + " flex flex-col gap-3"}>
              <h2 className="text-mnt-ink text-[18px] font-extrabold">
                About {fName}
              </h2>
              <p className="text-mnt-ink-muted text-[15px] leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </section>
          )}

          {/* How booking works */}
          <section className={card + " flex flex-col gap-3.5"}>
            <h2 className="text-mnt-ink text-[18px] font-extrabold">
              How booking works
            </h2>
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] gap-3">
              {HOW_STEPS.map((h) => (
                <div
                  key={h.n}
                  className="bg-mnt-panel-2 border-mnt-line flex flex-col gap-1.5 rounded-[14px] border p-3.5"
                >
                  <span className="bg-mnt-brand text-mnt-on-brand grid size-7 place-items-center rounded-full text-[13px] font-extrabold">
                    {h.n}
                  </span>
                  <div className="text-mnt-ink text-[14px] font-bold">
                    {h.t}
                  </div>
                  <div className="text-mnt-ink-muted text-[13px] leading-relaxed">
                    {h.d}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Ratings & reviews */}
          {(reviews.length > 0 || canRate) && (
            <section className={card + " flex flex-col gap-3.5"}>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <h2 className="text-mnt-ink text-[18px] font-extrabold">
                  Ratings &amp; reviews
                </h2>
                {ratings.count > 0 && (
                  <span className="text-mnt-ink inline-flex items-center gap-1.5 text-[14px] font-bold">
                    <Star className="fill-mnt-amber text-mnt-amber size-4" />
                    {ratings.avg.toFixed(1)} · {ratings.count} review
                    {ratings.count > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {canRate && (
                <div className="border-mnt-line rounded-[14px] border p-4">
                  <div className="text-mnt-ink mb-2 text-[14px] font-bold">
                    {myRating ? "Your review" : "Leave a review"}
                  </div>
                  <RatingForm
                    mentorId={mentorId}
                    initialRating={myRating?.rating ?? null}
                    initialReview={myRating?.review ?? null}
                  />
                </div>
              )}
              {reviews.length > 0 && (
                <div className="grid [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))] gap-3">
                  {reviews.map((r, i) => (
                    <figure
                      key={i}
                      className="border-mnt-line m-0 flex flex-col gap-2.5 rounded-[14px] border p-4"
                    >
                      <span
                        className="inline-flex gap-0.5"
                        aria-label={`${r.rating} out of 5`}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={
                              "size-3.5 " +
                              (n <= r.rating
                                ? "fill-mnt-amber text-mnt-amber"
                                : "text-mnt-faint")
                            }
                          />
                        ))}
                      </span>
                      <blockquote className="text-mnt-ink m-0 text-[14px] leading-relaxed">
                        {r.quote}
                      </blockquote>
                      <figcaption className="text-mnt-ink-muted mt-auto text-[12px] font-semibold">
                        {r.name}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Circles */}
          {(circleRows ?? []).length > 0 && (
            <section className={card + " flex flex-col gap-3.5"}>
              <div>
                <h2 className="text-mnt-ink text-[18px] font-extrabold">
                  Circles {fName} leads
                </h2>
                <p className="text-mnt-ink-muted mt-1 text-[13px]">
                  Small group cohorts, a lower-cost way to learn with peers.
                </p>
              </div>
              <div className="grid [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))] gap-3">
                {(circleRows ?? []).map((c) => (
                  <div
                    key={c.id}
                    className="border-mnt-line flex flex-col gap-2 rounded-[14px] border p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-mnt-ink text-[15px] font-extrabold">
                        {c.title ?? "Mentorship Circle"}
                      </span>
                      <span className="bg-mnt-green/12 text-mnt-green rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize">
                        {c.status}
                      </span>
                    </div>
                    <Link
                      href="/mentorship/signin"
                      className="text-mnt-brand text-[13px] font-bold"
                    >
                      Sign in to join →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          <section className={card + " flex flex-col"}>
            <h2 className="text-mnt-ink mb-2 text-[18px] font-extrabold">
              Questions
            </h2>
            {FAQS.map((f, i) => (
              <details
                key={i}
                className="border-mnt-line group border-t py-3.5 first:border-t-0"
              >
                <summary className="text-mnt-ink flex cursor-pointer list-none items-center justify-between gap-2.5 text-[15px] font-bold">
                  {f.q}
                  <span className="text-mnt-faint transition-transform group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <p className="text-mnt-ink-muted mt-2 text-[14px] leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </section>
        </div>

        {/* Booking card */}
        <aside
          aria-label="Book a session"
          className="sticky top-4 flex min-w-0 flex-[2_1_360px] flex-col gap-3"
        >
          {canBook ? (
            <GuestBookingWidget
              mentorId={mentorId}
              mentorFirstName={fName}
              currency={currency}
              types={sessionTypes}
              slots={slotsResult.slots.map((s) => s.start)}
              extension={extensionOption}
              usdRate={usdRate}
              paid={isPaidMentor}
            />
          ) : (
            <div className={card + " text-center"}>
              <h2 className="text-mnt-ink text-[18px] font-extrabold">
                Not accepting bookings right now
              </h2>
              <p className="text-mnt-ink-muted mt-2 text-[14px] leading-relaxed">
                {fName} isn&apos;t open for bookings at the moment. Browse other
                verified mentors, or check back soon.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                <Link
                  href="/mentorship/mentors"
                  className="bg-mnt-brand text-mnt-on-brand inline-flex h-11 items-center rounded-xl px-4 text-[14px] font-bold"
                >
                  Browse mentors
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>

      <footer className="bg-[#110263] text-[#cfc6f5]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-7 text-[13px]">
          <span>
            <strong className="text-white">ETEN by Expervia</strong> · The
            specialist community for technology professionals
          </span>
          <span className="flex flex-wrap gap-4">
            <Link href="/mentorship" className="text-[#cfc6f5]">
              About ETEN
            </Link>
            <Link href="/mentorship/mentors" className="text-[#cfc6f5]">
              Find a mentor
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

export default async function GuestBookingPage({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  const { mentorId } = await params;
  return <BookingView mentorId={mentorId} />;
}
