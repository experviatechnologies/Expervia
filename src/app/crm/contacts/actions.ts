"use server";

import { getCrmSession } from "@/lib/crm/session";
import { listAllContacts, parseContactFilters } from "@/lib/crm/contacts";
import {
  ACCOUNT_LABEL,
  AUDIENCE_LABEL,
  COMMUNITY_LABEL,
} from "@/lib/crm/labels";
import { toCsv } from "@/lib/csv";
import { writeAudit } from "@/lib/eten/audit";

/**
 * CSV of every contact matching the current filters (not just the page on
 * screen). Staff only. Exports hold personal data, so each one is written to
 * the audit log with the filters used and the row count.
 */
export async function exportContactsCsv(
  params: Record<string, string>,
): Promise<{ csv: string } | { error: string }> {
  const session = await getCrmSession();
  if (!session) return { error: "You don't have access to the CRM." };

  const filters = parseContactFilters(params);
  try {
    const rows = await listAllContacts(filters);
    const csv = toCsv(
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
    await writeAudit({
      actorId: session.member.id,
      action: "crm.contacts_exported",
      targetType: "crm_contacts",
      targetId: null,
      metadata: { filters, rows: rows.length },
    });
    return { csv };
  } catch {
    return { error: "Couldn't build the export. Please try again." };
  }
}
