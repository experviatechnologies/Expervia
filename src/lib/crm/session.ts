import "server-only";
import { cache } from "react";
import { getCurrentMember, type MemberIdentity } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Who is using the CRM. Staff only: operations, Sales Manager or Management
 * (the same people is_crm_staff() lets through in SQL 64). Resolved on the
 * server; every CRM page and action gates on this, never on the browser.
 */
export type CrmRole = "operations" | "sales_manager" | "management";

export type CrmSession = {
  member: MemberIdentity;
  roles: CrmRole[];
};

export const getCrmSession = cache(async (): Promise<CrmSession | null> => {
  const member = await getCurrentMember();
  if (!member || member.status !== "active") return null;

  const roles: CrmRole[] = [];
  if (member.role === "operations") roles.push("operations");

  const { data } = await getSupabaseAdmin()
    .from("member_roles")
    .select("role")
    .eq("member_id", member.id);
  for (const r of data ?? []) {
    if (r.role === "sales_manager" || r.role === "management") {
      roles.push(r.role);
    }
  }
  return roles.length > 0 ? { member, roles } : null;
});

export const CRM_ROLE_LABEL: Record<CrmRole, string> = {
  operations: "Operations",
  sales_manager: "Sales Manager",
  management: "Management",
};
