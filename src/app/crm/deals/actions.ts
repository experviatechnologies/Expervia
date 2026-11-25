"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCrmSession } from "@/lib/crm/session";
import { isUuid, listOwners } from "@/lib/crm/record";
import {
  CURRENCIES,
  PIPELINES,
  formatAmount,
  isPipeline,
  stageOf,
  type PipelineId,
} from "@/lib/crm/pipelines";

export type DealResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type DealInput = {
  name: string;
  pipeline: PipelineId;
  stage: string;
  /** Whole naira/dollars as typed, e.g. "2,500,000". */
  amount: string;
  currency: string;
  closeDate: string;
  priority: "low" | "medium" | "high";
  product: string;
  notes: string;
  ownerId: string | null;
  contactId: string | null;
  companyId: string | null;
};

const NOT_READY = "Deals aren't set up yet. Run SQL 68 in Supabase first.";
const missingTable = (e: { message: string; code?: string } | null) =>
  Boolean(e && (e.code === "42P01" || /crm_deals/.test(e.message)));

function refresh(d: {
  id?: string;
  contact_id?: string | null;
  company_id?: string | null;
}) {
  revalidatePath("/crm/deals");
  if (d.id) revalidatePath(`/crm/deals/${d.id}`);
  if (d.contact_id) revalidatePath(`/crm/contacts/${d.contact_id}`);
  if (d.company_id) revalidatePath(`/crm/companies/${d.company_id}`);
}

async function clean(
  input: DealInput,
): Promise<{ row: Record<string, unknown> } | { error: string }> {
  const name = (input.name ?? "").trim().replace(/\s+/g, " ");
  if (!name) return { error: "Give the deal a name." };
  if (name.length > 160) return { error: "The deal name is too long." };
  if (!isPipeline(input.pipeline)) return { error: "Choose a pipeline." };
  if (!stageOf(input.pipeline, input.stage))
    return { error: "Choose a stage." };
  if (!(CURRENCIES as readonly string[]).includes(input.currency)) {
    return { error: "Choose naira or dollars." };
  }
  const digits = (input.amount ?? "").replace(/[,\s₦$]/g, "");
  if (digits && !/^\d+(\.\d{1,2})?$/.test(digits)) {
    return { error: "Enter the value as a number, e.g. 2500000." };
  }
  const amountMinor = digits ? Math.round(Number(digits) * 100) : 0;
  if (amountMinor > 9_000_000_000_000_00)
    return { error: "That value is too large." };
  if (input.closeDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.closeDate)) {
    return { error: "Pick a valid close date." };
  }
  if (!["low", "medium", "high"].includes(input.priority)) {
    return { error: "Choose a priority." };
  }
  const product = (input.product ?? "").trim();
  const notes = (input.notes ?? "").trim();
  if (product.length > 120) return { error: "The product name is too long." };
  if (notes.length > 2000) return { error: "The notes are too long." };
  if (input.ownerId) {
    const owners = await listOwners();
    if (!owners.some((o) => o.id === input.ownerId)) {
      return { error: "The owner must be a CRM staff member." };
    }
  }
  return {
    row: {
      name,
      pipeline: input.pipeline,
      stage: input.stage,
      amount_minor: amountMinor,
      currency: input.currency,
      close_date: input.closeDate || null,
      priority: input.priority,
      product: product || null,
      notes: notes || null,
      owner_id: input.ownerId || null,
      contact_id:
        input.contactId && isUuid(input.contactId) ? input.contactId : null,
      company_id:
        input.companyId && isUuid(input.companyId) ? input.companyId : null,
    },
  };
}

/** One timeline line, shown on the deal, its contact and its company. */
async function log(
  deal: { id: string; contact_id: string | null; company_id: string | null },
  event: string,
  subject: string,
  actorId: string,
  body?: string,
) {
  await getSupabaseAdmin()
    .from("crm_activities")
    .insert({
      deal_id: deal.id,
      contact_id: deal.contact_id,
      company_id: deal.company_id,
      type: "stage",
      product: "crm",
      event,
      subject,
      body: body ?? null,
      actor_id: actorId,
    });
}

export async function createDeal(input: DealInput): Promise<DealResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  const cleaned = await clean({
    ...input,
    ownerId: input.ownerId || session.member.id,
  });
  if ("error" in cleaned) return { ok: false, error: cleaned.error };

  const { data, error } = await getSupabaseAdmin()
    .from("crm_deals")
    .insert({ ...cleaned.row, created_by: session.member.id })
    .select(
      "id, contact_id, company_id, name, stage, pipeline, amount_minor, currency",
    )
    .single();
  if (error || !data) {
    return {
      ok: false,
      error: missingTable(error) ? NOT_READY : "Couldn't create the deal.",
    };
  }
  await log(
    data,
    "deal_created",
    `Deal created: ${data.name}`,
    session.member.id,
    `${stageOf(data.pipeline, data.stage)?.label} · ${formatAmount(Number(data.amount_minor), data.currency)}`,
  );
  refresh(data);
  return { ok: true, id: data.id };
}

export async function updateDeal(
  id: string,
  input: DealInput,
): Promise<DealResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  if (!isUuid(id)) return { ok: false, error: "Unknown deal." };
  const { data: current } = await getSupabaseAdmin()
    .from("crm_deals")
    .select("pipeline, stage, amount_minor, currency")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Unknown deal." };
  const before = current;
  const cleaned = await clean({
    ...input,
    pipeline: current.pipeline,
    stage: current.stage,
  });
  if ("error" in cleaned) return { ok: false, error: cleaned.error };

  const admin = getSupabaseAdmin();

  // Stage and pipeline change only through moveDealStage (board and stage
  // bar), so an older form can never undo a move made since it loaded.
  const { stage: _stage, pipeline: _pipeline, ...fields } = cleaned.row;
  void _stage;
  void _pipeline;
  const { data, error } = await admin
    .from("crm_deals")
    .update(fields)
    .eq("id", id)
    .select(
      "id, contact_id, company_id, name, stage, pipeline, amount_minor, currency",
    )
    .single();
  if (error || !data) return { ok: false, error: "Couldn't save the deal." };

  const changes: string[] = [];
  if (
    Number(before.amount_minor) !== Number(data.amount_minor) ||
    before.currency !== data.currency
  ) {
    changes.push(
      `Value: ${formatAmount(Number(before.amount_minor), before.currency)} to ${formatAmount(Number(data.amount_minor), data.currency)}`,
    );
  }
  await log(
    data,
    "deal_updated",
    `Deal updated: ${data.name}`,
    session.member.id,
    changes.join("\n") || "Details changed",
  );
  refresh(data);
  return { ok: true, id };
}

/** Move a deal to another stage of its pipeline (board and stage bar). */
export async function moveDealStage(
  id: string,
  stage: string,
  lostReason?: string,
): Promise<DealResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  if (!isUuid(id)) return { ok: false, error: "Unknown deal." };

  const admin = getSupabaseAdmin();
  const { data: deal } = await admin
    .from("crm_deals")
    .select("id, pipeline, stage, name, contact_id, company_id")
    .eq("id", id)
    .maybeSingle();
  if (!deal) return { ok: false, error: "Unknown deal." };
  const from = stageOf(deal.pipeline, deal.stage);
  const to = stageOf(deal.pipeline, stage);
  if (!to)
    return {
      ok: false,
      error: `That isn't a stage in ${PIPELINES[deal.pipeline as PipelineId].label}.`,
    };
  if (deal.stage === stage) return { ok: true, id };

  const reason = (lostReason ?? "").trim().slice(0, 300);
  const { error } = await admin
    .from("crm_deals")
    .update({
      stage,
      ...(to.outcome === "lost" && reason ? { lost_reason: reason } : {}),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Couldn't move the deal." };

  await log(
    deal,
    to.outcome === "won"
      ? "deal_won"
      : to.outcome === "lost"
        ? "deal_lost"
        : "deal_stage_changed",
    to.outcome === "won"
      ? `Deal won: ${deal.name}`
      : to.outcome === "lost"
        ? `Deal lost: ${deal.name}`
        : `Deal moved: ${deal.name}`,
    session.member.id,
    `${from?.label ?? deal.stage} to ${to.label}${to.outcome === "lost" && reason ? `\nReason: ${reason}` : ""}`,
  );
  refresh(deal);
  return { ok: true, id };
}
