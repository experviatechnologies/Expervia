/** Human labels for the action codes written by writeAudit() (see audit.ts). */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "member.status.active": "Reactivated a member",
  "member.status.suspended": "Suspended a member",
  "member.status.deactivated": "Deactivated a member",
  "member.v_level": "Changed a member's V-level",
  "member.invite_resent": "Re-sent a migration invite",
  "member.evidence_added": "Added a capability evidence record",
  "member.recognition_awarded": "Awarded recognition (badge / score)",
  "mentor.nominated": "Nominated a Mentor Candidate",
  "mentor.verified": "Verified a mentor",
  "mentor.rejected": "Rejected a mentor nomination",
  "circle.created": "Created a Mentorship Circle",
  "circle.activated": "Activated a Mentorship Circle",
  "circle.evidence_approved": "Approved Circle evidence",
  "circle.evidence_revision": "Requested revision on Circle evidence",
  "circle.completed": "Completed a Mentorship Circle",
  "cert.verified": "Verified a certification",
  "cert.rejected": "Rejected a certification",
  "cert.unverified": "Reset a certification to pending",
  "report.actioned": "Actioned a report",
  "report.dismissed": "Dismissed a report",
  "post.removed": "Removed a post",
  "comment.removed": "Removed a comment",
  "identity.verified": "Verified an identity document",
  "identity.rejected": "Rejected an identity document",
  "identity.unverified": "Reset an identity to pending",
  "address.verified": "Verified a proof of address",
  "address.rejected": "Rejected a proof of address",
  "address.unverified": "Reset an address to pending",
};

/** Friendly label for an audit action code, with a readable fallback. */
export function auditLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action.replace(/[._]/g, " ");
}

/** Semantic tone for an action, used to colour activity-feed markers. */
export function auditTone(action: string): "good" | "warn" | "danger" | "info" {
  if (action.endsWith(".verified") || action === "member.status.active")
    return "good";
  if (
    action.endsWith(".removed") ||
    action.endsWith(".rejected") ||
    action === "member.status.suspended" ||
    action === "member.status.deactivated"
  )
    return "danger";
  if (action.startsWith("report.")) return "warn";
  return "info";
}
