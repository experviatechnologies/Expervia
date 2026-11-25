import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyActivationToken } from "@/lib/crm/activation";

/**
 * Activation link from the CRM activation email (/auth/activate?t=...).
 *
 * The token is signed by us and valid for 14 days. Only now, when the person
 * clicks, do we ask Supabase for a one-time recovery link and pass it to the
 * existing /auth/confirm route, which signs them in and opens "set your
 * password". Signing in activates the account (claim trigger, SQL 10).
 *
 *   invalid or expired token  -> sign-in page with an explanation
 *   already activated         -> sign-in page (nothing to do)
 */
export const runtime = "nodejs";

function toSignin(request: NextRequest, reason: string) {
  const url = new URL("/signin", request.url);
  url.searchParams.set("notice", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const memberId = verifyActivationToken(request.nextUrl.searchParams.get("t"));
  if (!memberId) return toSignin(request, "activation_expired");

  const admin = getSupabaseAdmin();
  const [{ data: member }, { data: user }] = await Promise.all([
    admin
      .from("members")
      .select("claimed_at, status")
      .eq("id", memberId)
      .maybeSingle(),
    admin.auth.admin.getUserById(memberId),
  ]);
  const email = user?.user?.email;
  if (!member || !email || member.status !== "active") {
    return toSignin(request, "activation_expired");
  }
  if (member.claimed_at) return toSignin(request, "already_active");

  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error || !link?.properties?.hashed_token) {
    return toSignin(request, "activation_failed");
  }

  // Record the click on their CRM timeline (best effort).
  try {
    const { data: contact } = await admin
      .from("crm_contacts")
      .select("id")
      .eq("member_id", memberId)
      .maybeSingle();
    if (contact) {
      await admin.from("crm_activities").insert({
        contact_id: contact.id,
        type: "email",
        product: "crm",
        event: "activation_link_opened",
        subject: "Opened their activation link",
      });
    }
  } catch {
    /* never block activation */
  }

  const confirm = new URL("/auth/confirm", request.url);
  confirm.searchParams.set("token_hash", link.properties.hashed_token);
  confirm.searchParams.set("type", "recovery");
  confirm.searchParams.set("next", "/reset-password");
  return NextResponse.redirect(confirm);
}
