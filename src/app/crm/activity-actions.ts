"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCrmSession } from "@/lib/crm/session";
import { LOGGABLE_TYPES, isUuid, type LoggableType } from "@/lib/crm/record";

export type ActivityTarget = { kind: "contact" | "company"; id: string };
export type LogResult = { ok: true } | { ok: false; error: string };

const MAX_BODY = 5000;
const MAX_SUBJECT = 200;

const includes = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);

/** Log a note, call, meeting or email on a contact's or company's timeline. */
export async function logActivity(input: {
  target: ActivityTarget;
  type: LoggableType;
  subject?: string;
  body: string;
  outcome?: string;
  occurredAt?: string;
}): Promise<LogResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };

  const { target } = input;
  if (
    !target ||
    (target.kind !== "contact" && target.kind !== "company") ||
    !isUuid(target.id)
  ) {
    return { ok: false, error: "Unknown record." };
  }
  if (!includes(LOGGABLE_TYPES, input.type)) {
    return { ok: false, error: "Choose what you are logging." };
  }
  const body = (input.body ?? "").trim();
  const subject = (input.subject ?? "").trim();
  const outcome = (input.outcome ?? "").trim();
  if (!body)
    return { ok: false, error: "Add a few words about what happened." };
  if (body.length > MAX_BODY) {
    return { ok: false, error: `Keep it under ${MAX_BODY} characters.` };
  }
  if (subject.length > MAX_SUBJECT) {
    return { ok: false, error: "The title is too long." };
  }

  let occurredAt = new Date();
  if (input.occurredAt) {
    const d = new Date(input.occurredAt);
    // Allow back-dating (logging yesterday's call) but not the future.
    if (Number.isNaN(d.getTime()) || d.getTime() > Date.now() + 5 * 60_000) {
      return {
        ok: false,
        error: "Pick a date and time that isn't in the future.",
      };
    }
    occurredAt = d;
  }

  const { error } = await getSupabaseAdmin()
    .from("crm_activities")
    .insert({
      contact_id: target.kind === "contact" ? target.id : null,
      company_id: target.kind === "company" ? target.id : null,
      type: input.type,
      product: "crm",
      event: `${input.type}_logged`,
      subject: subject || null,
      body,
      payload: outcome ? { outcome: outcome.slice(0, 100) } : {},
      actor_id: session.member.id,
      occurred_at: occurredAt.toISOString(),
    });
  if (error) {
    return { ok: false, error: "Couldn't save it. Please try again." };
  }
  revalidatePath(
    target.kind === "contact"
      ? `/crm/contacts/${target.id}`
      : `/crm/companies/${target.id}`,
  );
  revalidatePath("/crm");
  return { ok: true };
}
