import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getMentorshipDefaults } from "@/lib/eten/availability";
import { AvailabilityEditor, type Prefs } from "./availability-editor";
import { PricingCard, type Pricing } from "./pricing-card";

export const metadata = { title: "Availability" };

export default async function MentorshipAvailabilityPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/mentorship/signin");

  const admin = getSupabaseAdmin();

  const { data: mp } = await admin
    .from("mentor_profiles")
    .select("mentor_status")
    .eq("member_id", member.id)
    .maybeSingle();
  const isVerifiedMentor = Boolean(mp && mp.mentor_status !== "candidate");

  if (!isVerifiedMentor) {
    return (
      <div className="mx-auto max-w-[820px] px-6 py-8">
        <h1 className="font-display text-2xl font-extrabold">Availability</h1>
        <p className="text-mnt-ink-muted mt-2 text-[14px] leading-relaxed">
          Only verified mentors can publish availability. Once the ETEN
          Readiness Panel verifies you, you&apos;ll set your weekly schedule
          here and mentees will be able to book conflict-free slots with you.
        </p>
      </div>
    );
  }

  const [
    { data: prefsRow },
    { data: blockRows },
    { data: excRows },
    { data: pricingRow },
  ] = await Promise.all([
    admin
      .from("mentor_scheduling_prefs")
      .select(
        "timezone, default_session_minutes, min_notice_minutes, buffer_minutes, max_sessions_per_week, availability_status",
      )
      .eq("member_id", member.id)
      .maybeSingle(),
    admin
      .from("mentor_availability")
      .select("id, weekday, start_time, end_time")
      .eq("mentor_id", member.id)
      .order("weekday")
      .order("start_time"),
    admin
      .from("mentor_availability_exceptions")
      .select("id, exception_date, kind, start_time, end_time")
      .eq("mentor_id", member.id)
      .order("exception_date"),
    admin
      .from("mentor_pricing")
      .select(
        "paid_sessions_enabled, currency, standard_amount, specialist_amount, expert_amount, extension_enabled, extension_amount",
      )
      .eq("member_id", member.id)
      .maybeSingle(),
  ]);

  const pricing: Pricing = {
    paidSessionsEnabled: pricingRow?.paid_sessions_enabled ?? false,
    currency: pricingRow?.currency ?? "NGN",
    standardAmount: pricingRow?.standard_amount ?? null,
    specialistAmount: pricingRow?.specialist_amount ?? null,
    expertAmount: pricingRow?.expert_amount ?? null,
    extensionEnabled: pricingRow?.extension_enabled ?? false,
    extensionAmount: pricingRow?.extension_amount ?? null,
  };

  let prefs: Prefs;
  if (prefsRow) {
    prefs = {
      timezone: prefsRow.timezone,
      defaultSessionMinutes: prefsRow.default_session_minutes,
      minNoticeMinutes: prefsRow.min_notice_minutes,
      bufferMinutes: prefsRow.buffer_minutes,
      maxSessionsPerWeek: prefsRow.max_sessions_per_week,
      availabilityStatus: prefsRow.availability_status,
    };
  } else {
    // First time here: seed the editor from the platform defaults (FR-20).
    const defaults = await getMentorshipDefaults();
    prefs = {
      timezone: "UTC",
      defaultSessionMinutes: defaults.defaultSessionMinutes,
      minNoticeMinutes: defaults.minNoticeMinutes,
      bufferMinutes: defaults.bufferMinutes,
      maxSessionsPerWeek: null,
      availabilityStatus: "accepting",
    };
  }

  const blocks = (blockRows ?? []).map((b) => ({
    id: b.id,
    weekday: b.weekday,
    startTime: String(b.start_time).slice(0, 5),
    endTime: String(b.end_time).slice(0, 5),
  }));
  const exceptions = (excRows ?? []).map((e) => ({
    id: e.id,
    date: e.exception_date,
    kind: e.kind,
    startTime: e.start_time ? String(e.start_time).slice(0, 5) : null,
    endTime: e.end_time ? String(e.end_time).slice(0, 5) : null,
  }));

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const totalMin = blocks.reduce(
    (t, b) => t + Math.max(0, toMin(b.endTime) - toMin(b.startTime)),
    0,
  );
  const hrs = Math.floor(totalMin / 60);
  const rem = totalMin % 60;
  const hoursLabel = rem ? `${hrs}h ${rem}m` : `${hrs}h`;
  const paidLabel = pricing.paidSessionsEnabled ? "On" : "Free";

  const stats = [
    { label: "Weekly blocks", value: String(blocks.length) },
    { label: "Hours open per week", value: hoursLabel },
    { label: "Session length", value: `${prefs.defaultSessionMinutes} min` },
    { label: "Paid sessions", value: paidLabel },
  ];

  return (
    <div className="px-6 py-8 md:px-9">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
        <header className="max-w-[640px]">
          <h1 className="font-display text-mnt-ink text-[30px] font-extrabold tracking-[-0.02em]">
            Availability
          </h1>
          <p className="text-mnt-ink-muted mt-1.5 text-[15px] leading-relaxed">
            Publish when you&apos;re free. Mentees only see open slots,
            converted to their own timezone, never your calendar.
          </p>
        </header>

        {/* Summary strip */}
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-mnt-panel border-mnt-line rounded-[16px] border px-[18px] py-4"
            >
              <div className="text-mnt-ink-muted text-[12px] font-semibold">
                {s.label}
              </div>
              <div className="text-mnt-ink mt-0.5 text-[24px] font-extrabold tabular-nums">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <AvailabilityEditor
          prefs={prefs}
          hasPrefs={Boolean(prefsRow)}
          blocks={blocks}
          exceptions={exceptions}
          pricingSlot={<PricingCard pricing={pricing} />}
        />
      </div>
    </div>
  );
}
