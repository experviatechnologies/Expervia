/**
 * Presales tracker notification events (PRD section 10). A notification row
 * stores the event key in `target_type` and the request id in `target_id`
 * (the same pattern as mentorship notifications); this file turns them into
 * wording. Pure, so any server component that lists notifications can use it.
 */

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
    case "pod_leader_assigned":
      return `${actor} made you a leader of your pod for presales nominations`;
    case "role_granted":
      return `${actor} gave you access to the presales tracker`;
    default:
      return `${actor} sent a presales update`;
  }
}

/** Where a presales notification opens: the request when there is one. */
export function presalesNotifHref(requestId?: string | null): string {
  return requestId ? `/tracker/requests/${requestId}` : "/tracker/dashboard";
}
