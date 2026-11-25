"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCrmSession } from "@/lib/crm/session";
import { isUuid } from "@/lib/crm/record";
import { writeAudit } from "@/lib/eten/audit";

export type ReviewResult = { ok: true } | { ok: false; error: string };

function refresh(...contactIds: string[]) {
  revalidatePath("/crm/review");
  revalidatePath("/crm/contacts");
  revalidatePath("/crm");
  for (const id of contactIds) revalidatePath(`/crm/contacts/${id}`);
}

/** Load a flagged contact and the account its phone matched. */
async function loadFlagged(contactId: string) {
  const { data } = await getSupabaseAdmin()
    .from("crm_contacts")
    .select("id, member_id, review_reason, eten, email")
    .eq("id", contactId)
    .maybeSingle();
  if (!data || !data.review_reason) return null;
  const suggested =
    typeof data.eten?.suggested_member_id === "string"
      ? (data.eten.suggested_member_id as string)
      : null;
  return { ...data, suggested };
}

/**
 * Same person: merge the lead into the existing member's contact (SQL 65,
 * one transaction). If that member somehow has no contact yet, the lead is
 * simply linked to the account instead.
 */
export async function confirmSamePerson(
  contactId: string,
): Promise<ReviewResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  if (!isUuid(contactId)) return { ok: false, error: "Unknown contact." };

  const lead = await loadFlagged(contactId);
  if (!lead)
    return { ok: false, error: "This contact no longer needs review." };
  if (!lead.suggested) {
    return { ok: false, error: "There is no matching account to merge with." };
  }

  const admin = getSupabaseAdmin();
  const { data: target } = await admin
    .from("crm_contacts")
    .select("id")
    .eq("member_id", lead.suggested)
    .maybeSingle();

  if (target) {
    const { error } = await admin.rpc("crm_merge_contacts", {
      p_source: lead.id,
      p_target: target.id,
      p_actor: session.member.id,
    });
    if (error) {
      return {
        ok: false,
        error: error.message.includes("crm_merge_contacts")
          ? "The merge isn't set up yet. Run SQL 65 in Supabase first."
          : "Couldn't merge these records. Please try again.",
      };
    }
    await writeAudit({
      actorId: session.member.id,
      action: "crm.contacts_merged",
      targetType: "crm_contacts",
      targetId: target.id,
      metadata: { mergedContactId: lead.id, reason: lead.review_reason },
    });
    refresh(target.id);
    return { ok: true };
  }

  // No contact for that member: link the lead to the account directly.
  const eten = { ...(lead.eten ?? {}) };
  delete eten.suggested_member_id;
  const { error } = await admin
    .from("crm_contacts")
    .update({ member_id: lead.suggested, review_reason: null, eten })
    .eq("id", lead.id);
  if (error) return { ok: false, error: "Couldn't link the account." };
  await admin.from("crm_activities").insert({
    contact_id: lead.id,
    type: "system",
    product: "crm",
    event: "review_linked",
    subject: "Confirmed as an existing member",
    body: "Staff confirmed this is the same person as an existing account.",
    actor_id: session.member.id,
  });
  await writeAudit({
    actorId: session.member.id,
    action: "crm.review_linked",
    targetType: "crm_contacts",
    targetId: lead.id,
    metadata: { memberId: lead.suggested },
  });
  refresh(lead.id);
  return { ok: true };
}

/** Different people: clear the flag and keep both records. */
export async function markDifferentPeople(
  contactId: string,
): Promise<ReviewResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  if (!isUuid(contactId)) return { ok: false, error: "Unknown contact." };

  const lead = await loadFlagged(contactId);
  if (!lead)
    return { ok: false, error: "This contact no longer needs review." };

  const admin = getSupabaseAdmin();
  const eten = { ...(lead.eten ?? {}) };
  delete eten.suggested_member_id;
  const { error } = await admin
    .from("crm_contacts")
    .update({ review_reason: null, eten })
    .eq("id", lead.id);
  if (error) return { ok: false, error: "Couldn't save. Please try again." };

  await admin.from("crm_activities").insert({
    contact_id: lead.id,
    type: "system",
    product: "crm",
    event: "review_dismissed",
    subject: "Review cleared",
    body: "Staff confirmed this is a different person from the account that shares the phone number.",
    payload: { checked_member_id: lead.suggested },
    actor_id: session.member.id,
  });
  await writeAudit({
    actorId: session.member.id,
    action: "crm.review_dismissed",
    targetType: "crm_contacts",
    targetId: lead.id,
    metadata: { checkedMemberId: lead.suggested },
  });
  refresh(lead.id);
  return { ok: true };
}
