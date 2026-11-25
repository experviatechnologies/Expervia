"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCrmSession } from "@/lib/crm/session";
import {
  SAVED_FILTER_KEYS,
  countContacts,
  filtersToParams,
  parseContactFilters,
} from "@/lib/crm/contacts";
import { isUuid } from "@/lib/crm/record";
import { writeAudit } from "@/lib/eten/audit";

export type ListResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const NOT_READY = "Lists aren't set up yet. Run SQL 66 in Supabase first.";
const isMissingTable = (e: { message: string; code?: string } | null) =>
  Boolean(e && (e.code === "42P01" || /crm_list/.test(e.message)));

function cleanText(v: unknown, max: number) {
  return typeof v === "string"
    ? v.trim().replace(/\s+/g, " ").slice(0, max)
    : "";
}

/** Only known filter keys with safe values are ever stored. */
function cleanFilters(params: Record<string, string>) {
  return filtersToParams(parseContactFilters(params ?? {}), SAVED_FILTER_KEYS);
}

async function nameTaken(name: string, exceptId?: string) {
  let q = getSupabaseAdmin()
    .from("crm_lists")
    .select("id")
    .ilike(
      "name",
      name.replace(/[%_\\]/g, (m) => `\\${m}`),
    );
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q.limit(1);
  return (data ?? []).length > 0;
}

export async function createList(input: {
  name: string;
  description?: string;
  kind: "smart" | "fixed";
  /** Smart lists: contacts-list URL params to save. */
  filters?: Record<string, string>;
}): Promise<ListResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  const name = cleanText(input.name, 120);
  const description = cleanText(input.description, 500);
  if (!name) return { ok: false, error: "Give the list a name." };
  if (input.kind !== "smart" && input.kind !== "fixed") {
    return { ok: false, error: "Choose a list type." };
  }
  if (await nameTaken(name)) {
    return { ok: false, error: "A list with this name already exists." };
  }

  const { data, error } = await getSupabaseAdmin()
    .from("crm_lists")
    .insert({
      name,
      description: description || null,
      kind: input.kind,
      filters: input.kind === "smart" ? cleanFilters(input.filters ?? {}) : {},
      created_by: session.member.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    return {
      ok: false,
      error: isMissingTable(error) ? NOT_READY : "Couldn't create the list.",
    };
  }
  await writeAudit({
    actorId: session.member.id,
    action: "crm.list_created",
    targetType: "crm_lists",
    targetId: data.id,
    metadata: { name, kind: input.kind },
  });
  revalidatePath("/crm/lists");
  return { ok: true, id: data.id };
}

export async function updateList(
  id: string,
  input: {
    name: string;
    description?: string;
    filters?: Record<string, string>;
  },
): Promise<ListResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  if (!isUuid(id)) return { ok: false, error: "Unknown list." };
  const name = cleanText(input.name, 120);
  const description = cleanText(input.description, 500);
  if (!name) return { ok: false, error: "Give the list a name." };

  const admin = getSupabaseAdmin();
  const { data: list } = await admin
    .from("crm_lists")
    .select("kind")
    .eq("id", id)
    .maybeSingle();
  if (!list) return { ok: false, error: "Unknown list." };
  if (await nameTaken(name, id)) {
    return { ok: false, error: "A list with this name already exists." };
  }
  const { error } = await admin
    .from("crm_lists")
    .update({
      name,
      description: description || null,
      ...(list.kind === "smart" && input.filters
        ? { filters: cleanFilters(input.filters) }
        : {}),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Couldn't save the list." };
  revalidatePath(`/crm/lists/${id}`);
  revalidatePath("/crm/lists");
  return { ok: true, id };
}

export async function deleteList(id: string): Promise<ListResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  if (!isUuid(id)) return { ok: false, error: "Unknown list." };
  const admin = getSupabaseAdmin();
  const { data: list } = await admin
    .from("crm_lists")
    .select("name, kind")
    .eq("id", id)
    .maybeSingle();
  if (!list) return { ok: false, error: "Unknown list." };
  const { error } = await admin.from("crm_lists").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete the list." };
  await writeAudit({
    actorId: session.member.id,
    action: "crm.list_deleted",
    targetType: "crm_lists",
    targetId: id,
    metadata: { name: list.name, kind: list.kind },
  });
  revalidatePath("/crm/lists");
  return { ok: true, id };
}

/** Add someone to, or take them off, a fixed list. */
export async function setListMembership(input: {
  listId: string;
  contactId: string;
  member: boolean;
}): Promise<ListResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  if (!isUuid(input.listId) || !isUuid(input.contactId)) {
    return { ok: false, error: "Unknown list or contact." };
  }
  const admin = getSupabaseAdmin();
  const { data: list } = await admin
    .from("crm_lists")
    .select("name, kind")
    .eq("id", input.listId)
    .maybeSingle();
  if (!list) return { ok: false, error: "Unknown list." };
  if (list.kind !== "fixed") {
    return {
      ok: false,
      error: "People join a smart list automatically when they match it.",
    };
  }

  const { error } = input.member
    ? await admin.from("crm_list_members").upsert(
        {
          list_id: input.listId,
          contact_id: input.contactId,
          added_by: session.member.id,
        },
        { onConflict: "list_id,contact_id", ignoreDuplicates: true },
      )
    : await admin
        .from("crm_list_members")
        .delete()
        .eq("list_id", input.listId)
        .eq("contact_id", input.contactId);
  if (error) return { ok: false, error: "Couldn't update the list." };

  await admin.from("crm_activities").insert({
    contact_id: input.contactId,
    type: "system",
    product: "crm",
    event: input.member ? "list_added" : "list_removed",
    subject: input.member
      ? `Added to the list “${list.name}”`
      : `Removed from the list “${list.name}”`,
    payload: { list_id: input.listId },
    actor_id: session.member.id,
  });
  revalidatePath(`/crm/lists/${input.listId}`);
  revalidatePath(`/crm/contacts/${input.contactId}`);
  revalidatePath("/crm/lists");
  return { ok: true, id: input.listId };
}

/** How many contacts a set of filters matches (live preview in the builder). */
export async function previewCount(
  params: Record<string, string>,
): Promise<number | null> {
  const session = await getCrmSession();
  if (!session) return null;
  return countContacts(parseContactFilters(params ?? {}));
}
