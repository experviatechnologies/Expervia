"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCrmSession } from "@/lib/crm/session";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient } from "@/lib/email";
import { emailPayload } from "@/lib/email-template";
import { writeAudit } from "@/lib/eten/audit";
import {
  BATCH_SIZE,
  activationCandidates,
  activationEmail,
  activationUrl,
  pickBatch,
  type EmailVersion,
  type Group,
  type Mode,
} from "@/lib/crm/activation";

const SEND_DELAY_MS = 600;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function opsOnly() {
  const session = await getCrmSession();
  if (!session) return { error: "You don't have access to the CRM." } as const;
  if (!session.roles.includes("operations")) {
    return {
      error: "Only operations staff can send activation emails.",
    } as const;
  }
  if (!process.env.CONTACT_FROM_EMAIL) {
    return {
      error: "Email sending isn't configured (CONTACT_FROM_EMAIL).",
    } as const;
  }
  return { session } as const;
}

/** Send yourself one version, with a real link that leads to "already active". */
export async function sendTestActivation(
  version: EmailVersion,
): Promise<{ ok: true; to: string } | { ok: false; error: string }> {
  const gate = await opsOnly();
  if ("error" in gate) return { ok: false, error: gate.error! };
  const me = gate.session.member;
  if (!me.email)
    return { ok: false, error: "Your account has no email address." };
  const { subject, content } = activationEmail(
    me.fullName,
    me.email,
    activationUrl(me.id),
    version,
  );
  const { error } = await getResendClient().emails.send(
    emailPayload({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: me.email,
      subject: `[Test] ${subject}`,
      content,
    }),
  );
  if (error)
    return { ok: false, error: `The email service said: ${error.message}` };
  return { ok: true, to: me.email };
}

export type BatchResult =
  | {
      ok: true;
      sent: number;
      failed: { email: string; error: string }[];
      remaining: number;
    }
  | { ok: false; error: string };

/**
 * Send the next batch (at most 50) of activation emails to one group. Each
 * send is written to the contact's timeline, so nobody is emailed twice by
 * mistake; the batch is written to the audit log.
 */
export async function sendActivationBatch(input: {
  group: Group;
  mode: Mode;
  /** The number the person confirmed on screen; must still be right. */
  expected: number;
}): Promise<BatchResult> {
  const gate = await opsOnly();
  if ("error" in gate) return { ok: false, error: gate.error! };
  const { session } = gate;

  const { candidates } = await activationCandidates();
  const eligible = pickBatch(candidates, input.group, input.mode);
  const batch = eligible.slice(0, BATCH_SIZE);
  if (batch.length === 0)
    return { ok: true, sent: 0, failed: [], remaining: 0 };
  if (batch.length !== Math.min(input.expected, BATCH_SIZE)) {
    return {
      ok: false,
      error:
        "The numbers changed since the page loaded. Reload and check before sending.",
    };
  }

  const admin = getSupabaseAdmin();
  const resend = getResendClient();
  const batchId = randomUUID();
  const failed: { email: string; error: string }[] = [];
  let sent = 0;

  for (const c of batch) {
    try {
      const { subject, content } = activationEmail(
        c.name || null,
        c.email,
        activationUrl(c.memberId),
        c.version,
      );
      const { error } = await resend.emails.send(
        emailPayload({
          from: process.env.CONTACT_FROM_EMAIL!,
          to: c.email,
          subject,
          content,
        }),
      );
      if (error) throw new Error(error.message);
      sent += 1;
      await admin.from("crm_activities").insert({
        contact_id: c.contactId,
        type: "email",
        product: "crm",
        event: "activation_email_sent",
        subject:
          input.mode === "first"
            ? "Sent the activation email"
            : "Sent an activation reminder",
        body: subject,
        payload: { batch_id: batchId, version: c.version },
        actor_id: session.member.id,
      });
    } catch (err) {
      failed.push({
        email: c.email,
        error: err instanceof Error ? err.message : String(err),
      });
      // A rate or quota limit will fail every remaining email too: stop.
      if (/rate|quota|limit|429/i.test(String(err))) break;
    }
    await sleep(SEND_DELAY_MS);
  }

  await writeAudit({
    actorId: session.member.id,
    action: "crm.activation_batch_sent",
    targetType: "crm_activation",
    targetId: null,
    metadata: {
      batchId,
      group: input.group,
      mode: input.mode,
      sent,
      failed: failed.length,
    },
  });
  revalidatePath("/crm/activation");
  revalidatePath("/crm/reports");
  return {
    ok: true,
    sent,
    failed,
    remaining: Math.max(eligible.length - sent, 0),
  };
}
