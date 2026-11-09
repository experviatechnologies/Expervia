"use server";

import { revalidatePath } from "next/cache";
import { getCurrentManager } from "@/lib/supabase-server";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient } from "@/lib/email";
import { emailPayload } from "@/lib/email-template";
import { documentReminderEmail } from "@/lib/eten/account-emails";

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

  const { subject, content } = documentReminderEmail(
    profile?.full_name ?? null,
    kinds,
  );
  const { error: mailError } = await getResendClient().emails.send(
    emailPayload({ from: fromEmail, to: email, subject, content }),
  );
  if (mailError) return { error: "The email failed to send." };

  const me = await getCurrentMember();
  await admin
    .from("member_document_reminders")
    .insert({ member_id: memberId, kinds, sent_by: me?.id ?? null });

  revalidatePath("/admin/members/gaps");
  return { ok: true };
}
