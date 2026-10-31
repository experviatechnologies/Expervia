/**
 * Display labels and colour tones for every enum the tracker shows. Keeping
 * these in one place keeps status wording identical across the list, detail,
 * dashboard and notification surfaces.
 */
import type {
  AccessLevel,
  CalendarStatus,
  ExceptionKind,
  ExceptionReason,
  MeetingFormat,
  NominationStatus,
  OutcomeTag,
  ParticipantStatus,
  PodRoutingStatus,
  RequestStatus,
  Role,
  Seniority,
  SkillLevel,
  SyncStatus,
} from "./types";

export type Tone =
  | "neutral"
  | "brand"
  | "info"
  | "success"
  | "warning"
  | "danger";

type Labelled = { label: string; tone: Tone };

export const ROLE_LABEL: Record<Role, string> = {
  member: "ETEN Member",
  pod_leader: "Pod Leader",
  sales_manager: "Sales Manager",
  management: "Management",
  admin: "System Administrator",
};

export const REQUEST_STATUS: Record<RequestStatus, Labelled> = {
  draft: { label: "Draft", tone: "neutral" },
  open: { label: "Open for nominations", tone: "info" },
  nominations_received: { label: "Nominations received", tone: "brand" },
  selection: { label: "Selection in progress", tone: "brand" },
  awaiting_acceptance: { label: "Awaiting acceptance", tone: "warning" },
  conflict: { label: "Conflict resolution", tone: "danger" },
  confirmed: { label: "Confirmed", tone: "success" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const ACTIVE_STATUSES: RequestStatus[] = [
  "open",
  "nominations_received",
  "selection",
  "awaiting_acceptance",
  "conflict",
];

export const PARTICIPANT_STATUS: Record<ParticipantStatus, Labelled> = {
  invitation_pending: { label: "Invitation pending", tone: "warning" },
  accepted: { label: "Accepted", tone: "success" },
  declined: { label: "Declined", tone: "danger" },
  confirmed: { label: "Confirmed", tone: "success" },
  replaced: { label: "Replaced", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  attended: { label: "Attended", tone: "success" },
  absent: { label: "Absent", tone: "danger" },
};

export const NOMINATION_STATUS: Record<NominationStatus, Labelled> = {
  submitted: { label: "Submitted", tone: "info" },
  selected: { label: "Selected", tone: "success" },
  not_selected: { label: "Not selected", tone: "neutral" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
  replaced: { label: "Replaced", tone: "neutral" },
};

export const ROUTING_STATUS: Record<PodRoutingStatus, Labelled> = {
  awaiting: { label: "Awaiting nominations", tone: "info" },
  nominated: { label: "Nominated", tone: "brand" },
  none_suitable: { label: "No suitable candidate", tone: "warning" },
};

export const CALENDAR_STATUS: Record<CalendarStatus, Labelled> = {
  connected: { label: "Calendar connected", tone: "success" },
  none: { label: "No calendar", tone: "neutral" },
  expired: { label: "Calendar expired", tone: "warning" },
  revoked: { label: "Calendar revoked", tone: "danger" },
  error: { label: "Calendar error", tone: "danger" },
};

export const SYNC_STATUS: Record<SyncStatus, Labelled> = {
  not_synced: { label: "Not synced yet", tone: "neutral" },
  pending: { label: "Sync pending", tone: "info" },
  created: { label: "Event created", tone: "success" },
  failed: { label: "Sync failed", tone: "danger" },
  manual: { label: "Manually confirmed", tone: "warning" },
};

export const FORMAT_LABEL: Record<MeetingFormat, string> = {
  online: "Online",
  physical: "Physical",
  hybrid: "Hybrid",
};

export const SENIORITY_LABEL: Record<Seniority, string> = {
  associate: "Associate",
  mid: "Mid-level",
  senior: "Senior",
  principal: "Principal / Architect",
};

export const SENIORITY_RANK: Record<Seniority, number> = {
  associate: 0,
  mid: 1,
  senior: 2,
  principal: 3,
};

export const LEVEL_LABEL: Record<SkillLevel, string> = {
  foundational: "Foundational",
  working: "Working",
  advanced: "Advanced",
  expert: "Expert",
};

export const ACCESS_LABEL: Record<AccessLevel, string> = {
  standard: "Standard",
  confidential: "Confidential",
  restricted: "Restricted",
};

export const EXCEPTION_KIND: Record<ExceptionKind, Labelled> = {
  unavailable_all: { label: "Unavailable all day", tone: "warning" },
  unavailable_part: {
    label: "Unavailable for part of the day",
    tone: "warning",
  },
  extra: { label: "Extra availability", tone: "success" },
};

export const EXCEPTION_REASON: Record<ExceptionReason, string> = {
  leave: "Leave",
  travel: "Travel",
  client_work: "Client work",
  training: "Training",
  personal: "Personal",
  other: "Other",
};

export const OUTCOME_TAG: Record<OutcomeTag, Labelled> = {
  progressed: { label: "progressed", tone: "success" },
  follow_up: { label: "follow up", tone: "warning" },
  on_hold: { label: "on hold", tone: "warning" },
  lost: { label: "lost", tone: "danger" },
};
