import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email-template";
import { signInCodeEmail } from "@/lib/eten/account-emails";
import { findAuthUserByEmail } from "@/lib/eten/confirmation-email";
import { safeNext } from "@/lib/safe-next";

/**
 * "Email me a sign-in code" (PWA phase 5). Sends a one-time code to type into
 * ETEN, plus the same sign-in as a link, through Resend (ETEN doesn't use
 * Supabase's own email). The code matters for the installed app on iPhone:
 * links from email open Safari, which has a separate sign-in, but a code is
 * typed into the app itself. Existing accounts only; opening the link or using
 * the code also confirms an unconfirmed email.
 */
export async function sendSignInCode(
  email: string,
  origin: string,
  next: string,
): Promise<"sent" | "skipped" | "failed"> {
  const target = email.trim().toLowerCase();
  const user = await findAuthUserByEmail(target);
  if (!user) return "skipped";

  const { data: link, error } =
    await getSupabaseAdmin().auth.admin.generateLink({
      type: "magiclink",
      email: target,
    });
  const props = link?.properties;
  if (error || !props?.hashed_token || !props.email_otp) return "failed";

  const dest = safeNext(next);
  const type = props.verification_type || "magiclink";
  const url = `${origin}/auth/confirm?token_hash=${encodeURIComponent(
    props.hashed_token,
  )}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(dest)}`;

  const { subject, content } = signInCodeEmail(
    user.user_metadata?.full_name,
    props.email_otp,
    url,
  );
  const failed = await sendEmail({ to: target, subject, content });
  return failed ? "failed" : "sent";
}
