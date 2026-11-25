import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isUuid, type TimelineEntry } from "@/lib/crm/record";
import { shortDate } from "@/lib/crm/labels";
import {
  PIPELINES,
  formatAmount,
  formatCompact,
  stageOf,
  type PipelineId,
} from "@/lib/crm/pipelines";

/**
 * CRM deals (SQL 68). Money is formatted here, on the server, so client
 * components show the same text the server rendered. Callers must have
 * checked getCrmSession() first (service-role reads).
 */

export type DealRow = {
  id: string;
  name: string;
  pipeline: PipelineId;
  stage: string;
  stageLabel: string;
  amountMinor: number;
  currency: string;
  amountLabel: string;
  closeDate: string | null;
  closeLabel: string | null;
  /** Expected close date has passed and the deal is still open. */
  late: boolean;
  priority: "low" | "medium" | "high";
  product: string | null;
  ownerId: string | null;
  ownerName: string | null;
  contact: { id: string; name: string } | null;
  company: { id: string; name: string } | null;
};

export type DealRecord = DealRow & {
  notes: string | null;
  lostReason: string | null;
  closedAt: string | null;
  createdAt: string;
  timeline: TimelineEntry[];
};

export type PipelineSummary = {
  open: number;
  /** Per currency, so naira and dollars are never added together. */
  openValue: string[];
  weighted: string[];
  wonValue: string[];
  columns: {
    stageId: string;
    label: string;
    probability: number;
    count: number;
    total: string[];
  }[];
};

export class DealsNotReady extends Error {}

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "42P01" || /crm_deals/.test(error.message)) {
    throw new DealsNotReady(error.message);
  }
  throw new Error(error.message);
}

const COLUMNS =
  "id, name, pipeline, stage, amount_minor, currency, close_date, priority, product, owner_id, notes, lost_reason, closed_at, created_at, crm_contacts(id, first_name, last_name), crm_companies(id, name)";

type Raw = {
  id: string;
  name: string;
  pipeline: PipelineId;
  stage: string;
  amount_minor: number;
  currency: string;
  close_date: string | null;
  priority: "low" | "medium" | "high";
  product: string | null;
  owner_id: string | null;
  notes: string | null;
  lost_reason: string | null;
  closed_at: string | null;
  created_at: string;
  crm_contacts:
    | { id: string; first_name: string; last_name: string }
    | { id: string; first_name: string; last_name: string }[]
    | null;
  crm_companies:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
};

const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

async function names(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map<string, string>();
  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("member_id, full_name")
    .in("member_id", unique);
  return new Map(
    (data ?? []).map((p) => [p.member_id as string, p.full_name as string]),
  );
}

function toRow(r: Raw, ownerNames: Map<string, string>): DealRow {
  const stage = stageOf(r.pipeline, r.stage);
  const c = one(r.crm_contacts);
  const co = one(r.crm_companies);
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: r.id,
    name: r.name,
    pipeline: r.pipeline,
    stage: r.stage,
    stageLabel: stage?.label ?? r.stage,
    amountMinor: Number(r.amount_minor),
    currency: r.currency,
    amountLabel: formatAmount(Number(r.amount_minor), r.currency),
    closeDate: r.close_date,
    closeLabel: r.close_date ? shortDate(`${r.close_date}T12:00:00Z`) : null,
    late: stage?.outcome === "open" && !!r.close_date && r.close_date < today,
    priority: r.priority,
    product: r.product,
    ownerId: r.owner_id,
    ownerName: r.owner_id
      ? (ownerNames.get(r.owner_id) ?? "Staff member")
      : null,
    contact: c
      ? { id: c.id, name: `${c.first_name} ${c.last_name}`.trim() || "No name" }
      : null,
    company: co ? { id: co.id, name: co.name } : null,
  };
}

/** Sum per currency, formatted: ["₦4,500,000", "$1,200"]. */
function sums(
  deals: DealRow[],
  weight: (d: DealRow) => number = () => 1,
  compact = false,
) {
  const byCurrency = new Map<string, number>();
  for (const d of deals) {
    byCurrency.set(
      d.currency,
      (byCurrency.get(d.currency) ?? 0) + d.amountMinor * weight(d),
    );
  }
  return [...byCurrency.entries()]
    .filter(([, v]) => v > 0)
    .map(([cur, v]) =>
      compact
        ? formatCompact(Math.round(v), cur)
        : formatAmount(Math.round(v), cur),
    );
}

export async function listDeals(
  pipeline: PipelineId,
): Promise<{ deals: DealRow[]; summary: PipelineSummary }> {
  const { data, error } = await getSupabaseAdmin()
    .from("crm_deals")
    .select(COLUMNS)
    .eq("pipeline", pipeline)
    .order("close_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1000);
  check(error);
  const raw = (data ?? []) as Raw[];
  const ownerNames = await names(raw.map((r) => r.owner_id ?? ""));
  const deals = raw.map((r) => toRow(r, ownerNames));

  const def = PIPELINES[pipeline];
  const open = deals.filter(
    (d) => stageOf(pipeline, d.stage)?.outcome === "open",
  );
  const won = deals.filter(
    (d) => stageOf(pipeline, d.stage)?.outcome === "won",
  );
  return {
    deals,
    summary: {
      open: open.length,
      openValue: sums(open),
      weighted: sums(open, (d) => stageOf(pipeline, d.stage)?.probability ?? 0),
      wonValue: sums(won),
      columns: def.stages.map((s) => {
        const inStage = deals.filter((d) => d.stage === s.id);
        return {
          stageId: s.id,
          label: s.label,
          probability: s.probability,
          count: inStage.length,
          total: sums(inStage, () => 1, true),
        };
      }),
    },
  };
}

/** Deals for a contact or company record (null if SQL 68 isn't run). */
export async function dealsFor(target: {
  kind: "contact" | "company";
  id: string;
}): Promise<DealRow[] | null> {
  if (!isUuid(target.id)) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("crm_deals")
    .select(COLUMNS)
    .eq(target.kind === "contact" ? "contact_id" : "company_id", target.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return null;
  const raw = (data ?? []) as Raw[];
  const ownerNames = await names(raw.map((r) => r.owner_id ?? ""));
  return raw.map((r) => toRow(r, ownerNames));
}

export async function getDeal(id: string): Promise<DealRecord | null> {
  if (!isUuid(id)) return null;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("crm_deals")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  check(error);
  if (!data) return null;
  const r = data as Raw;

  const { data: acts } = await admin
    .from("crm_activities")
    .select(
      "id, type, product, event, subject, body, payload, actor_id, occurred_at",
    )
    .eq("deal_id", id)
    .order("occurred_at", { ascending: false })
    .limit(200);
  const people = await names([
    r.owner_id ?? "",
    ...(acts ?? []).map((a) => a.actor_id ?? ""),
  ]);

  return {
    ...toRow(r, people),
    notes: r.notes,
    lostReason: r.lost_reason,
    closedAt: r.closed_at,
    createdAt: r.created_at,
    timeline: (acts ?? []).map((a) => ({
      id: a.id,
      type: a.type,
      product: a.product,
      event: a.event,
      subject: a.subject,
      body: a.body,
      outcome:
        typeof a.payload?.outcome === "string" ? a.payload.outcome : null,
      actorName: a.actor_id ? (people.get(a.actor_id) ?? "Staff member") : null,
      occurredAt: a.occurred_at,
    })),
  };
}
