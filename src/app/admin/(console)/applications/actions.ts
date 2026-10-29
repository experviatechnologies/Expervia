"use server";

import { getCurrentManager } from "@/lib/supabase-server";
import { getSupabaseAdmin, APPLICATIONS_TABLE } from "@/lib/supabase";

type ExportResult = { csv: string } | { error: string };

const COLUMNS: { key: string; header: string }[] = [
  { key: "created_at", header: "Applied" },
  { key: "full_name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "vendor", header: "Track" },
  { key: "location", header: "Location" },
  { key: "solution_area", header: "Solution area" },
  { key: "certifications", header: "Certifications" },
  { key: "availability", header: "Availability" },
  { key: "linkedin", header: "LinkedIn" },
];

/** CSV-escape a single value (RFC 4180: quote when it has comma/quote/newline). */
function cell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Build a CSV of ALL community applications matching the same filters as the
 * table (track + search), newest first. Operations-only; read with the
 * service_role client after the session check.
 */
export async function exportApplicationsCsv(input: {
  vendor?: string;
  q?: string;
}): Promise<ExportResult> {
  const manager = await getCurrentManager();
  if (!manager) return { error: "Not authorised." };

  const activeVendor =
    input.vendor === "huawei" || input.vendor === "microsoft"
      ? input.vendor
      : "all";
  const search = (input.q ?? "").trim();

  let query = getSupabaseAdmin()
    .from(APPLICATIONS_TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (activeVendor !== "all") query = query.eq("vendor", activeVendor);
  if (search) {
    const safe = search.replace(/[%,]/g, " ");
    query = query.or(
      `full_name.ilike.%${safe}%,email.ilike.%${safe}%,location.ilike.%${safe}%`,
    );
  }

  const { data, error } = await query;
  if (error)
    return { error: "Couldn't export applications. Please try again." };

  const rows = (data ?? []) as Record<string, unknown>[];
  const lines = [
    COLUMNS.map((c) => cell(c.header)).join(","),
    ...rows.map((r) => COLUMNS.map((c) => cell(r[c.key])).join(",")),
  ];
  return { csv: lines.join("\r\n") };
}
