/** Recognition catalog + summariser (client-safe, no server deps). */

export type RecognitionKind = "badge" | "score_credit";

export type BadgeDef = { key: string; label: string; description: string };

/** Badge catalog. M4 awards these automatically; ops can award manually. */
export const BADGES: BadgeDef[] = [
  {
    key: "verified_mentor",
    label: "Verified Mentor",
    description: "Approved by the Verification Desk to mentor a Circle.",
  },
  {
    key: "circle_mentor",
    label: "Circle Mentor",
    description: "Ran a Mentorship Circle to completion.",
  },
  {
    key: "circle_graduate",
    label: "Circle Graduate",
    description: "Completed a Mentorship Circle as a mentee.",
  },
  {
    key: "first_evidence",
    label: "First Evidence",
    description: "Earned a first verified capability-evidence record.",
  },
];

export const BADGE_BY_KEY: Record<string, BadgeDef> = Object.fromEntries(
  BADGES.map((b) => [b.key, b]),
);

/** Default Expert Score credit amounts (tunable; wired to triggers in M4). */
export const SCORE_CREDITS = {
  evidence_approved: 10,
  circle_completed_mentee: 50,
  became_verified_mentor: 25,
  circle_completed_mentor: 75,
} as const;

export type RecognitionRow = {
  kind: RecognitionKind;
  badge_key: string | null;
  points: number | null;
  label: string;
  created_at: string;
};

/** Expert Score (summed credits) + earned badges from a member's events. */
export function summarizeRecognition(rows: RecognitionRow[]): {
  score: number;
  badges: BadgeDef[];
} {
  let score = 0;
  const keys = new Set<string>();
  for (const r of rows) {
    if (r.kind === "score_credit") score += r.points ?? 0;
    else if (r.badge_key) keys.add(r.badge_key);
  }
  const badges = [...keys]
    .map((k) => BADGE_BY_KEY[k])
    .filter((b): b is BadgeDef => Boolean(b));
  return { score, badges };
}
