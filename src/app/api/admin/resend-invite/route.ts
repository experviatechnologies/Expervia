import { NextResponse, type NextRequest } from "next/server";
import { getCurrentManager } from "@/lib/supabase-server";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient } from "@/lib/email";
import { emailPayload } from "@/lib/email-template";
import { claimEmail } from "@/lib/eten/migration";
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

export const runtime = "nodejs";
// A paced batch of up to 50 (~600ms each) can take ~30s; give it headroom.
export const maxDuration = 60;

const MAX_BATCH = 50;
const SEND_DELAY_MS = 600;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  let body: { memberIds?: unknown; all?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // `all: true` re-invites every migrated + still-unclaimed account (capped to
  // one batch), so ops don't have to hand-pick them. Otherwise use the given ids.
  let memberIds: string[];
  if (body.all === true) {
    const { data: unclaimed } = await admin
      .from("members")
      .select("id")
      .eq("origin", "migrated")
      .is("claimed_at", null)
      .limit(MAX_BATCH);
    memberIds = (unclaimed ?? []).map((m) => m.id);
  } else {
    memberIds = Array.isArray(body.memberIds)
      ? [
          ...new Set(
            body.memberIds.filter((x): x is string => typeof x === "string"),
          ),
        ]
      : [];
  }
  if (memberIds.length === 0) {
    return NextResponse.json(
      { error: "No unclaimed members to invite." },
      { status: 400 },
    );
  }
  if (memberIds.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Resend at most ${MAX_BATCH} at a time.` },
      { status: 400 },
    );
  }
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

      const { subject, content } = claimEmail(fullName, claimUrl, {
        reminder: true,
      });
      const { error: mailError } = await resend.emails.send(
        emailPayload({ from: fromEmail, to: email, subject, content }),
      );
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
    await sleep(SEND_DELAY_MS);
  }

  const sent = processed.filter((p) => p.status === "sent").length;
  return NextResponse.json({ sent, processed });
}
