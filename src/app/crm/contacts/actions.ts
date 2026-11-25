"use server";

import { getCrmSession } from "@/lib/crm/session";
import {
  listAllContacts,
  parseContactFilters,
  type ContactRow,
} from "@/lib/crm/contacts";
import {
  ACCOUNT_LABEL,
  AUDIENCE_LABEL,
  COMMUNITY_LABEL,
} from "@/lib/crm/labels";
import { isUuid } from "@/lib/crm/record";
import { toCsv } from "@/lib/csv";
import { getSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";

type CsvResult = { csv: string } | { error: string };

function contactsCsv(rows: ContactRow[]): string {
  return toCsv(
    [
      "First name",
      "Last name",
      "Email",
      "Phone",
      "Audience",
      "Account",
      "Company",
      "Source",
      "Communities",
      "Tags",
      "City",
      "Country",
      "First seen",
      "Last activity",
    ],
    rows.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.phone,
      AUDIENCE_LABEL[r.audience],
      ACCOUNT_LABEL[r.account],
      r.company,
      r.source,
      r.communities.map((c) => COMMUNITY_LABEL[c] ?? c).join("; "),
      r.tags.join("; "),
      r.city,
      r.country,
      r.firstSeenAt.slice(0, 10),
      r.lastActivityAt?.slice(0, 10) ?? "",
    ]),
  );
}

/**
 * CSV of every contact matching the current filters (not just the page on
 * screen). Staff only. Exports hold personal data, so each one is written to
 * the audit log with the filters used and the row count.
 */
export async function exportContactsCsv(
  params: Record<string, string>,
): Promise<CsvResult> {
  const session = await getCrmSession();
  if (!session) return { error: "You don't have access to the CRM." };

  const filters = parseContactFilters(params);
  try {
    const rows = await listAllContacts(filters);
    await writeAudit({
      actorId: session.member.id,
      action: "crm.contacts_exported",
      targetType: "crm_contacts",
      targetId: null,
      metadata: { filters, rows: rows.length },
    });
    return { csv: contactsCsv(rows) };
  } catch {
    return { error: "Couldn't build the export. Please try again." };
  }
}

/** CSV of everyone on a list (smart or fixed). Audited like any export. */
export async function exportListCsv(listId: string): Promise<CsvResult> {
  const session = await getCrmSession();
  if (!session) return { error: "You don't have access to the CRM." };
  if (!isUuid(listId)) return { error: "Unknown list." };

  const { data: list } = await getSupabaseAdmin()
    .from("crm_lists")
    .select("name, kind, filters")
    .eq("id", listId)
    .maybeSingle();
  if (!list) return { error: "Unknown list." };

  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(list.filters ?? {})) {
    if (typeof v === "string") params[k] = v;
  }
  const filters =
    list.kind === "smart"
      ? parseContactFilters(params)
      : { ...parseContactFilters({}), listId };
  try {
    const rows = await listAllContacts(filters);
    await writeAudit({
      actorId: session.member.id,
      action: "crm.contacts_exported",
      targetType: "crm_lists",
      targetId: listId,
      metadata: { list: list.name, rows: rows.length },
    });
    return { csv: contactsCsv(rows) };
  } catch {
    return { error: "Couldn't build the export. Please try again." };
  }
}
