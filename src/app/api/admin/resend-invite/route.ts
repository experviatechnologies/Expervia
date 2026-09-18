import { NextResponse, type NextRequest } from "next/server";
import { getCurrentManager } from "@/lib/supabase-server";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient, escapeHtml } from "@/lib/email";
import { writeAudit } from "@/lib/eten/audit";

/**
 * Re-invite migrated members who never claimed their account. Ops-only, POST.
 *
 * Body: { memberIds: string[] } (1..50). For each member that is still
 * origin='migrated' AND unclaimed, we generate a fresh RECOVERY link (the
 * account exists with no password, so "set your password" is the claim action)
 * and email it. Using their existing account means one click signs them in and
 * the claim-on-sign-in trigger activates them. Anyone already claimed is skipped.
 */

const MAX_BATCH = 50;

function emailHtml(fullName: string | null, claimUrl: string): string {
  const greeting = fullName
    ? `Hi ${escapeHtml(fullName.split(/\s+/)[0])},`
    : "Hi,";
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:520px;margin:0 auto;">
      <h2 style="margin:0 0 12px;">Finish setting up your ETEN account</h2>
      <p style="margin:0 0 12px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 12px;line-height:1.6;">
        We set up an ETEN account for you because you registered with Expervia,
        but it hasn't been activated yet. Click below to set your password and
        finish your profile — it only takes a minute.
      </p>
      <p style="margin:24px 0;">
        <a href="${claimUrl}" style="background:#2e5395;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block;">
          Set your password &amp; sign in
        </a>
      </p>
      <p style="margin:0 0 12px;line-height:1.6;color:#666;font-size:13px;">
        This link is single-use and expires soon. If the button doesn't work,
        request a new one or reply to this email and we'll help.
      </p>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  const manager = await getCurrentManager();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isOperations())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!process.env.CONTACT_FROM_EMAIL) {
    return NextResponse.json(
      { error: "CONTACT_FROM_EMAIL is not configured." },
      { status: 500 },
    );
  }

  let body: { memberIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const memberIds = Array.isArray(body.memberIds)
    ? [
        ...new Set(
          body.memberIds.filter((x): x is string => typeof x === "string"),
        ),
      ]
    : [];
  if (memberIds.length === 0) {
    return NextResponse.json(
      { error: "No members selected." },
      { status: 400 },
    );
  }
  if (memberIds.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Resend at most ${MAX_BATCH} at a time.` },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const resend = getResendClient();
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const origin = request.nextUrl.origin;
  const me = await getCurrentMember();

  const processed: {
    memberId: string;
    status: "sent" | "skipped" | "failed";
    error?: string;
  }[] = [];

  for (const memberId of memberIds) {
    try {
      // Only re-invite migrated + still-unclaimed accounts.
      const { data: member } = await admin
        .from("members")
        .select("id, origin, claimed_at")
        .eq("id", memberId)
        .maybeSingle();
      if (!member || member.origin !== "migrated" || member.claimed_at) {
        processed.push({ memberId, status: "skipped" });
        continue;
      }

      const { data: authUser } = await admin.auth.admin.getUserById(memberId);
      const email = authUser?.user?.email;
      const fullName =
        (authUser?.user?.user_metadata?.full_name as string | undefined) ??
        null;
      if (!email) {
        processed.push({ memberId, status: "skipped" });
        continue;
      }

      const { data: link, error: linkError } =
        await admin.auth.admin.generateLink({ type: "recovery", email });
      if (linkError || !link?.properties?.hashed_token) {
        throw new Error(linkError?.message ?? "Could not generate link.");
      }

      const claimUrl = `${origin}/auth/confirm?token_hash=${encodeURIComponent(
        link.properties.hashed_token,
      )}&type=recovery&next=/reset-password`;

      const { error: mailError } = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "Finish setting up your ETEN account",
        html: emailHtml(fullName, claimUrl),
      });
      if (mailError) throw new Error(mailError.message);

      await writeAudit({
        actorId: me?.id ?? null,
        action: "member.invite_resent",
        targetType: "member",
        targetId: memberId,
      });
      processed.push({ memberId, status: "sent" });
    } catch (err) {
      processed.push({
        memberId,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const sent = processed.filter((p) => p.status === "sent").length;
  return NextResponse.json({ sent, processed });
}
