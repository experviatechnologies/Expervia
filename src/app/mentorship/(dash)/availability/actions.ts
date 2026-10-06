"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export type ActionResult = { ok: true } | { error: string };

type MentorCtx = {
  meId: string;
  admin: ReturnType<typeof getSupabaseAdmin>;
};

/** Resolve the caller and confirm they are a verified mentor. */
async function requireMentor(): Promise<MentorCtx | { error: string }> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  const admin = getSupabaseAdmin();
  const { data: mp } = await admin
    .from("mentor_profiles")
    .select("mentor_status")
    .eq("member_id", me.id)
    .maybeSingle();
  if (!mp || mp.mentor_status === "candidate") {
    return { error: "Only verified mentors can manage availability." };
  }
  return { meId: me.id, admin };
}

/** True for a valid IANA timezone name. */
function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** "HH:MM" (00:00–23:59). Also accepts "HH:MM:SS". */
function isValidTime(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(t);
}

/** minutes-from-midnight, for ordering comparisons on "HH:MM". */
function toMinutes(t: string): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}

function clampInt(
  v: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** Create or update the mentor's scheduling preferences. */
export async function saveSchedulingPrefs(input: {
  timezone: string;
  defaultSessionMinutes: number;
  minNoticeMinutes: number;
  bufferMinutes: number;
  maxSessionsPerWeek: number | null;
  availabilityStatus: "accepting" | "limited" | "unavailable";
}): Promise<ActionResult> {
  const ctx = await requireMentor();
  if ("error" in ctx) return ctx;

  const tz = (input.timezone ?? "").trim();
  if (!tz || !isValidTimezone(tz)) {
    return { error: "Please choose a valid timezone." };
  }
  if (
    !["accepting", "limited", "unavailable"].includes(input.availabilityStatus)
  ) {
    return { error: "Please choose a valid availability status." };
  }

  const maxPerWeek =
    input.maxSessionsPerWeek == null || Number(input.maxSessionsPerWeek) <= 0
      ? null
      : clampInt(input.maxSessionsPerWeek, 1, 100, 1);

  const { error } = await ctx.admin.from("mentor_scheduling_prefs").upsert(
    {
      member_id: ctx.meId,
      timezone: tz,
      default_session_minutes: clampInt(
        input.defaultSessionMinutes,
        10,
        240,
        40,
      ),
      min_notice_minutes: clampInt(input.minNoticeMinutes, 0, 20160, 120),
      buffer_minutes: clampInt(input.bufferMinutes, 0, 240, 10),
      max_sessions_per_week: maxPerWeek,
      availability_status: input.availabilityStatus,
    },
    { onConflict: "member_id" },
  );
  if (error) return { error: "Couldn't save your preferences. Try again." };

  revalidatePath("/mentorship/availability");
  return { ok: true };
}

/** Currencies the pricing profile accepts (kept in sync with migration 35). */
const ALLOWED_CURRENCIES = ["NGN", "USD", "GHS", "KES", "ZAR"] as const;
const MAX_MINOR = 1_000_000_000; // sanity cap, see migration 35

/**
 * Parse a major-unit amount (e.g. 20000 naira) into integer minor units
 * (kobo/cents). Empty/null means "not offered" and returns null.
 */
function parseAmountMinor(
  v: number | null | undefined,
  name: string,
): { minor: number | null } | { error: string } {
  if (v == null || (v as unknown as string) === "") return { minor: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return { error: `Enter a valid ${name}.` };
  const minor = Math.round(n * 100);
  if (minor > MAX_MINOR) return { error: `That ${name} is too large.` };
  return { minor };
}

/**
 * Create or update the mentor's paid-session pricing profile (Monetization
 * M-1). Amounts arrive in major units and are stored in minor units. A paid
 * profile requires a standard price; enabling extensions requires an extension
 * price. Specialist/expert prices are optional.
 */
export async function saveMentorPricing(input: {
  paidSessionsEnabled: boolean;
  currency: string;
  standardAmount: number | null;
  specialistAmount: number | null;
  expertAmount: number | null;
  extensionEnabled: boolean;
  extensionAmount: number | null;
}): Promise<ActionResult> {
  const ctx = await requireMentor();
  if ("error" in ctx) return ctx;

  const currency = (input.currency ?? "").trim().toUpperCase();
  if (!(ALLOWED_CURRENCIES as readonly string[]).includes(currency)) {
    return { error: "Please choose a supported currency." };
  }

  const standard = parseAmountMinor(input.standardAmount, "standard price");
  if ("error" in standard) return standard;
  const specialist = parseAmountMinor(
    input.specialistAmount,
    "specialist price",
  );
  if ("error" in specialist) return specialist;
  const expert = parseAmountMinor(input.expertAmount, "expert price");
  if ("error" in expert) return expert;
  const extension = parseAmountMinor(input.extensionAmount, "extension price");
  if ("error" in extension) return extension;

  const paidEnabled = Boolean(input.paidSessionsEnabled);
  const extensionEnabled = Boolean(input.extensionEnabled);

  if (paidEnabled && (standard.minor == null || standard.minor <= 0)) {
    return { error: "Set a standard session price to turn on paid sessions." };
  }
  if (extensionEnabled && (extension.minor == null || extension.minor <= 0)) {
    return { error: "Set an extension price to allow paid extensions." };
  }

  const { error } = await ctx.admin.from("mentor_pricing").upsert(
    {
      member_id: ctx.meId,
      paid_sessions_enabled: paidEnabled,
      currency,
      standard_amount: standard.minor,
      specialist_amount: specialist.minor,
      expert_amount: expert.minor,
      extension_enabled: extensionEnabled,
      extension_amount: extension.minor,
    },
    { onConflict: "member_id" },
  );
  if (error) return { error: "Couldn't save your pricing. Try again." };

  revalidatePath("/mentorship/availability");
  return { ok: true };
}

/** Add a recurring weekly availability block. */
export async function addAvailabilityBlock(input: {
  weekday: number;
  startTime: string;
  endTime: string;
}): Promise<ActionResult> {
  const ctx = await requireMentor();
  if ("error" in ctx) return ctx;

  const weekday = Math.round(Number(input.weekday));
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return { error: "Please choose a valid day of the week." };
  }
  if (!isValidTime(input.startTime) || !isValidTime(input.endTime)) {
    return { error: "Please enter valid start and end times." };
  }
  if (toMinutes(input.endTime) <= toMinutes(input.startTime)) {
    return { error: "The end time must be after the start time." };
  }

  const { error } = await ctx.admin.from("mentor_availability").insert({
    mentor_id: ctx.meId,
    weekday,
    start_time: input.startTime,
    end_time: input.endTime,
  });
  if (error) return { error: "Couldn't add that time block. Try again." };

  revalidatePath("/mentorship/availability");
  return { ok: true };
}

/** Remove one of the mentor's recurring blocks. */
export async function removeAvailabilityBlock(
  id: string,
): Promise<ActionResult> {
  const ctx = await requireMentor();
  if ("error" in ctx) return ctx;

  const { error } = await ctx.admin
    .from("mentor_availability")
    .delete()
    .eq("id", id)
    .eq("mentor_id", ctx.meId);
  if (error) return { error: "Couldn't remove that time block. Try again." };

  revalidatePath("/mentorship/availability");
  return { ok: true };
}

/** Add a date-specific exception (an extra window, or a block-out). */
export async function addAvailabilityException(input: {
  date: string;
  kind: "available" | "blocked";
  startTime?: string;
  endTime?: string;
}): Promise<ActionResult> {
  const ctx = await requireMentor();
  if ("error" in ctx) return ctx;

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    Number.isNaN(Date.parse(input.date))
  ) {
    return { error: "Please pick a valid date." };
  }
  if (input.kind !== "available" && input.kind !== "blocked") {
    return {
      error: "Please choose whether this date is extra time or blocked.",
    };
  }

  const hasStart = Boolean(input.startTime);
  const hasEnd = Boolean(input.endTime);

  if (input.kind === "available") {
    if (!hasStart || !hasEnd) {
      return { error: "Extra-availability dates need a start and end time." };
    }
  }
  // A blocked date may be whole-day (no times) or a partial window.
  let startTime: string | null = null;
  let endTime: string | null = null;
  if (hasStart || hasEnd) {
    if (
      !isValidTime(input.startTime ?? "") ||
      !isValidTime(input.endTime ?? "")
    ) {
      return { error: "Please enter valid start and end times." };
    }
    if (toMinutes(input.endTime!) <= toMinutes(input.startTime!)) {
      return { error: "The end time must be after the start time." };
    }
    startTime = input.startTime!;
    endTime = input.endTime!;
  }

  const { error } = await ctx.admin
    .from("mentor_availability_exceptions")
    .insert({
      mentor_id: ctx.meId,
      exception_date: input.date,
      kind: input.kind,
      start_time: startTime,
      end_time: endTime,
    });
  if (error) return { error: "Couldn't save that exception. Try again." };

  revalidatePath("/mentorship/availability");
  return { ok: true };
}

/** Remove one of the mentor's date exceptions. */
export async function removeAvailabilityException(
  id: string,
): Promise<ActionResult> {
  const ctx = await requireMentor();
  if ("error" in ctx) return ctx;

  const { error } = await ctx.admin
    .from("mentor_availability_exceptions")
    .delete()
    .eq("id", id)
    .eq("mentor_id", ctx.meId);
  if (error) return { error: "Couldn't remove that exception. Try again." };

  revalidatePath("/mentorship/availability");
  return { ok: true };
}
