/**
 * ETEN readiness model (V0–V5) — the capability scale the Mentorship module
 * builds on. Source: Mentorship & Capability Accelerator Framework, Section 3.
 * Stored as members.v_level (smallint 0–5), set by operations only.
 */

export type VLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const V_LEVELS: { level: VLevel; label: string }[] = [
  { level: 0, label: "Registered" },
  { level: 1, label: "Credential Verified" },
  { level: 2, label: "Capability Verified" },
  { level: 3, label: "Commercially Ready" },
  { level: 4, label: "Proven Specialist" },
  { level: 5, label: "Lead Specialist" },
];

export function vLevelLabel(level: number): string {
  return V_LEVELS.find((v) => v.level === level)?.label ?? "Registered";
}

/** Short badge text, e.g. "V2 · Capability Verified". */
export function vLevelBadge(level: number): string {
  return `V${level} · ${vLevelLabel(level)}`;
}
