/**
 * Profile-completeness scoring for the dashboard nudge (roadmap M1.7).
 *
 * Pure function — no I/O — so it can run on the server (dashboard) or client.
 * Each check is one equal-weighted item; the nudge lists what's still missing
 * and links the member straight to where they can fix it.
 */

export type CompletenessInput = {
  headline: string | null;
  jobTitle: string | null;
  location: string | null;
  bio: string | null;
  industryExperience: string | null;
  availabilityStatus: string | null;
  yearsExperience: number | null;
  primaryPodId: string | null;
  skillCount: number;
  certCount: number;
};

export type CompletenessItem = {
  label: string;
  done: boolean;
  href: string;
};

export type Completeness = {
  percent: number;
  done: number;
  total: number;
  items: CompletenessItem[];
};

const PROFILE = "/profile";
const CERTS = "/profile/certifications";

function filled(v: string | null): boolean {
  return Boolean(v && v.trim());
}

export function computeCompleteness(input: CompletenessInput): Completeness {
  const items: CompletenessItem[] = [
    { label: "Add a headline", done: filled(input.headline), href: PROFILE },
    {
      label: "Add your job title",
      done: filled(input.jobTitle),
      href: PROFILE,
    },
    { label: "Add your location", done: filled(input.location), href: PROFILE },
    { label: "Write a short bio", done: filled(input.bio), href: PROFILE },
    {
      label: "Add your industry experience",
      done: filled(input.industryExperience),
      href: PROFILE,
    },
    {
      label: "Set your availability",
      done: filled(input.availabilityStatus),
      href: PROFILE,
    },
    {
      label: "Add your years of experience",
      done: input.yearsExperience != null,
      href: PROFILE,
    },
    {
      label: "Choose a specialization pod",
      done: Boolean(input.primaryPodId),
      href: PROFILE,
    },
    {
      label: "Add at least one skill",
      done: input.skillCount > 0,
      href: PROFILE,
    },
    {
      label: "Add a certification",
      done: input.certCount > 0,
      href: CERTS,
    },
  ];

  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const percent = Math.round((done / total) * 100);

  return { percent, done, total, items };
}
