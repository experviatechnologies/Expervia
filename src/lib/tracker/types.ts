/**
 * Domain types for the ETEN Availability & Presales Coordination Tracker.
 *
 * Phase 1 is a frontend-only demo: these shapes back the in-browser demo store
 * (src/lib/tracker/store.tsx) and mirror the PRD's core entities (section 12.2)
 * so Phase 2 can map them onto Supabase tables without reshaping the UI.
 */

export type Role =
  | "member"
  | "pod_leader"
  | "sales_manager"
  | "management"
  | "admin";

export type MeetingFormat = "online" | "physical" | "hybrid";
export type Seniority = "associate" | "mid" | "senior" | "principal";
export type SkillLevel = "foundational" | "working" | "advanced" | "expert";
export type AccountStatus = "invited" | "active" | "suspended" | "deactivated";
export type CalendarStatus =
  | "connected"
  | "none"
  | "expired"
  | "revoked"
  | "error";
export type CalendarProvider = "microsoft" | "google" | "demo";

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type WeeklyWindow = {
  id: string;
  day: Weekday;
  /** "HH:mm" in the member's own time zone. */
  start: string;
  end: string;
  formats: MeetingFormat[];
  active: boolean;
};

export type ExceptionKind = "unavailable_all" | "unavailable_part" | "extra";
export type ExceptionReason =
  | "leave"
  | "travel"
  | "client_work"
  | "training"
  | "personal"
  | "other";

export type AvailabilityException = {
  id: string;
  /** "YYYY-MM-DD" in the member's time zone. */
  date: string;
  kind: ExceptionKind;
  start?: string;
  end?: string;
  reason: ExceptionReason;
  note?: string;
};

export type Pod = {
  id: string;
  code: string;
  name: string;
  description: string;
  leaderId: string;
  backupLeaderId?: string;
  active: boolean;
};

export type Skill = {
  id: string;
  name: string;
  category: string;
  podId: string;
  active: boolean;
};

export type MeetingType = { id: string; name: string; active: boolean };

export type Member = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  roles: Role[];
  status: AccountStatus;
  podId: string;
  extraPodIds: string[];
  seniority: Seniority;
  years: number;
  bio: string;
  skills: { skillId: string; level: SkillLevel }[];
  specialisations: string[];
  certifications: string[];
  industries: string[];
  formats: MeetingFormat[];
  cities: string[];
  willingToTravel: boolean;
  travelNotes: string;
  timezone: string;
  calendar: CalendarStatus;
  calendarProvider?: CalendarProvider;
  /** ISO timestamp of the member's last availability review. */
  reviewedAt: string | null;
  lastSignInAt: string | null;
  weekly: WeeklyWindow[];
  exceptions: AvailabilityException[];
  /**
   * Busy periods reported by the member's connected calendar (free/busy only,
   * no event details). Simulated in the Phase 1 demo.
   */
  busy: { startUtc: string; endUtc: string }[];
  prefs: {
    weeklyReminder: boolean;
    meetingReminders: boolean;
    digest: boolean;
  };
};

export type AccessLevel = "standard" | "confidential" | "restricted";
export type Urgency = "standard" | "urgent";

export type RequestStatus =
  | "draft"
  | "open"
  | "nominations_received"
  | "selection"
  | "awaiting_acceptance"
  | "conflict"
  | "confirmed"
  | "completed"
  | "cancelled";

export type PodRoutingStatus = "awaiting" | "nominated" | "none_suitable";

export type PodRouting = {
  podId: string;
  status: PodRoutingStatus;
  /** ISO nomination deadline. */
  deadline: string;
  respondedAt?: string;
};

export type OutcomeTag = "progressed" | "follow_up" | "on_hold" | "lost";

export type MeetingOutcome = {
  summary: string;
  tag: OutcomeTag;
  actions: { id: string; text: string; ownerName: string; due: string }[];
  nextSteps: string;
  recordedAt: string;
  recordedBy: string;
};

export type ActivityEntry = { at: string; actorId: string; text: string };

export type PresalesRequest = {
  id: string;
  ref: string;
  title: string;
  client: string;
  opportunityRef: string;
  objective: string;
  meetingTypeId: string;
  access: AccessLevel;
  skillIds: string[];
  seniority: Seniority;
  needed: number;
  /** ISO UTC instants. */
  startUtc: string;
  endUtc: string;
  timezone: string;
  format: MeetingFormat;
  platform: string;
  joinLink: string;
  location: string;
  techPrep: string;
  prepNotes: string;
  routing: PodRouting[];
  urgency: Urgency;
  responseHours: number;
  ownerId: string;
  status: RequestStatus;
  createdAt: string;
  submittedAt?: string;
  confirmedAt?: string;
  cancelledReason?: string;
  override?: { reason: string; at: string; byId: string };
  rationale?: string;
  outcome?: MeetingOutcome;
  activity: ActivityEntry[];
};

export type NominationStatus =
  | "submitted"
  | "selected"
  | "not_selected"
  | "withdrawn"
  | "replaced";

export type Nomination = {
  id: string;
  requestId: string;
  podId: string;
  memberId: string;
  byId: string;
  justification: string;
  status: NominationStatus;
  at: string;
};

export type ParticipantStatus =
  | "invitation_pending"
  | "accepted"
  | "declined"
  | "confirmed"
  | "replaced"
  | "cancelled"
  | "attended"
  | "absent";

export type SyncStatus =
  | "not_synced"
  | "pending"
  | "created"
  | "failed"
  | "manual";

export type Assignment = {
  id: string;
  requestId: string;
  memberId: string;
  status: ParticipantStatus;
  invitedAt: string;
  dueAt: string;
  respondedAt?: string;
  declineReason?: string;
  sync: SyncStatus;
  /** Set when the Sales Manager selected someone who was not nominated. */
  override?: boolean;
};

export type Notification = {
  id: string;
  /** Recipient member id. */
  to: string;
  at: string;
  title: string;
  body: string;
  action?: string;
  requestId?: string;
  href?: string;
  critical: boolean;
  dueAt?: string;
  read: boolean;
};

export type AuditEntry = {
  id: string;
  at: string;
  actorId: string;
  action: string;
  target: string;
  reason?: string;
};

export type BackgroundJob = {
  id: string;
  kind: "calendar_sync" | "email" | "reminder";
  label: string;
  status: "failed" | "succeeded";
  at: string;
  error?: string;
  attempts: number;
};

export type Policies = {
  standardHours: number;
  urgentHours: number;
  responseHours: number;
  freshDays: number;
  reminderDay: Weekday;
  timezone: string;
  allowDirectSelection: boolean;
  workingDays: Weekday[];
  opens: string;
  closes: string;
  holidays: { date: string; name: string }[];
  outlookEnabled: boolean;
  googleEnabled: boolean;
};

export type TrackerData = {
  version: number;
  seededAt: string;
  pods: Pod[];
  skills: Skill[];
  meetingTypes: MeetingType[];
  members: Member[];
  requests: PresalesRequest[];
  nominations: Nomination[];
  assignments: Assignment[];
  notifications: Notification[];
  audit: AuditEntry[];
  jobs: BackgroundJob[];
  policies: Policies;
  refCounter: number;
};
