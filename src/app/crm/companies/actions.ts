"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCrmSession } from "@/lib/crm/session";
import { COMPANY_TYPES, type CompanyType } from "@/lib/crm/companies";
import { isUuid, listOwners } from "@/lib/crm/record";
import { COMPANY_TYPE_LABEL } from "@/lib/crm/labels";

export type CompanyInput = {
  name: string;
  type: CompanyType;
  industry: string;
  domain: string;
  phone: string;
  city: string;
  country: string;
  description: string;
  ownerId: string | null;
};

export type CompanyResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const LIMITS: Partial<Record<keyof CompanyInput, number>> = {
  name: 120,
  industry: 80,
  domain: 120,
  phone: 40,
  city: 80,
  country: 80,
  description: 2000,
};

const FIELD_LABEL: Record<string, string> = {
  name: "Name",
  type: "Type",
  industry: "Industry",
  domain: "Website",
  phone: "Phone",
  city: "City",
  country: "Country",
  description: "Description",
  owner_id: "Owner",
};

/** Trim, check lengths and normalise; returns the DB row or an error. */
async function clean(
  input: CompanyInput,
): Promise<{ row: Record<string, string | null> } | { error: string }> {
  const text = (k: keyof CompanyInput) => {
    const v = input[k];
    return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  };
  for (const [k, max] of Object.entries(LIMITS)) {
    if (text(k as keyof CompanyInput).length > (max ?? 0)) {
      return { error: `${FIELD_LABEL[k]} is too long.` };
    }
  }
  const name = text("name");
  if (!name) return { error: "Give the company a name." };
  if (!(COMPANY_TYPES as readonly string[]).includes(input.type)) {
    return { error: "Choose a company type." };
  }
  // Store a bare domain: "https://www.acme.com/about" -> "acme.com".
  const domain = text("domain")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
  if (domain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) {
    return { error: "Enter the website like acme.com." };
  }
  if (input.ownerId) {
    const owners = await listOwners();
    if (!owners.some((o) => o.id === input.ownerId)) {
      return { error: "The owner must be a CRM staff member." };
    }
  }
  const description = (input.description ?? "").trim();
  return {
    row: {
      name,
      type: input.type,
      industry: text("industry") || null,
      domain: domain || null,
      phone: text("phone") || null,
      city: text("city") || null,
      country: text("country") || null,
      description: description || null,
      owner_id: input.ownerId || null,
    },
  };
}

async function nameTaken(name: string, exceptId?: string) {
  let q = getSupabaseAdmin()
    .from("crm_companies")
    .select("id")
    .ilike(
      "name",
      name.replace(/[%_\\]/g, (m) => `\\${m}`),
    );
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q.limit(1);
  return (data ?? []).length > 0;
}

export async function createCompany(
  input: CompanyInput,
): Promise<CompanyResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  const cleaned = await clean(input);
  if ("error" in cleaned) return { ok: false, error: cleaned.error };
  if (await nameTaken(cleaned.row.name as string)) {
    return { ok: false, error: "A company with this name already exists." };
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("crm_companies")
    .insert(cleaned.row)
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: "Couldn't add the company. Please try again." };
  }
  await admin.from("crm_activities").insert({
    company_id: data.id,
    type: "system",
    product: "crm",
    event: "company_created",
    subject: "Company added",
    actor_id: session.member.id,
  });
  revalidatePath("/crm/companies");
  return { ok: true, id: data.id };
}

export async function updateCompany(
  id: string,
  input: CompanyInput,
): Promise<CompanyResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  if (!isUuid(id)) return { ok: false, error: "Unknown company." };
  const cleaned = await clean(input);
  if ("error" in cleaned) return { ok: false, error: cleaned.error };

  const admin = getSupabaseAdmin();
  const { data: before } = await admin
    .from("crm_companies")
    .select(
      "name, type, industry, domain, phone, city, country, description, owner_id",
    )
    .eq("id", id)
    .maybeSingle();
  if (!before) return { ok: false, error: "Unknown company." };
  if (
    cleaned.row.name !== before.name &&
    (await nameTaken(cleaned.row.name as string, id))
  ) {
    return { ok: false, error: "A company with this name already exists." };
  }

  const changed = Object.keys(cleaned.row).filter(
    (k) =>
      (cleaned.row[k] ?? null) !==
      ((before as Record<string, unknown>)[k] ?? null),
  );
  if (changed.length === 0) return { ok: true, id };

  const { error } = await admin
    .from("crm_companies")
    .update(cleaned.row)
    .eq("id", id);
  if (error) return { ok: false, error: "Couldn't save. Please try again." };

  const describe = (k: string) =>
    k === "type"
      ? `Type: ${COMPANY_TYPE_LABEL[before.type as CompanyType]} to ${COMPANY_TYPE_LABEL[cleaned.row.type as CompanyType]}`
      : k === "description" || k === "owner_id"
        ? `${FIELD_LABEL[k]} changed`
        : `${FIELD_LABEL[k]}: ${(before as Record<string, string | null>)[k] ?? "blank"} to ${cleaned.row[k] ?? "blank"}`;
  await admin.from("crm_activities").insert({
    company_id: id,
    type: "stage",
    product: "crm",
    event: "company_updated",
    subject: "Company updated",
    body: changed.map(describe).join("\n"),
    actor_id: session.member.id,
  });
  revalidatePath(`/crm/companies/${id}`);
  revalidatePath("/crm/companies");
  return { ok: true, id };
}
