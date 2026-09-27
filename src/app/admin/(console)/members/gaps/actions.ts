"use server";

import { revalidatePath } from "next/cache";
import { getCurrentManager } from "@/lib/supabase-server";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient, escapeHtml } from "@/lib/email";
import { siteConfig } from "@/config/site";

const KIND_LABEL: Record<string, string> = {
  identity: "Identity verification (KYC)",
  address: "Proof of address",
  certification: "A professional certification",
};

function reminderEmailHtml(fullName: string | null, kinds: string[]): string {
  const greeting = fullName
    ? `Hi ${escapeHtml(fullName.split(/\s+/)[0])},`
    : "Hi,";
  const items = kinds
    .map(
      (k) =>
        `<li style="margin:0 0 6px;">${escapeHtml(KIND_LABEL[k] ?? k)}</li>`,
    )
    .join("");
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:520px;margin:0 auto;">
      <h2 style="margin:0 0 12px;">Complete your ETEN profile</h2>
      <p style="margin:0 0 12px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 12px;line-height:1.6;">
        A few items are still outstanding on your ETEN profile. Completing them
        unlocks the full benefits of membership and helps us verify your status.
      </p>
      <ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;">${items}</ul>
      <p style="margin:20px 0;">
        <a href="${siteConfig.url}/profile/verification" style="background:#2e5395;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block;">
          Verify identity &amp; address
        </a>
      </p>
      <p style="margin:0 0 12px;line-height:1.6;">
        Add your certifications from your
        <a href="${siteConfig.url}/profile/certifications">profile</a>.
      </p>
      <p style="margin:16px 0 0;line-height:1.6;color:#666;font-size:13px;">
        If you have already submitted these, no action is needed.
      </p>
    </div>
  `;
}

/**
 * Emails a member a reminder to complete their outstanding onboarding documents
 * and logs the nudge. Ops-only. Recomputes the gaps at send time so the email
 * only lists what is actually missing.
 */
export async function sendDocumentReminder(
  memberId: string,
): Promise<{ ok: true } | { error: string }> {
  const manager = await getCurrentManager();
  if (!manager) return { error: "Your session has expired." };
  if (!(await isOperations())) return { error: "Operations only." };

  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (!fromEmail) return { error: "Email is not configured." };

  const admin = getSupabaseAdmin();
  const [
    { data: authUser },
    { data: profile },
    { data: verifs },
    { data: certs },
  ] = await Promise.all([
    admin.auth.admin.getUserById(memberId),
    admin
      .from("profiles")
      .select("full_name")
      .eq("member_id", memberId)
      .maybeSingle(),
    admin
      .from("member_verifications")
      .select("kind")
      .eq("member_id", memberId)
      .eq("status", "verified"),
    admin
      .from("certifications")
      .select("id")
      .eq("member_id", memberId)
      .limit(1),
  ]);

  const email = authUser?.user?.email;
  if (!email) return { error: "This member has no email on file." };

  const verifiedKinds = new Set((verifs ?? []).map((v) => v.kind));
  const kinds: string[] = [];
  if (!verifiedKinds.has("identity")) kinds.push("identity");
  if (!verifiedKinds.has("address")) kinds.push("address");
  if (!(certs && certs.length > 0)) kinds.push("certification");
  if (kinds.length === 0) {
    return { error: "This member has no outstanding documents." };
  }

  const { error: mailError } = await getResendClient().emails.send({
    from: fromEmail,
    to: email,
    subject: "Complete your ETEN profile",
    html: reminderEmailHtml(profile?.full_name ?? null, kinds),
  });
  if (mailError) return { error: "The email failed to send." };

  const me = await getCurrentMember();
  await admin
    .from("member_document_reminders")
    .insert({ member_id: memberId, kinds, sent_by: me?.id ?? null });

  revalidatePath("/admin/members/gaps");
  return { ok: true };
}
