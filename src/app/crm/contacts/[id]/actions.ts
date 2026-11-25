"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCrmSession } from "@/lib/crm/session";
import {
  LEAD_STATUSES,
  LIFECYCLES,
  isUuid,
  listOwners,
  type LeadStatus,
  type Lifecycle,
} from "@/lib/crm/record";
import { LEAD_STATUS_LABEL, LIFECYCLE_LABEL } from "@/lib/crm/labels";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_TAGS = 20;
const MAX_TAG = 40;

const includes = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);

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
