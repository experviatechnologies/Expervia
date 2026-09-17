/** Human labels for the action codes written by writeAudit() (see audit.ts). */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "member.status.active": "Reactivated a member",
  "member.status.suspended": "Suspended a member",
  "member.status.deactivated": "Deactivated a member",
  "cert.verified": "Verified a certification",
  "cert.rejected": "Rejected a certification",
  "cert.unverified": "Reset a certification to pending",
  "report.actioned": "Actioned a report",
  "report.dismissed": "Dismissed a report",
  "post.removed": "Removed a post",
  "comment.removed": "Removed a comment",
};

/** Friendly label for an audit action code, with a readable fallback. */
export function auditLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action.replace(/[._]/g, " ");
}

/** Semantic tone for an action, used to colour activity-feed markers. */
export function auditTone(action: string): "good" | "warn" | "danger" | "info" {
  if (action === "cert.verified" || action === "member.status.active")
    return "good";
  if (
    action.endsWith(".removed") ||
    action === "cert.rejected" ||
    action === "member.status.suspended" ||
    action === "member.status.deactivated"
  )
    return "danger";
  if (action.startsWith("report.")) return "warn";
  return "info";
}
