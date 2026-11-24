"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCrmSession } from "@/lib/crm/session";
import {
  LEAD_STATUSES,
  LIFECYCLES,
  LOGGABLE_TYPES,
  isUuid,
  listOwners,
  type LeadStatus,
  type Lifecycle,
  type LoggableType,
} from "@/lib/crm/record";
import { LEAD_STATUS_LABEL, LIFECYCLE_LABEL } from "@/lib/crm/labels";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_BODY = 5000;
const MAX_SUBJECT = 200;
const MAX_TAGS = 20;
const MAX_TAG = 40;

const includes = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);

/** Log a note, call, meeting or email on a contact's timeline. */
export async function logActivity(input: {
  contactId: string;
  type: LoggableType;
  subject?: string;
  body: string;
  outcome?: string;
  occurredAt?: string;
}): Promise<ActionResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };

  if (!isUuid(input.contactId)) return { ok: false, error: "Unknown contact." };
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
      contact_id: input.contactId,
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
  revalidatePath(`/crm/contacts/${input.contactId}`);
  return { ok: true };
}

/** Change lead status, lifecycle stage, owner or tags. */
export async function updateContact(input: {
  contactId: string;
  leadStatus: LeadStatus;
  lifecycle: Lifecycle;
  ownerId: string | null;
  tags: string[];
}): Promise<ActionResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  if (!isUuid(input.contactId)) return { ok: false, error: "Unknown contact." };
  if (!includes(LEAD_STATUSES, input.leadStatus)) {
    return { ok: false, error: "Choose a lead status." };
  }
  if (!includes(LIFECYCLES, input.lifecycle)) {
    return { ok: false, error: "Choose a lifecycle stage." };
  }

  const owners = await listOwners();
  if (input.ownerId && !owners.some((o) => o.id === input.ownerId)) {
    return { ok: false, error: "The owner must be a CRM staff member." };
  }

  const tags = [
    ...new Set(
      (Array.isArray(input.tags) ? input.tags : [])
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  ];
  if (tags.length > MAX_TAGS) {
    return { ok: false, error: `Use at most ${MAX_TAGS} tags.` };
  }
  if (tags.some((t) => t.length > MAX_TAG)) {
    return { ok: false, error: `Keep each tag under ${MAX_TAG} characters.` };
  }

  const admin = getSupabaseAdmin();
  const { data: before } = await admin
    .from("crm_contacts")
    .select("lead_status, lifecycle, owner_id, tags")
    .eq("id", input.contactId)
    .maybeSingle();
  if (!before) return { ok: false, error: "Unknown contact." };

  // Describe what changed, for the timeline.
  const ownerName = (id: string | null) =>
    id ? (owners.find((o) => o.id === id)?.name ?? "a staff member") : "nobody";
  const changes: string[] = [];
  if (before.lead_status !== input.leadStatus) {
    changes.push(
      `Lead status: ${LEAD_STATUS_LABEL[before.lead_status as LeadStatus]} to ${LEAD_STATUS_LABEL[input.leadStatus]}`,
    );
  }
  if (before.lifecycle !== input.lifecycle) {
    changes.push(
      `Lifecycle stage: ${LIFECYCLE_LABEL[before.lifecycle as Lifecycle]} to ${LIFECYCLE_LABEL[input.lifecycle]}`,
    );
  }
  if ((before.owner_id ?? null) !== (input.ownerId ?? null)) {
    changes.push(
      `Owner: ${ownerName(before.owner_id)} to ${ownerName(input.ownerId)}`,
    );
  }
  const oldTags = new Set<string>(before.tags ?? []);
  const added = tags.filter((t) => !oldTags.has(t));
  const removed = [...oldTags].filter((t) => !tags.includes(t));
  if (added.length) changes.push(`Tags added: ${added.join(", ")}`);
  if (removed.length) changes.push(`Tags removed: ${removed.join(", ")}`);
  if (changes.length === 0) return { ok: true };

  const { error } = await admin
    .from("crm_contacts")
    .update({
      lead_status: input.leadStatus,
      lifecycle: input.lifecycle,
      owner_id: input.ownerId,
      tags,
    })
    .eq("id", input.contactId);
  if (error) return { ok: false, error: "Couldn't save. Please try again." };

  await admin.from("crm_activities").insert({
    contact_id: input.contactId,
    type: "stage",
    product: "crm",
    event: "contact_updated",
    subject: "Contact updated",
    body: changes.join("\n"),
    actor_id: session.member.id,
  });

  revalidatePath(`/crm/contacts/${input.contactId}`);
  revalidatePath("/crm/contacts");
  return { ok: true };
}
