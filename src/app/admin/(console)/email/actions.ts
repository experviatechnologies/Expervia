"use server";

import { revalidatePath } from "next/cache";
import { getCurrentManager } from "@/lib/supabase-server";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient, escapeHtml } from "@/lib/email";
import { writeAudit } from "@/lib/eten/audit";

type Admin = ReturnType<typeof getSupabaseAdmin>;

/** Send at most this many messages in one broadcast. */
const SEND_CAP = 500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Audience =
  | "all"
  | "prospects"
  | "validated"
  | "mentors"
  | "mentorship_signups"
  | "missing_docs"
  | "manual"
  | `pod:${string}`;

/** Auth email for every member id, across pages (capped for safety). */
async function loadEmailMap(admin: Admin): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error || !data?.users?.length) break;
    for (const u of data.users) if (u.email) emails.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }
  return emails;
}

function parseManual(list: string): string[] {
  return [
    ...new Set(
      (list ?? "")
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => EMAIL_RE.test(e)),
    ),
  ];
}

/** Resolve an audience to a de-duplicated list of recipient emails + a label. */
async function resolveRecipients(
  admin: Admin,
  audience: Audience,
  manual: string,
): Promise<{ emails: string[]; label: string }> {
  if (audience === "manual") {
    return { emails: parseManual(manual), label: "Manual list" };
  }

  let memberIds: string[] = [];
  let label = "";

  if (audience.startsWith("pod:")) {
    const podId = audience.slice(4);
    const [{ data: rows }, { data: pod }] = await Promise.all([
      admin.from("pod_memberships").select("member_id").eq("pod_id", podId),
      admin.from("pods").select("name").eq("id", podId).maybeSingle(),
    ]);
    memberIds = (rows ?? []).map((r) => r.member_id);
    label = `Pod: ${pod?.name ?? "Unknown"}`;
  } else if (audience === "all") {
    const { data } = await admin
      .from("members")
      .select("id")
      .eq("status", "active");
    memberIds = (data ?? []).map((m) => m.id);
    label = "All members";
  } else if (audience === "prospects") {
    const { data } = await admin
      .from("members")
      .select("id")
      .eq("status", "active")
      .is("validated_at", null);
    memberIds = (data ?? []).map((m) => m.id);
    label = "Prospects";
  } else if (audience === "validated") {
    const { data } = await admin
      .from("members")
      .select("id")
      .eq("status", "active")
      .not("validated_at", "is", null);
    memberIds = (data ?? []).map((m) => m.id);
    label = "Validated members";
  } else if (audience === "mentors") {
    const { data } = await admin.from("mentor_profiles").select("member_id");
    memberIds = (data ?? []).map((m) => m.member_id);
    label = "Verified mentors";
  } else if (audience === "mentorship_signups") {
    const { data } = await admin
      .from("members")
      .select("id")
      .eq("signup_source", "mentorship");
    memberIds = (data ?? []).map((m) => m.id);
    label = "Mentorship signups";
  } else if (audience === "missing_docs") {
    const [{ data: activeM }, { data: verifs }, { data: certs }] =
      await Promise.all([
        admin.from("members").select("id").eq("status", "active"),
        admin
          .from("member_verifications")
          .select("member_id, kind")
          .eq("status", "verified"),
        admin.from("certifications").select("member_id"),
      ]);
    const idV = new Set<string>();
    const addrV = new Set<string>();
    for (const v of verifs ?? []) {
      if (v.kind === "identity") idV.add(v.member_id);
      else if (v.kind === "address") addrV.add(v.member_id);
    }
    const hasCert = new Set((certs ?? []).map((c) => c.member_id));
    memberIds = (activeM ?? [])
      .map((m) => m.id)
      .filter((id) => !idV.has(id) || !addrV.has(id) || !hasCert.has(id));
    label = "Members missing documents";
  }

  const emailMap = await loadEmailMap(admin);
  const emails = [
    ...new Set(
      memberIds
        .map((id) => emailMap.get(id)?.toLowerCase())
        .filter((e): e is string => Boolean(e)),
    ),
  ];
  return { emails, label };
}

/** Ops-only: how many recipients an audience resolves to (for the compose UI). */
export async function previewAudience(input: {
  audience: Audience;
  manual: string;
}): Promise<{ count: number; label: string } | { error: string }> {
  if (!(await getCurrentManager())) return { error: "Not signed in." };
  if (!(await isOperations())) return { error: "Operations only." };
  const admin = getSupabaseAdmin();
  const { emails, label } = await resolveRecipients(
    admin,
    input.audience,
    input.manual,
  );
  return { count: emails.length, label };
}

function broadcastHtml(
  body: string,
  cta: { label: string; url: string } | null,
): string {
  const paras = body
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;line-height:1.6;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  const button =
    cta && /^https?:\/\//i.test(cta.url)
      ? `<p style="margin:22px 0;"><a href="${escapeHtml(cta.url)}" style="background:#2e5395;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block;">${escapeHtml(cta.label || "Open")}</a></p>`
      : "";
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:560px;margin:0 auto;">
      ${paras}${button}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="margin:0;color:#888;font-size:12px;">Expervia Technology Experts Network (ETEN)</p>
    </div>
  `;
}

async function sendChunked(
  from: string,
  emails: string[],
  subject: string,
  html: string,
): Promise<{ sent: number; failed: number }> {
  const resend = getResendClient();
  let sent = 0;
  let failed = 0;
  const size = 20;
  for (let i = 0; i < emails.length; i += size) {
    const chunk = emails.slice(i, i + size);
    const results = await Promise.allSettled(
      chunk.map((to) => resend.emails.send({ from, to, subject, html })),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && !r.value.error) sent += 1;
      else failed += 1;
    }
  }
  return { sent, failed };
}

/** Ops-only: send a custom email to a resolved audience via Resend. */
export async function sendBroadcast(input: {
  subject: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  audience: Audience;
  manual: string;
}): Promise<
  { ok: true; sent: number; failed: number; total: number } | { error: string }
> {
  if (!(await getCurrentManager())) return { error: "Not signed in." };
  if (!(await isOperations())) return { error: "Operations only." };

  const subject = input.subject?.trim();
  const body = input.body?.trim();
  if (!subject) return { error: "Enter a subject." };
  if (!body) return { error: "Enter a message." };

  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (!fromEmail)
    return { error: "Email is not configured (CONTACT_FROM_EMAIL)." };

  const admin = getSupabaseAdmin();
  const { emails, label } = await resolveRecipients(
    admin,
    input.audience,
    input.manual,
  );
  if (emails.length === 0) {
    return { error: "That audience has no recipients." };
  }
  if (emails.length > SEND_CAP) {
    return {
      error: `That audience has ${emails.length} recipients, over the ${SEND_CAP} limit. Narrow it and try again.`,
    };
  }

  const cta =
    input.ctaUrl?.trim() && input.ctaLabel?.trim()
      ? { label: input.ctaLabel.trim(), url: input.ctaUrl.trim() }
      : null;
  const html = broadcastHtml(body, cta);

  const { sent, failed } = await sendChunked(fromEmail, emails, subject, html);

  const me = await getCurrentMember();
  await admin.from("email_broadcasts").insert({
    subject,
    body,
    audience: label,
    recipient_count: emails.length,
    sent_count: sent,
    failed_count: failed,
    sent_by: me?.id ?? null,
  });
  await writeAudit({
    actorId: me?.id ?? null,
    action: "email.broadcast_sent",
    targetType: "email_broadcast",
    targetId: null,
    metadata: { audience: label, recipients: emails.length, sent, failed },
  });

  revalidatePath("/admin/email");
  return { ok: true, sent, failed, total: emails.length };
}
