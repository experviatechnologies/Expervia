/** Capability-passport evidence categories + labels (client-safe, no server deps). */

export type EvidenceCategory =
  | "mentorship"
  | "certification"
  | "project"
  | "assessment"
  | "other";

export const EVIDENCE_CATEGORIES: EvidenceCategory[] = [
  "mentorship",
  "certification",
  "project",
  "assessment",
  "other",
];

export const EVIDENCE_CATEGORY_LABEL: Record<EvidenceCategory, string> = {
  mentorship: "Mentorship",
  certification: "Certification",
  project: "Project",
  assessment: "Assessment",
  other: "Other",
};
