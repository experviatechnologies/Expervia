"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCrmSession } from "@/lib/crm/session";
import { isUuid } from "@/lib/crm/record";
import { getResendClient } from "@/lib/email";
import { emailPayload, renderEmail } from "@/lib/email-template";
import { writeAudit } from "@/lib/eten/audit";
import {
  CAMPAIGN_BATCH,
  campaignAudience,
  campaignEmail,
  getCampaign,
} from "@/lib/crm/campaigns";

type Result = { ok: true; id: string } | { ok: false; error: string };

const NOT_READY = "Campaigns aren't set up yet. Run SQL 71 in Supabase first.";
const missing = (e: { message: string; code?: string } | null) =>
  Boolean(e && (e.code === "42P01" || /crm_campaign/.test(e.message)));
const SEND_DELAY_MS = 600;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type CampaignDraft = {
  name: string;
  listId: string | null;
  subject: string;
  preview: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
};

function clean(
  d: CampaignDraft,
): { row: Record<string, unknown> } | { error: string } {
  const t = (v: unknown, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  const name = t(d.name, 120).replace(/\s+/g, " ");
  if (!name) return { error: "Give the campaign a name." };
  const ctaLabel = t(d.ctaLabel, 40);
  const ctaUrl = t(d.ctaUrl, 500);
  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    return { error: "A button needs both its text and its link." };
  }
  if (ctaUrl && !/^https:\/\/\S+$/.test(ctaUrl)) {
    return { error: "The button link must start with https://." };
  }
  if (typeof d.body === "string" && d.body.length > 10000) {
    return { error: "The message is too long." };
  }
  return {
    row: {
      name,
      list_id: d.listId && isUuid(d.listId) ? d.listId : null,
      subject: t(d.subject, 150),
      preview: t(d.preview, 150),
      body: typeof d.body === "string" ? d.body.trim() : "",
      cta_label: ctaLabel || null,
      cta_url: ctaUrl || null,
    },
  };
}

export async function createCampaign(input: {
  name: string;
  listId: string | null;
}): Promise<Result> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  const cleaned = clean({
    ...input,
    subject: "",
    preview: "",
    body: "",
    ctaLabel: "",
    ctaUrl: "",
  });
  if ("error" in cleaned) return { ok: false, error: cleaned.error };
  const { data, error } = await getSupabaseAdmin()
    .from("crm_campaigns")
    .insert({ ...cleaned.row, created_by: session.member.id })
    .select("id")
    .single();
  if (error || !data)
    return {
      ok: false,
      error: missing(error) ? NOT_READY : "Couldn't create the campaign.",
    };
  revalidatePath("/crm/campaigns");
  return { ok: true, id: data.id };
}

export async function saveCampaign(
  id: string,
  draft: CampaignDraft,
): Promise<Result> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  const current = await getCampaign(id);
  if (!current) return { ok: false, error: "Unknown campaign." };
  const cleaned = clean(draft);
  if ("error" in cleaned) return { ok: false, error: cleaned.error };
  // Once sending has started, only the name can change: everyone gets the same email.
  const row =
    current.status === "draft" ? cleaned.row : { name: cleaned.row.name };
  const { error } = await getSupabaseAdmin()
    .from("crm_campaigns")
    .update(row)
    .eq("id", id);
  if (error) return { ok: false, error: "Couldn't save the campaign." };
  revalidatePath(`/crm/campaigns/${id}`);
  revalidatePath("/crm/campaigns");
  return { ok: true, id };
}

export async function deleteCampaign(id: string): Promise<Result> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  const current = await getCampaign(id);
  if (!current) return { ok: false, error: "Unknown campaign." };
  if (current.status !== "draft") {
    return {
      ok: false,
      error: "A campaign that has been sent is kept as a record.",
    };
  }
  const { error } = await getSupabaseAdmin()
    .from("crm_campaigns")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete the campaign." };
  revalidatePath("/crm/campaigns");
  return { ok: true, id };
}

/** The email as it will look, for the preview on the page. */
export async function previewCampaign(draft: CampaignDraft): Promise<string> {
  const session = await getCrmSession();
  if (!session) return "";
  const { content } = campaignEmail(
    {
      subject: draft.subject,
      preview: draft.preview,
      body: draft.body || "Your message will appear here.",
      ctaLabel: draft.ctaLabel || null,
      ctaUrl: /^https:\/\//.test(draft.ctaUrl) ? draft.ctaUrl : null,
    },
    { firstName: "Ada", email: "ada@example.com" },
  );
  return renderEmail(content).html;
}

function readyToSend(c: {
  subject: string;
  body: string;
  listId: string | null;
}) {
  if (!c.listId) return "Choose which list it goes to.";
  if (!c.subject.trim()) return "Add a subject line.";
  if (!c.body.trim()) return "Write the message.";
  return null;
}

async function opsGate() {
  const session = await getCrmSession();
  if (!session) return { error: "You don't have access to the CRM." } as const;
  if (!session.roles.includes("operations")) {
    return { error: "Only operations staff can send campaigns." } as const;
  }
  if (!process.env.CONTACT_FROM_EMAIL) {
    return {
      error: "Email sending isn't configured (CONTACT_FROM_EMAIL).",
    } as const;
  }
  return { session } as const;
}

export async function sendCampaignTest(
  id: string,
): Promise<{ ok: true; to: string } | { ok: false; error: string }> {
  const gate = await opsGate();
  if ("error" in gate) return { ok: false, error: gate.error! };
  const c = await getCampaign(id);
  if (!c) return { ok: false, error: "Unknown campaign." };
  const problem = readyToSend(c);
  if (problem) return { ok: false, error: problem };
  const me = gate.session.member;
  if (!me.email)
    return { ok: false, error: "Your account has no email address." };
  const first = (me.fullName ?? "").split(/\s+/)[0] ?? "";
  const { subject, content } = campaignEmail(c, {
    firstName: first,
    email: me.email,
  });
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

export type CampaignBatchResult =
  | { ok: true; sent: number; failed: number; remaining: number }
  | { ok: false; error: string };

/** Send the next batch (at most 50). Operations staff only. */
export async function sendCampaignBatch(
  id: string,
  expected: number,
): Promise<CampaignBatchResult> {
  const gate = await opsGate();
  if ("error" in gate) return { ok: false, error: gate.error! };
  const { session } = gate;
  const c = await getCampaign(id);
  if (!c) return { ok: false, error: "Unknown campaign." };
  const problem = readyToSend(c);
  if (problem) return { ok: false, error: problem };
  const audience = await campaignAudience(c);
  if (!audience)
    return { ok: false, error: "The campaign's list no longer exists." };

  const batch = audience.remaining.slice(0, CAMPAIGN_BATCH);
  if (batch.length === 0) return { ok: true, sent: 0, failed: 0, remaining: 0 };
  if (batch.length !== Math.min(expected, CAMPAIGN_BATCH)) {
    return {
      ok: false,
      error:
        "The numbers changed since the page loaded. Reload and check before sending.",
    };
  }

  const admin = getSupabaseAdmin();
  const resend = getResendClient();
  const now = () => new Date().toISOString();
  await admin
    .from("crm_campaigns")
    .update({ status: "sending", first_sent_at: c.firstSentAt ?? now() })
    .eq("id", id);

  let sent = 0;
  let failed = 0;
  for (const p of batch) {
    const email = p.email!;
    let error: string | null = null;
    try {
      const { subject, content } = campaignEmail(c, {
        firstName: p.firstName,
        email,
      });
      const res = await resend.emails.send(
        emailPayload({
          from: process.env.CONTACT_FROM_EMAIL!,
          to: email,
          subject,
          content,
        }),
      );
      if (res.error) error = res.error.message;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
    await admin.from("crm_campaign_recipients").upsert(
      {
        campaign_id: id,
        contact_id: p.id,
        email,
        status: error ? "failed" : "sent",
        error,
      },
      { onConflict: "campaign_id,contact_id" },
    );
    if (error) {
      failed += 1;
      if (/rate|quota|limit|429/i.test(error)) break;
    } else {
      sent += 1;
      await admin.from("crm_activities").insert({
        contact_id: p.id,
        type: "campaign",
        product: "crm",
        event: "campaign_sent",
        subject: `Received the email “${c.name}”`,
        body: c.subject,
        payload: { campaign_id: id },
        actor_id: session.member.id,
      });
    }
    await sleep(SEND_DELAY_MS);
  }

  // Failed sends stay in the queue and are retried in the next batch.
  const remaining = Math.max(audience.remaining.length - sent, 0);
  await admin
    .from("crm_campaigns")
    .update({
      sent_count: c.sentCount + sent,
      failed_count: failed,
      last_sent_at: now(),
      status: remaining === 0 ? "sent" : "sending",
    })
    .eq("id", id);
  await writeAudit({
    actorId: session.member.id,
    action: "crm.campaign_batch_sent",
    targetType: "crm_campaigns",
    targetId: id,
    metadata: { sent, failed },
  });
  revalidatePath(`/crm/campaigns/${id}`);
  revalidatePath("/crm/campaigns");
  return { ok: true, sent, failed, remaining };
}
