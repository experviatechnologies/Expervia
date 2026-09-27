/**
 * The membership ID (members.membership_id, e.g. ETN-000123) is a permanent,
 * stable handle assigned at account creation (migration 26). A member's STAGE is
 * derived from existing state, not stored, so it always reflects reality:
 *
 *   Deactivated / Suspended (account status)
 *   Verified   — identity verification approved
 *   Validated  — completed ETEN onboarding (validated_at set)
 *   Prospect   — self-registered, not yet validated
 */
export type MembershipStage =
  | "Prospect"
  | "Validated"
  | "Verified"
  | "Suspended"
  | "Deactivated";

export function membershipStage(
  status: string,
  validated: boolean,
  identityVerified: boolean,
): MembershipStage {
  if (status === "deactivated") return "Deactivated";
  if (status === "suspended") return "Suspended";
  if (identityVerified) return "Verified";
  if (validated) return "Validated";
  return "Prospect";
}
