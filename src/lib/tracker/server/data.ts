import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_TZ } from "@/lib/tracker/time";
import type {
  AccountStatus,
  Assignment,
  AuditEntry,
  AvailabilityException,
  ExceptionReason,
  MeetingFormat,
  Member,
  MeetingType,
  Nomination,
  Pod,
  Policies,
  PresalesRequest,
  Role,
  Seniority,
  Skill,
  SkillLevel,
  TrackerData,
  Weekday,
  WeeklyWindow,
} from "@/lib/tracker/types";
import { isStaff, type TrackerSession } from "./session";

/**
 * Server-side read layer for the real tracker (Phase 2, step 2.4).
 *
 * Reads the presales tables (migrations 46 and 47) with the service_role key
 * AFTER the caller's roles have been resolved by getTrackerSession(), then
 * applies the PRD section 5 visibility rules here, mirroring the RLS policies
 * (which stay in place as defence in depth for any direct client access):
 *   - Sales, Management, admin: everything.
 *   - Pod Leaders: requests routed to a pod they lead, except restricted ones;
 *     a confidential client is masked until an engineer has been selected.
 *   - Engineers: requests they have been selected for.
 * The output uses the same TrackerData shape the Phase 1 UI renders, so the
 * pages can switch from the demo store to live data without reshaping.
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;
type Row = Record<string, unknown>;

/**
 * Page through a PostgREST select (1,000-row server cap). Every caller orders
 * by a unique key so rows can't be skipped or repeated between pages.
 */
async function fetchAll<T extends Row>(
  build: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < pageSize) return out;
  }
}

const hhmm = (t: unknown) => (typeof t === "string" ? t.slice(0, 5) : "00:00");
/** mentor_availability.weekday is 0=Sun..6=Sat; the UI uses ISO 1=Mon..7=Sun. */
const isoWeekday = (d: number) => (d === 0 ? 7 : d) as Weekday;

// ------------------------------------------------------------------ reference

export async function loadReference(admin: Admin = getSupabaseAdmin()) {
  const [pods, leads, skills, types, settings] = await Promise.all([
    admin
      .from("pods")
      .select("id, slug, name, description, is_main")
      .eq("is_main", false)
      .order("name"),
    admin
      .from("pod_memberships")
      .select("pod_id, member_id, role_in_pod")
      .in("role_in_pod", ["lead", "co_lead"]),
    admin
      .from("skills")
      .select("id, name, pod_id, is_active, sort")
      .order("sort"),
    admin
      .from("presales_meeting_types")
      .select("id, name, is_active, sort")
      .order("sort"),
    admin.from("presales_settings").select("*").eq("id", true).maybeSingle(),
  ]);
  for (const r of [pods, leads, skills, types])
    if (r.error) throw new Error(r.error.message);

  const leadRows = (leads.data ?? []) as {
    pod_id: string;
    member_id: string;
    role_in_pod: string;
  }[];
  const podRows = (pods.data ?? []) as {
    id: string;
    slug: string;
    name: string;
    description: string | null;
  }[];
  const podName = new Map(podRows.map((p) => [p.id, p.name]));

  const podList: Pod[] = podRows.map((p) => ({
    id: p.id,
    code: p.slug.toUpperCase(),
    name: p.name,
    description: p.description ?? "",
    leaderId:
      leadRows.find((l) => l.pod_id === p.id && l.role_in_pod === "lead")
        ?.member_id ?? "",
    backupLeaderId: leadRows.find(
      (l) => l.pod_id === p.id && l.role_in_pod === "co_lead",
    )?.member_id,
    active: true,
  }));

  const skillList: Skill[] = (
    (skills.data ?? []) as {
      id: string;
      name: string;
      pod_id: string;
      is_active: boolean;
    }[]
  ).map((s) => ({
    id: s.id,
    name: s.name,
    // The real taxonomy groups skills by pod; the pod name is the category.
    category: podName.get(s.pod_id) ?? "Other",
    podId: s.pod_id,
    active: s.is_active,
  }));

  const meetingTypes: MeetingType[] = (
    (types.data ?? []) as { id: string; name: string; is_active: boolean }[]
  ).map((t) => ({
    id: t.id,
    name: t.name,
    active: t.is_active,
  }));

  const s = (settings.data ?? {}) as Row;
  const policies: Policies = {
    standardHours: (s.standard_hours as number) ?? 4,
    urgentHours: (s.urgent_hours as number) ?? 2,
    responseHours: (s.response_hours as number) ?? 24,
    freshDays: (s.fresh_days as number) ?? 14,
    reminderDay: ((s.reminder_weekday as number) ?? 1) as Weekday,
    timezone: (s.timezone as string) ?? DEFAULT_TZ,
    allowDirectSelection: (s.allow_direct_selection as boolean) ?? true,
    workingDays: ((s.working_days as number[]) ?? [1, 2, 3, 4, 5]) as Weekday[],
    opens: hhmm(s.opens_at ?? "09:00"),
    closes: hhmm(s.closes_at ?? "17:00"),
    holidays: (s.holidays as { date: string; name: string }[]) ?? [],
    outlookEnabled: (s.outlook_enabled as boolean) ?? false,
    googleEnabled: (s.google_enabled as boolean) ?? false,
  };

  return { pods: podList, skills: skillList, meetingTypes, policies, leadRows };
}

// ------------------------------------------------------------------ people

export async function loadMembers(
  admin: Admin,
  leadRows: { pod_id: string; member_id: string; role_in_pod: string }[],
): Promise<Member[]> {
  const [
    members,
    profiles,
    memberships,
    staffRoles,
    presales,
    skills,
    certs,
    windows,
    exceptions,
    prefs,
    users,
  ] = await Promise.all([
    fetchAll<Row>((a, b) =>
      admin
        .from("members")
        .select("id, status, role, claimed_at, membership_id")
        .order("id")
        .range(a, b),
    ),
    fetchAll<Row>((a, b) =>
      admin
        .from("profiles")
        .select("member_id, full_name, bio, years_experience, location")
        .order("member_id")
        .range(a, b),
    ),
    fetchAll<Row>((a, b) =>
      admin
        .from("pod_memberships")
        .select(
          "member_id, pod_id, role_in_pod, joined_at, pods!inner(is_main)",
        )
        .eq("pods.is_main", false)
        .order("joined_at")
        .order("id")
        .range(a, b),
    ),
    fetchAll<Row>((a, b) =>
      admin
        .from("member_roles")
        .select("member_id, role")
        .order("member_id")
        .order("role")
        .range(a, b),
    ),
    fetchAll<Row>((a, b) =>
      admin
        .from("presales_profiles")
        .select("*")
        .order("member_id")
        .range(a, b),
    ),
    fetchAll<Row>((a, b) =>
      admin
        .from("member_skills")
        .select("member_id, skill_id, level")
        .order("member_id")
        .order("skill_id")
        .range(a, b),
    ),
    fetchAll<Row>((a, b) =>
      admin
        .from("certifications")
        .select("member_id, name")
        .order("id")
        .range(a, b),
    ),
    fetchAll<Row>((a, b) =>
      admin
        .from("mentor_availability")
        .select(
          "id, mentor_id, weekday, start_time, end_time, formats, is_active",
        )
        .contains("purposes", ["presales"])
        .order("id")
        .range(a, b),
    ),
    fetchAll<Row>((a, b) =>
      admin
        .from("mentor_availability_exceptions")
        .select(
          "id, mentor_id, exception_date, kind, start_time, end_time, reason, note",
        )
        .contains("purposes", ["presales"])
        .order("id")
        .range(a, b),
    ),
    fetchAll<Row>((a, b) =>
      admin
        .from("mentor_scheduling_prefs")
        .select("member_id, timezone")
        .order("member_id")
        .range(a, b),
    ),
    listAuthUsers(admin),
  ]);

  const group = <T extends Row>(rows: T[], key: string) => {
    const m = new Map<string, T[]>();
    for (const r of rows) {
      const k = r[key] as string;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return m;
  };
  const profileBy = new Map(profiles.map((p) => [p.member_id as string, p]));
  const presalesBy = new Map(presales.map((p) => [p.member_id as string, p]));
  const tzBy = new Map(
    prefs.map((p) => [p.member_id as string, p.timezone as string]),
  );
  const podsBy = group(memberships, "member_id");
  const rolesBy = group(staffRoles, "member_id");
  const skillsBy = group(skills, "member_id");
  const certsBy = group(certs, "member_id");
  const winBy = group(windows, "mentor_id");
  const excBy = group(exceptions, "mentor_id");
  const leads = new Set(leadRows.map((l) => l.member_id));

  return members
    .filter((m) => m.claimed_at || m.status !== "active")
    .map((m): Member => {
      const id = m.id as string;
      const prof = profileBy.get(id) ?? {};
      const ps = presalesBy.get(id);
      const myPods = podsBy.get(id) ?? [];
      const user = users.get(id);
      const roles: Role[] = [];
      if (myPods.length) roles.push("member");
      if (leads.has(id)) roles.push("pod_leader");
      for (const r of rolesBy.get(id) ?? []) roles.push(r.role as Role);
      if (m.role === "operations") roles.push("admin");
      const years = (prof.years_experience as number) ?? 0;
      const status: AccountStatus =
        !m.claimed_at && m.status === "active"
          ? "invited"
          : (m.status as AccountStatus);

      return {
        id,
        code: (m.membership_id as string) ?? "",
        name: (prof.full_name as string) ?? "Unnamed member",
        email: user?.email ?? "",
        phone: (ps?.phone as string) ?? undefined,
        roles,
        status,
        podId: (myPods[0]?.pod_id as string) ?? "",
        extraPodIds: myPods.slice(1).map((p) => p.pod_id as string),
        seniority:
          (ps?.seniority as Seniority) ??
          (years >= 12
            ? "principal"
            : years >= 7
              ? "senior"
              : years >= 4
                ? "mid"
                : "associate"),
        years,
        bio: (prof.bio as string) ?? "",
        skills: (skillsBy.get(id) ?? []).map((s) => ({
          skillId: s.skill_id as string,
          level: (s.level as SkillLevel) ?? "working",
        })),
        specialisations: (ps?.specialisations as string[]) ?? [],
        certifications: (certsBy.get(id) ?? []).map((c) => c.name as string),
        industries: (ps?.industries as string[]) ?? [],
        formats: (ps?.formats as MeetingFormat[]) ?? ["online"],
        cities:
          (ps?.cities as string[]) ??
          (prof.location ? [String(prof.location).split(",")[0].trim()] : []),
        willingToTravel: (ps?.willing_to_travel as boolean) ?? false,
        travelNotes: (ps?.travel_notes as string) ?? "",
        timezone: tzBy.get(id) ?? DEFAULT_TZ,
        // Calendar connections arrive with the OAuth integration (Phase 8).
        calendar: "none",
        reviewedAt: (ps?.availability_reviewed_at as string) ?? null,
        lastSignInAt: user?.lastSignIn ?? null,
        weekly: (winBy.get(id) ?? []).map(
          (w): WeeklyWindow => ({
            id: w.id as string,
            day: isoWeekday(w.weekday as number),
            start: hhmm(w.start_time),
            end: hhmm(w.end_time),
            formats: (w.formats as MeetingFormat[]) ?? ["online"],
            active: (w.is_active as boolean) ?? true,
          }),
        ),
        exceptions: (excBy.get(id) ?? []).map(
          (e): AvailabilityException => ({
            id: e.id as string,
            date: e.exception_date as string,
            kind:
              e.kind === "available"
                ? "extra"
                : e.start_time
                  ? "unavailable_part"
                  : "unavailable_all",
            start: e.start_time ? hhmm(e.start_time) : undefined,
            end: e.end_time ? hhmm(e.end_time) : undefined,
            reason: (e.reason as ExceptionReason) ?? "other",
            note: (e.note as string) ?? undefined,
          }),
        ),
        busy: [],
        prefs: { weeklyReminder: true, meetingReminders: true, digest: false },
      };
    });
}

/** Email and last sign-in come from Supabase Auth. */
async function listAuthUsers(admin: Admin) {
  const out = new Map<string, { email: string; lastSignIn: string | null }>();
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) break;
    for (const u of data.users)
      out.set(u.id, {
        email: u.email ?? "",
        lastSignIn: u.last_sign_in_at ?? null,
      });
    if (data.users.length < 1000) break;
  }
  return out;
}

// ------------------------------------------------------------------ requests

export async function loadRequests(admin: Admin, session: TrackerSession) {
  const [reqs, reqSkills, reqPods, noms, assigns, outcomes, actions, activity] =
    await Promise.all([
      fetchAll<Row>((a, b) =>
        admin
          .from("presales_requests")
          .select("*")
          .order("starts_at")
          .order("id")
          .range(a, b),
      ),
      fetchAll<Row>((a, b) =>
        admin
          .from("presales_request_skills")
          .select("request_id, skill_id")
          .order("request_id")
          .order("skill_id")
          .range(a, b),
      ),
      fetchAll<Row>((a, b) =>
        admin
          .from("presales_request_pods")
          .select("*")
          .order("request_id")
          .order("pod_id")
          .range(a, b),
      ),
      fetchAll<Row>((a, b) =>
        admin.from("presales_nominations").select("*").order("id").range(a, b),
      ),
      fetchAll<Row>((a, b) =>
        admin.from("presales_assignments").select("*").order("id").range(a, b),
      ),
      fetchAll<Row>((a, b) =>
        admin
          .from("presales_outcomes")
          .select("*")
          .order("request_id")
          .range(a, b),
      ),
      fetchAll<Row>((a, b) =>
        admin
          .from("presales_outcome_actions")
          .select("*")
          .order("id")
          .range(a, b),
      ),
      fetchAll<Row>((a, b) =>
        admin
          .from("presales_activity")
          .select("request_id, actor_id, message, created_at")
          .order("created_at")
          .order("id")
          .range(a, b),
      ),
    ]);

  const me = session.member.id;
  const staff = isStaff(session);
  // Engineers in the pods this person leads (for replacement handling).
  const ledMembers = new Set<string>();
  if (!staff && session.ledPodIds.length > 0) {
    const rows = await fetchAll<Row>((a, b) =>
      admin
        .from("pod_memberships")
        .select("member_id")
        .in("pod_id", session.ledPodIds)
        .order("id")
        .range(a, b),
    );
    for (const r of rows) ledMembers.add(r.member_id as string);
  }
  const live = (a: Row) =>
    !["replaced", "cancelled"].includes(a.status as string);
  const participantOf = new Set(
    assigns
      .filter((a) => a.member_id === me && a.status !== "replaced")
      .map((a) => a.request_id as string),
  );
  const leadsRequest = (r: Row) =>
    r.status !== "draft" &&
    r.access !== "restricted" &&
    reqPods.some(
      (p) =>
        p.request_id === r.id && session.ledPodIds.includes(p.pod_id as string),
    );
  const visible = reqs.filter(
    (r) => staff || participantOf.has(r.id as string) || leadsRequest(r),
  );
  const visibleIds = new Set(visible.map((r) => r.id as string));

  const requests: PresalesRequest[] = visible.map((r) => {
    const id = r.id as string;
    const selected = assigns.some((a) => a.request_id === id && live(a));
    const masked = !staff && r.access === "confidential" && !selected;
    const seesLink = staff || participantOf.has(id);
    const outcome = outcomes.find((o) => o.request_id === id);
    return {
      id,
      ref: r.ref as string,
      title: r.title as string,
      client: masked ? "Confidential client" : (r.client as string),
      opportunityRef: staff ? ((r.opportunity_ref as string) ?? "") : "",
      objective: (r.objective as string) ?? "",
      meetingTypeId: (r.meeting_type_id as string) ?? "",
      access: r.access as PresalesRequest["access"],
      skillIds: reqSkills
        .filter((s) => s.request_id === id)
        .map((s) => s.skill_id as string),
      seniority: r.seniority as Seniority,
      needed: r.needed as number,
      startUtc: r.starts_at as string,
      endUtc: r.ends_at as string,
      timezone: (r.timezone as string) ?? DEFAULT_TZ,
      format: r.format as MeetingFormat,
      platform: (r.platform as string) ?? "",
      joinLink: seesLink ? ((r.join_link as string) ?? "") : "",
      location: (r.location as string) ?? "",
      techPrep: (r.tech_prep as string) ?? "",
      prepNotes: (r.prep_notes as string) ?? "",
      routing: reqPods
        .filter((p) => p.request_id === id)
        .map((p) => ({
          podId: p.pod_id as string,
          status: p.status as PresalesRequest["routing"][number]["status"],
          deadline: p.deadline as string,
          respondedAt: (p.responded_at as string) ?? undefined,
        })),
      urgency: r.urgency as PresalesRequest["urgency"],
      responseHours: r.response_hours as number,
      ownerId: r.owner_id as string,
      status: r.status as PresalesRequest["status"],
      createdAt: r.created_at as string,
      submittedAt: (r.submitted_at as string) ?? undefined,
      confirmedAt: (r.confirmed_at as string) ?? undefined,
      cancelledReason: (r.cancelled_reason as string) ?? undefined,
      override: r.override_reason
        ? {
            reason: r.override_reason as string,
            at: r.override_at as string,
            byId: (r.override_by as string) ?? "",
          }
        : undefined,
      rationale: staff ? ((r.rationale as string) ?? undefined) : undefined,
      outcome: outcome
        ? {
            summary: outcome.summary as string,
            tag: outcome.tag as NonNullable<PresalesRequest["outcome"]>["tag"],
            nextSteps: (outcome.next_steps as string) ?? "",
            recordedAt: outcome.recorded_at as string,
            recordedBy: (outcome.recorded_by as string) ?? "",
            actions: actions
              .filter((x) => x.request_id === id)
              .map((x) => ({
                id: x.id as string,
                text: x.text as string,
                ownerName: (x.owner_name as string) ?? "",
                due: (x.due_date as string) ?? "",
              })),
          }
        : undefined,
      activity: activity
        .filter((x) => x.request_id === id)
        .map((x) => ({
          at: x.created_at as string,
          actorId: (x.actor_id as string) ?? "system",
          text: x.message as string,
        })),
    };
  });

  const nominations: Nomination[] = noms
    .filter(
      (n) =>
        visibleIds.has(n.request_id as string) &&
        (staff || session.ledPodIds.includes(n.pod_id as string)),
    )
    .map((n) => ({
      id: n.id as string,
      requestId: n.request_id as string,
      podId: n.pod_id as string,
      memberId: n.member_id as string,
      byId: (n.nominated_by as string) ?? "",
      justification: n.justification as string,
      status: n.status as Nomination["status"],
      at: n.created_at as string,
    }));

  const assignments: Assignment[] = assigns
    .filter((a) => visibleIds.has(a.request_id as string))
    .filter(
      (a) =>
        staff || a.member_id === me || ledMembers.has(a.member_id as string),
    )
    .map((a) => ({
      id: a.id as string,
      requestId: a.request_id as string,
      memberId: a.member_id as string,
      status: a.status as Assignment["status"],
      invitedAt: a.invited_at as string,
      dueAt: a.due_at as string,
      respondedAt: (a.responded_at as string) ?? undefined,
      declineReason: (a.decline_reason as string) ?? undefined,
      sync: a.sync_status as Assignment["sync"],
      override: Boolean(a.is_direct_selection),
    }));

  return { requests, nominations, assignments };
}

// ------------------------------------------------------------------ everything

/** The full dataset for the signed-in user, in the UI's TrackerData shape. */
export async function loadTrackerData(
  session: TrackerSession,
): Promise<TrackerData> {
  const admin = getSupabaseAdmin();
  const ref = await loadReference(admin);
  const [members, work, audit] = await Promise.all([
    loadMembers(admin, ref.leadRows),
    loadRequests(admin, session),
    session.roles.includes("admin")
      ? admin
          .from("audit_log")
          .select("id, actor_id, action, target_type, reason, created_at")
          .like("action", "tracker.%")
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] as Row[] }),
  ]);

  const auditEntries: AuditEntry[] = ((audit.data ?? []) as Row[]).map((e) => ({
    id: e.id as string,
    at: e.created_at as string,
    actorId: (e.actor_id as string) ?? "system",
    action: e.action as string,
    target: (e.target_type as string) ?? "",
    reason: (e.reason as string) ?? undefined,
  }));

  return {
    version: 0,
    seededAt: new Date().toISOString(),
    pods: ref.pods,
    skills: ref.skills,
    meetingTypes: ref.meetingTypes,
    members,
    ...work,
    // Tracker notifications and background jobs are wired in step 2.5 / Phase 7.
    notifications: [],
    audit: auditEntries,
    jobs: [],
    policies: ref.policies,
    refCounter: 0,
  };
}
