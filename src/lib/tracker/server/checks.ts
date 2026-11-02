import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { evaluateMember, type Evaluation } from "@/lib/tracker/availability";
import { DEFAULT_TZ } from "@/lib/tracker/time";
import type {
  Assignment,
  ExceptionReason,
  MeetingFormat,
  Member,
  PresalesRequest,
  Weekday,
} from "@/lib/tracker/types";

/**
 * Server-side availability check for a request's participants (PRD
 * section 7: revalidate before final confirmation). Loads only what the rules
 * need for these people (presales windows and exceptions, formats, cities,
 * opt-in, time zone, and their seats on other active requests) and runs the
 * same evaluateMember() the screens use, so screen and server agree.
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;

const hhmm = (t: unknown) => (typeof t === "string" ? t.slice(0, 5) : "00:00");
const isoWeekday = (d: number) => (d === 0 ? 7 : d) as Weekday;

export async function evaluateParticipants(
  admin: Admin,
  meeting: {
    id: string;
    startUtc: string;
    endUtc: string;
    format: MeetingFormat;
    location: string | null;
  },
  memberIds: string[],
): Promise<Map<string, Evaluation>> {
  const out = new Map<string, Evaluation>();
  if (!memberIds.length) return out;

  const [members, presales, prefs, windows, exceptions, seats] =
    await Promise.all([
      admin.from("members").select("id, status").in("id", memberIds),
      admin
        .from("presales_profiles")
        .select(
          "member_id, formats, cities, willing_to_travel, opted_in, timezone",
        )
        .in("member_id", memberIds),
      admin
        .from("mentor_scheduling_prefs")
        .select("member_id, timezone")
        .in("member_id", memberIds),
      admin
        .from("mentor_availability")
        .select(
          "id, mentor_id, weekday, start_time, end_time, formats, is_active",
        )
        .in("mentor_id", memberIds)
        .contains("purposes", ["presales"]),
      admin
        .from("mentor_availability_exceptions")
        .select(
          "id, mentor_id, exception_date, kind, start_time, end_time, reason",
        )
        .in("mentor_id", memberIds)
        .contains("purposes", ["presales"]),
      admin
        .from("presales_assignments")
        .select("id, request_id, member_id, status")
        .in("member_id", memberIds)
        .in("status", ["invitation_pending", "accepted", "confirmed"])
        .neq("request_id", meeting.id),
    ]);
  for (const r of [members, presales, prefs, windows, exceptions, seats])
    if (r.error) throw new Error(r.error.message);

  // The other requests those seats belong to (for overlap checks).
  const otherIds = Array.from(
    new Set((seats.data ?? []).map((s) => s.request_id as string)),
  );
  const others = otherIds.length
    ? await admin
        .from("presales_requests")
        .select("id, status, starts_at, ends_at")
        .in("id", otherIds)
    : { data: [], error: null };
  if (others.error) throw new Error(others.error.message);

  const requests = (others.data ?? []).map(
    (r) =>
      ({
        id: r.id,
        status: r.status,
        startUtc: r.starts_at,
        endUtc: r.ends_at,
      }) as unknown as PresalesRequest,
  );
  const assignments = (seats.data ?? []).map(
    (s) =>
      ({
        id: s.id,
        requestId: s.request_id,
        memberId: s.member_id,
        status: s.status,
      }) as unknown as Assignment,
  );

  for (const id of memberIds) {
    const m = (members.data ?? []).find((x) => x.id === id);
    const ps = (presales.data ?? []).find((x) => x.member_id === id);
    const tz =
      (prefs.data ?? []).find((x) => x.member_id === id)?.timezone ??
      ps?.timezone ??
      DEFAULT_TZ;
    const member = {
      id,
      status: m?.status ?? "deactivated",
      optedIn: ps?.opted_in ?? true,
      formats: (ps?.formats as MeetingFormat[]) ?? ["online"],
      cities: (ps?.cities as string[]) ?? [],
      willingToTravel: Boolean(ps?.willing_to_travel),
      timezone: tz,
      // No calendar integration yet (Phase 8): declared availability only.
      calendar: "none",
      busy: [],
      weekly: (windows.data ?? [])
        .filter((w) => w.mentor_id === id)
        .map((w) => ({
          id: w.id,
          day: isoWeekday(w.weekday),
          start: hhmm(w.start_time),
          end: hhmm(w.end_time),
          formats: w.formats,
          active: w.is_active,
        })),
      exceptions: (exceptions.data ?? [])
        .filter((e) => e.mentor_id === id)
        .map((e) => ({
          id: e.id,
          date: e.exception_date,
          kind:
            e.kind === "available"
              ? "extra"
              : e.start_time
                ? "unavailable_part"
                : "unavailable_all",
          start: e.start_time ? hhmm(e.start_time) : undefined,
          end: e.end_time ? hhmm(e.end_time) : undefined,
          reason: (e.reason as ExceptionReason) ?? "other",
        })),
    } as unknown as Member;
    out.set(
      id,
      evaluateMember(
        member,
        {
          startUtc: meeting.startUtc,
          endUtc: meeting.endUtc,
          format: meeting.format,
          location: meeting.location ?? undefined,
          requestId: meeting.id,
        },
        { assignments, requests },
      ),
    );
  }
  return out;
}
