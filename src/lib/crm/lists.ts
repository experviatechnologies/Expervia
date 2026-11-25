import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  NO_FILTERS,
  countContacts,
  parseContactFilters,
  type ContactFilters,
} from "@/lib/crm/contacts";
import { ACCOUNT_LABEL, LEAD_STATUS_LABEL, VIEW_LABEL } from "@/lib/crm/labels";
import { isUuid, listOwners, type Owner } from "@/lib/crm/record";

/**
 * CRM lists (SQL 66). A smart list stores contacts-list filters and its
 * members are worked out live; a fixed list holds hand-picked people.
 * Callers must have checked getCrmSession() first (service-role reads).
 */

export type ListKind = "smart" | "fixed";

export type CrmList = {
  id: string;
  name: string;
  description: string | null;
  kind: ListKind;
  /** Smart lists: the saved filters, parsed and safe. */
  filters: ContactFilters;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  /** Members right now (null if the count failed). */
  size: number | null;
};

type Raw = {
  id: string;
  name: string;
  description: string | null;
  kind: ListKind;
  filters: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Stored JSON back into safe filters (never trusted as-is). */
export function filtersFromJson(json: Record<string, unknown> | null) {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(json ?? {})) {
    if (typeof v === "string") params[k] = v;
  }
  return parseContactFilters(params);
}

/** Missing table (SQL 66 not run yet) shows as a setup message, not a crash. */
export class ListsNotReady extends Error {}

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "42P01" || /crm_list/.test(error.message)) {
    throw new ListsNotReady(error.message);
  }
  throw new Error(error.message);
}

async function sizeOf(list: Raw): Promise<number | null> {
  if (list.kind === "smart") {
    return countContacts({ ...filtersFromJson(list.filters), sort: "newest" });
  }
  const { count, error } = await getSupabaseAdmin()
    .from("crm_list_members")
    .select("contact_id", { count: "exact", head: true })
    .eq("list_id", list.id);
  return error ? null : (count ?? 0);
}

const toList = async (r: Raw): Promise<CrmList> => ({
  id: r.id,
  name: r.name,
  description: r.description,
  kind: r.kind,
  filters: r.kind === "smart" ? filtersFromJson(r.filters) : NO_FILTERS,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  size: await sizeOf(r),
});

const COLUMNS =
  "id, name, description, kind, filters, created_by, created_at, updated_at";

export async function listLists(): Promise<CrmList[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("crm_lists")
    .select(COLUMNS)
    .order("name")
    .limit(500);
  check(error);
  return Promise.all(((data ?? []) as Raw[]).map(toList));
}

export async function getList(id: string): Promise<CrmList | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("crm_lists")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  check(error);
  return data ? toList(data as Raw) : null;
}

/** Fixed lists, and which of them this contact is on. */
export async function fixedListsFor(contactId: string): Promise<{
  all: { id: string; name: string }[];
  memberOf: string[];
} | null> {
  const admin = getSupabaseAdmin();
  const [lists, memberships] = await Promise.all([
    admin
      .from("crm_lists")
      .select("id, name")
      .eq("kind", "fixed")
      .order("name"),
    admin
      .from("crm_list_members")
      .select("list_id")
      .eq("contact_id", contactId),
  ]);
  if (lists.error || memberships.error) return null; // SQL 66 not run yet
  return {
    all: (lists.data ?? []) as { id: string; name: string }[],
    memberOf: (memberships.data ?? []).map((m) => m.list_id as string),
  };
}

/** Distinct sources and tags, for the smart list builder. */
export async function filterOptions(): Promise<{
  sources: string[];
  tags: string[];
  owners: Owner[];
}> {
  const admin = getSupabaseAdmin();
  const sources = new Set<string>();
  const tags = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("crm_contacts")
      .select("source, tags")
      .order("id")
      .range(from, from + 999);
    if (error) break;
    for (const r of data ?? []) {
      if (r.source) sources.add(r.source);
      for (const t of r.tags ?? []) tags.add(t);
    }
    if (!data || data.length < 1000) break;
  }
  const sort = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b));
  return {
    sources: sort(sources),
    tags: sort(tags),
    owners: await listOwners(),
  };
}

/** Plain-language summary of a smart list's filters. */
export function describeFilters(f: ContactFilters, owners: Owner[]): string[] {
  const parts: string[] = [];
  if (f.view !== "all") parts.push(VIEW_LABEL[f.view]);
  if (f.account !== "any") parts.push(ACCOUNT_LABEL[f.account]);
  if (f.gender !== "any") parts.push(f.gender === "female" ? "Women" : "Men");
  if (f.leadStatus !== "any") {
    parts.push(`Lead status: ${LEAD_STATUS_LABEL[f.leadStatus]}`);
  }
  if (f.source) parts.push(`Source: ${f.source}`);
  if (f.tag) parts.push(`Tag: ${f.tag}`);
  if (f.owner === "none") parts.push("No owner");
  else if (f.owner) {
    parts.push(
      `Owner: ${owners.find((o) => o.id === f.owner)?.name ?? "a former staff member"}`,
    );
  }
  if (f.q) parts.push(`Matching “${f.q}”`);
  return parts.length ? parts : ["Everyone in the CRM"];
}
