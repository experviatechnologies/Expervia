/**
 * Presales tracker notification events (PRD section 10). A notification row
 * stores the event key in `target_type` and the request id in `target_id`
 * (the same pattern as mentorship notifications); this file turns them into
 * wording. Pure, so any server component that lists notifications can use it.
 */

import { siteConfig } from "@/config/site";

export const PRESALES_EVENTS = [
  "request_routed", // Pod Leaders: nominate by the deadline
  "deadline_near", // Pod Leaders: respond or escalate
  "nominations_submitted", // Sales Manager: review candidates
  "none_suitable", // Sales Manager: widen the search
  "invited", // Engineer: accept or decline
  "invite_accepted", // Sales Manager
  "invite_declined", // Sales Manager and Pod Leader: find a replacement
  "direct_selection", // Pod Leader: an engineer was selected without nomination
  "calendar_conflict", // Sales Manager and engineer: resolve before confirming
  "confirmed", // Participants: prepare and attend
  "rescheduled", // Participants: confirm the new time
  "released", // Engineer: no longer needed
  "cancelled", // Participants
  "outcome_needed", // Meeting owner: record outcome and actions
  "role_granted", // Member: given a Sales or Management role
  "pod_leader_assigned", // Member: made Lead or backup leader of a pod
  // Scheduled reminders and escalations (Phase 7)
  "deadline_missed", // Sales Manager and backup leader: a pod didn't respond
  "invite_expiring", // Engineer: invitation response due soon
  "invite_overdue", // Sales Manager: an invitation passed its deadline
  "meeting_reminder", // Participants: meeting in 24 hours or 1 hour
  "availability_review", // Engineer: weekly availability review
  // Calendar integration (Phase 8)
  "calendar_reconnect", // Engineer: calendar access expired or was removed
  "integration_failure", // Admins: a scheduled job started failing
] as const;

export type PresalesEvent = (typeof PRESALES_EVENTS)[number];

export function presalesNotifText(event: string | null, actor: string): string {
  switch (event as PresalesEvent) {
    case "request_routed":
      return `${actor} needs nominations from your pod for a presales meeting`;
    case "deadline_near":
      return "A presales nomination deadline is approaching";
    case "nominations_submitted":
      return `${actor} nominated engineers for your presales request`;
    case "none_suitable":
      return `${actor} has no suitable candidate for your presales request`;
    case "invited":
      return `${actor} selected you for a client meeting. Please accept or decline`;
    case "invite_accepted":
      return `${actor} accepted a presales invitation`;
    case "invite_declined":
      return `${actor} declined a presales invitation; a replacement is needed`;
    case "direct_selection":
      return `${actor} selected an engineer from your pod without a nomination`;
    case "calendar_conflict":
      return "A presales meeting has a calendar conflict to resolve";
    case "confirmed":
      return "Your presales meeting is confirmed";
    case "rescheduled":
      return `${actor} rescheduled a presales meeting. Please confirm the new time`;
    case "released":
      return `${actor} released you from a presales meeting`;
    case "cancelled":
      return `${actor} cancelled a presales meeting`;
    case "outcome_needed":
      return "Record the outcome of your presales meeting";
    case "deadline_missed":
      return "A pod missed its nomination deadline and needs follow-up";
    case "invite_expiring":
      return "Your presales invitation needs a response soon";
    case "invite_overdue":
      return "An invitation passed its response deadline";
    case "meeting_reminder":
      return "Reminder: you have a presales meeting coming up";
    case "availability_review":
      return "Please review your presales availability for the week";
    case "integration_failure":
      return "A presales tracker background job is failing. Check System health";
    case "calendar_reconnect":
      return "Your calendar connection stopped working. Reconnect it so you can be checked for meetings";
    case "pod_leader_assigned":
      return `${actor} made you a leader of your pod for presales nominations`;
    case "role_granted":
      return `${actor} gave you access to the presales tracker`;
    default:
      return `${actor} sent a presales update`;
  }
}

/** Where a presales notification opens: the request when there is one. */
export function presalesNotifHref(
  requestId?: string | null,
  event?: string | null,
): string {
  if (event === "availability_review") return "/tracker/availability";
  if (event === "calendar_reconnect") return "/tracker/settings?tab=calendar";
  // The admin console lives on the main site, not the tracker's address.
  if (event === "integration_failure")
    return `${siteConfig.url}/admin/tracker-readiness`;
  return requestId ? `/tracker/requests/${requestId}` : "/tracker/dashboard";
}
