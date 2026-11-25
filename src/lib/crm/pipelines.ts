/**
 * Deal pipelines and their stages. Client-safe. Must match the stage check in
 * supabase/eten/68_crm_deals.sql. Probability is the chance of winning at
 * that stage, used for the weighted pipeline value.
 */

export type PipelineId = "sales" | "eten";
export type StageOutcome = "open" | "won" | "lost";
export type Stage = {
  id: string;
  label: string;
  probability: number;
  outcome: StageOutcome;
};
export type Pipeline = { id: PipelineId; label: string; stages: Stage[] };

export const PIPELINES: Record<PipelineId, Pipeline> = {
  sales: {
    id: "sales",
    label: "Expervia Sales",
    stages: [
      {
        id: "qualified",
        label: "Qualified",
        probability: 0.1,
        outcome: "open",
      },
      {
        id: "discovery",
        label: "Discovery call",
        probability: 0.2,
        outcome: "open",
      },
      {
        id: "proposal",
        label: "Proposal sent",
        probability: 0.4,
        outcome: "open",
      },
      {
        id: "negotiation",
        label: "Negotiation",
        probability: 0.7,
        outcome: "open",
      },
      { id: "won", label: "Closed won", probability: 1, outcome: "won" },
      { id: "lost", label: "Closed lost", probability: 0, outcome: "lost" },
    ],
  },
  eten: {
    id: "eten",
    label: "ETEN Partnerships",
    stages: [
      { id: "prospect", label: "Prospect", probability: 0.1, outcome: "open" },
      { id: "pitched", label: "Pitched", probability: 0.3, outcome: "open" },
      {
        id: "agreed",
        label: "Terms agreed",
        probability: 0.7,
        outcome: "open",
      },
      { id: "won", label: "Signed", probability: 1, outcome: "won" },
      { id: "lost", label: "Declined", probability: 0, outcome: "lost" },
    ],
  },
};

export const PIPELINE_IDS = Object.keys(PIPELINES) as PipelineId[];
export const CURRENCIES = ["NGN", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const isPipeline = (v: unknown): v is PipelineId =>
  typeof v === "string" && v in PIPELINES;

export function stageOf(pipeline: PipelineId, stageId: string): Stage | null {
  return PIPELINES[pipeline].stages.find((s) => s.id === stageId) ?? null;
}

// Naira in Nigerian style; dollars as "$1,200" rather than "US$1,200".
const localeFor = (currency: string) =>
  currency === "NGN" ? "en-NG" : "en-US";

/** Whole units of money from minor units, e.g. "₦2,500,000". */
export function formatAmount(minor: number, currency: string): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(localeFor(currency), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(major);
  } catch {
    return `${currency} ${Math.round(major).toLocaleString("en-GB")}`;
  }
}

/** Short form for board totals, e.g. "₦2.5M". */
export function formatCompact(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat(localeFor(currency), {
      style: "currency",
      currency,
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(minor / 100);
  } catch {
    return formatAmount(minor, currency);
  }
}
