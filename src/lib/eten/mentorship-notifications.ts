/**
 * Human wording for a mentorship notification, keyed by the row's `target_type`
 * (which encodes the specific event). Pure — safe to import in server components
 * that render the notification lists. Legacy "circle"/"mentorship_request" rows
 * fall back to the generic text.
 */
export function mentorshipNotifText(
  targetType: string | null,
  actor: string,
): string {
  switch (targetType) {
    case "request_received":
      return `${actor} requested you as a mentor`;
    case "request_accepted":
      return `${actor} accepted your mentorship request`;
    case "request_declined":
      return `${actor} declined your mentorship request`;
    case "booking_requested":
      return `${actor} requested a session time`;
    case "booking_paid":
      return `${actor} booked and paid for a session`;
    case "booking_accepted":
      return `${actor} confirmed your session`;
    case "booking_declined":
      return `${actor} declined your session time`;
    case "circle_enrolled":
      return `${actor} added you to a Circle`;
    case "circle_activated":
      return `${actor} started your Circle`;
    case "circle_class":
      return `${actor} scheduled a live class`;
    case "circle_assignment":
      return `${actor} posted a new assignment`;
    case "circle_reviewed":
      return `${actor} reviewed your submission`;
    case "circle_completed":
      return `${actor} completed your Circle`;
    default:
      return `${actor} sent a mentorship update`;
  }
}

/** True for events that point at a specific Circle (target_id is a circle id). */
export function isCircleEvent(targetType: string | null): boolean {
  return (
    targetType === "circle" ||
    targetType === "booking_accepted" ||
    Boolean(targetType?.startsWith("circle_"))
  );
}
