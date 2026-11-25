import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Record things people send through public forms in the CRM. Always best
 * effort: a CRM problem is logged and never fails the form the person used.
 */

const DAY = 86_400_000;

function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

/**
 * A Women in Tech contributor enquiry (/women-in-tech). Finds the contact by
 * email or creates one (not opted in to marketing: they agreed to the privacy
 * notice only), logs the enquiry on their timeline and adds a follow-up task.
 */
export async function recordWitContributor(input: {
  fullName: string;
  email: string;
  role: string;
  profile: string;
  message: string;
  interests: string[];
}): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    const email = input.email.trim().toLowerCase();
    const tag = "Women in Tech contributor";

    const { data: existing } = await admin
      .from("crm_contacts")
      .select("id, tags, job_title")
      .eq("email", email)
      .maybeSingle();

    let contactId = existing?.id as string | undefined;
    if (existing) {
      const tags: string[] = existing.tags ?? [];
      await admin
        .from("crm_contacts")
        .update({
          tags: tags.includes(tag) ? tags : [...tags, tag],
          job_title: existing.job_title ?? (input.role || null),
        })
        .eq("id", existing.id);
    } else {
      const { first, last } = splitName(input.fullName);
      const { data: created, error } = await admin
        .from("crm_contacts")
        .insert({
          first_name: first,
          last_name: last,
          email,
          job_title: input.role || null,
          audience: "eten",
          lifecycle: "lead",
          lead_status: "new",
          source: "Women in Tech contributor form",
          tags: [tag],
          email_opt_in: false,
          first_seen_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      contactId = created.id;
    }
    if (!contactId) return;

    const body = [
      `Role or expertise: ${input.role}`,
      input.profile && `Profile: ${input.profile}`,
      input.message && `Message: ${input.message}`,
    ]
      .filter(Boolean)
      .join("\n");

    await admin.from("crm_activities").insert({
      contact_id: contactId,
      type: "form",
      product: "women_in_tech",
      event: "wit_contributor_enquiry",
      subject: `Offered to contribute to Women in Tech: ${input.interests.join(", ")}`,
      body,
      payload: { interests: input.interests, profile: input.profile || null },
    });

    // A follow-up for the team (skipped quietly if tasks aren't set up).
    await admin.from("crm_tasks").insert({
      title: `Follow up Women in Tech contributor: ${input.fullName}`.slice(
        0,
        200,
      ),
      type: "follow_up",
      priority: "medium",
      due_at: new Date(Date.now() + 2 * DAY).toISOString(),
      contact_id: contactId,
      notes: `They offered: ${input.interests.join(", ")}`.slice(0, 2000),
    });
  } catch (err) {
    console.error("CRM capture (Women in Tech contributor) failed:", err);
  }
}
