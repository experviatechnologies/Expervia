import { getResendClient, escapeHtml } from "@/lib/email";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import { checkRateLimit, clientIp } from "@/lib/eten/spam-guard";
import { verifyTurnstile } from "@/lib/eten/turnstile";
import { witContributionInterests } from "@/config/women-in-tech";
import { recordWitContributor } from "@/lib/crm/capture";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = {
  fullName: 120,
  email: 254,
  role: 160,
  profile: 300,
  message: 2000,
};

/**
 * ETEN Women in Tech contributor enquiry (PRD 10.2 / FR-05, FR-06, FR-15).
 *
 * An expression of interest only: it is emailed to the ETEN team inbox
 * (CONTACT_TO_EMAIL), the same approved route the contact form uses, and
 * recorded in the CRM (the PRD's open "mailbox, CRM or endpoint" question,
 * answered 25 Nov 2026) with a follow-up task. The CRM step is best effort
 * and never fails the form.
 * Same bot defences as /api/contact: honeypot + minimum fill time (silent
 * fake success), per-IP rate limit, and Turnstile once keys are configured.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const honeypot = body[HONEYPOT_FIELD];
  const elapsed = Number(body.elapsedMs);
  if (
    (typeof honeypot === "string" && honeypot.trim()) ||
    (Number.isFinite(elapsed) && elapsed < 3000)
  ) {
    return Response.json({ ok: true });
  }

  const ip = clientIp(request.headers);
  if (
    !checkRateLimit(`wit-contrib:${ip}`, { limit: 3, windowMs: 15 * 60_000 })
  ) {
    return Response.json(
      { error: "Too many submissions. Please try again in a little while." },
      { status: 429 },
    );
  }

  const token =
    typeof body.turnstileToken === "string" ? body.turnstileToken : null;
  if (!(await verifyTurnstile(token, ip))) {
    return Response.json(
      {
        error: "Verification failed. Please complete the check and try again.",
      },
      { status: 400 },
    );
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const fullName = str(body.fullName);
  const email = str(body.email);
  const role = str(body.role);
  const profile = str(body.profile);
  const message = str(body.message);
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((i): i is string =>
        (witContributionInterests as readonly string[]).includes(i as string),
      )
    : [];

  if (!fullName || !email || !role) {
    return Response.json(
      {
        error:
          "Full name, email and your role or area of expertise are required.",
      },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }
  if (!interests.length) {
    return Response.json(
      { error: "Please choose at least one way you would like to contribute." },
      { status: 400 },
    );
  }
  if (body.privacy !== true) {
    return Response.json(
      { error: "Please confirm you have read the privacy notice." },
      { status: 400 },
    );
  }
  if (profile && !/^https?:\/\/\S+$/i.test(profile)) {
    return Response.json(
      { error: "Please enter a full profile link starting with https://." },
      { status: 400 },
    );
  }
  if (
    fullName.length > LIMITS.fullName ||
    email.length > LIMITS.email ||
    role.length > LIMITS.role ||
    profile.length > LIMITS.profile ||
    message.length > LIMITS.message
  ) {
    return Response.json(
      {
        error:
          "One of the fields is too long. Please shorten it and try again.",
      },
      { status: 400 },
    );
  }

  const rows: [string, string][] = [
    ["Name", fullName],
    ["Email", email],
    ["Role / expertise", role],
    ["Contribution interest", interests.join(", ")],
    ["Profile", profile],
  ];
  const rowHtml = rows
    .filter(([, v]) => v)
    .map(
      ([label, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">${label}</td><td>${escapeHtml(v)}</td></tr>`,
    )
    .join("");

  try {
    const { error } = await getResendClient().emails.send({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: email,
      subject: `Women in Tech contributor interest: ${fullName}`,
      html: `
        <h2>New ETEN Women in Tech contributor enquiry</h2>
        <p style="color:#8a8a8a;">Submitted from /women-in-tech. This is an expression of interest; please follow up through the usual process.</p>
        <table cellspacing="0" cellpadding="0">${rowHtml}</table>
        ${message ? `<p style="margin-top:16px;white-space:pre-wrap;">${escapeHtml(message)}</p>` : ""}
      `,
    });
    if (error) {
      console.error(
        "Resend error (WiT contributor):",
        error.name,
        error.message,
      );
      return Response.json(
        { error: "We couldn't send your enquiry. Please try again." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("WiT contributor enquiry send failed:", err);
    return Response.json(
      { error: "We couldn't send your enquiry. Please try again." },
      { status: 500 },
    );
  }

  // After the email has gone: a CRM problem must never fail the form.
  await recordWitContributor({
    fullName,
    email,
    role,
    profile,
    message,
    interests,
  });

  return Response.json({ success: true });
}
