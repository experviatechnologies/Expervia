import "server-only";
import { getResendClient, escapeHtml } from "@/lib/email";
import { siteConfig } from "@/config/site";

/**
 * The one layout every member-facing email uses, so they all look and read
 * the same. Each email is built from plain content (greeting, paragraphs, an
 * optional details box or list, one button, small print) and comes back as
 * HTML, a matching plain-text version and inbox preview text.
 *
 * Built for inbox placement as well as looks: a hand-written text part, a
 * Reply-To a person reads, no images or tracking, a short footer that says
 * who sent it and why, and a table layout that holds up in Outlook.
 */

export type EmailBrand = "eten" | "mentorship" | "tracker";

const BRAND_NAME: Record<EmailBrand, string> = {
  eten: "ETEN",
  mentorship: "ETEN Mentorship",
  tracker: "ETEN Availability Tracker",
};

const C = {
  brand: "#4a16c4",
  ink: "#17123d",
  muted: "#5e5a7d",
  faint: "#8a87a3",
  line: "#e7e4f2",
  panel: "#f7f5fd",
  page: "#f4f3f8",
};

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type EmailContent = {
  brand?: EmailBrand;
  /** Inbox preview line shown after the subject. Should add to it, not repeat it. */
  preview: string;
  /** Optional bold title above the message (internal notices). */
  heading?: string;
  /** Usually "Hi Ada,". Built from a full name with greetingFor(). */
  greeting?: string;
  /** Main message, one string per paragraph. */
  paragraphs: string[];
  /** A one-time code, shown large so it is easy to read and type. */
  code?: string;
  /** Key facts in a shaded box (who, when, how much). */
  details?: { label: string; value: string }[];
  /** A short list, with an optional line above it. */
  list?: { title?: string; items: string[] };
  /** The one main action. */
  cta?: { label: string; url: string };
  /** Show the button's link as text too (for sign-in and confirm links). */
  showLink?: boolean;
  /** Smaller grey lines under the button: expiry, "didn't ask for this?". */
  smallPrint?: string[];
  /** Why they got this email, shown in the footer. */
  reason: string;
  /**
   * Broadcasts only: the unsubscribe page link (footer) and the one-click
   * endpoint (List-Unsubscribe header). Account and session emails omit it.
   */
  unsubscribe?: { pageUrl: string; oneClickUrl: string };
};

/** "Hi Ada," from a full name, or "Hi," when there isn't one. */
export function greetingFor(fullName?: string | null): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  return first ? `Hi ${first},` : "Hi,";
}

const SITE_LABEL = siteConfig.url.replace(/^https?:\/\//, "");

export function renderEmail(content: EmailContent): {
  html: string;
  text: string;
} {
  const brand = BRAND_NAME[content.brand ?? "eten"];
  const p = (s: string, extra = "") =>
    `<p style="margin:0 0 16px;white-space:pre-line;${extra}">${escapeHtml(s)}</p>`;

  const details = content.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;background:${C.panel};border-radius:10px;">
        <tr><td style="padding:14px 18px;">
          ${content.details
            .map(
              (d) =>
                `<p style="margin:4px 0;font-size:14px;"><span style="color:${C.muted};">${escapeHtml(d.label)}:</span> <strong>${escapeHtml(d.value)}</strong></p>`,
            )
            .join("")}
        </td></tr>
      </table>`
    : "";

  const list = content.list?.items.length
    ? `${content.list.title ? p(content.list.title, "margin-bottom:8px;") : ""}
       <ul style="margin:0 0 20px;padding-left:20px;">
         ${content.list.items.map((i) => `<li style="margin:0 0 6px;">${escapeHtml(i)}</li>`).join("")}
       </ul>`
    : "";

  const url = content.cta ? escapeHtml(content.cta.url) : "";
  const button = content.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
        <tr><td style="background:${C.brand};border-radius:8px;">
          <a href="${url}" style="display:inline-block;padding:13px 24px;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;">${escapeHtml(content.cta.label)}</a>
        </td></tr>
      </table>
      ${
        content.showLink
          ? `<p style="margin:0 0 4px;font-size:13px;color:${C.muted};">Button not working? Copy this link into your browser:</p>
             <p style="margin:0 0 20px;font-size:13px;word-break:break-all;"><a href="${url}" style="color:${C.brand};">${url}</a></p>`
          : ""
      }`
    : "";

  const small = (content.smallPrint ?? [])
    .map((s) => p(s, `font-size:13px;color:${C.muted};margin-bottom:10px;`))
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(brand)}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(content.preview)}${"&#847;&zwnj;&nbsp;".repeat(60)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${C.line};border-radius:14px;">
      <tr><td style="padding:22px 28px;border-bottom:1px solid ${C.line};font-family:${FONT};">
        <span style="font-size:17px;font-weight:700;color:${C.brand};letter-spacing:.02em;">${escapeHtml(brand)}</span>
        <span style="font-size:13px;color:${C.faint};">&nbsp;by Expervia</span>
      </td></tr>
      <tr><td style="padding:28px 28px 12px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.ink};">
        ${content.heading ? `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${C.ink};">${escapeHtml(content.heading)}</h1>` : ""}
        ${content.greeting ? p(content.greeting) : ""}
        ${content.paragraphs.map((s) => p(s)).join("")}
        ${
          content.code
            ? `<p style="margin:4px 0 22px;padding:16px 0;background:${C.panel};border-radius:10px;text-align:center;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:.3em;color:${C.ink};">${escapeHtml(content.code)}</p>`
            : ""
        }${details}${list}${button}${small}
      </td></tr>
      <tr><td style="padding:16px 28px 22px;border-top:1px solid ${C.line};font-family:${FONT};font-size:12px;line-height:1.6;color:${C.faint};">
        <p style="margin:0 0 6px;">${escapeHtml(content.reason)} Questions? Just reply to this email.</p>
        <p style="margin:0;">Expervia Technologies · <a href="${siteConfig.url}" style="color:${C.faint};">${escapeHtml(SITE_LABEL)}</a>${
          content.unsubscribe
            ? ` · <a href="${escapeHtml(content.unsubscribe.pageUrl)}" style="color:${C.faint};">Unsubscribe</a>`
            : ""
        }</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    content.heading,
    content.heading ? "" : null,
    content.greeting,
    content.greeting ? "" : null,
    ...content.paragraphs.flatMap((s) => [s, ""]),
    ...(content.code ? [content.code, ""] : []),
    ...(content.details?.length
      ? [...content.details.map((d) => `${d.label}: ${d.value}`), ""]
      : []),
    ...(content.list?.items.length
      ? [
          ...(content.list.title ? [content.list.title] : []),
          ...content.list.items.map((i) => `- ${i}`),
          "",
        ]
      : []),
    ...(content.cta ? [`${content.cta.label}:`, content.cta.url, ""] : []),
    ...(content.smallPrint ?? []).flatMap((s) => [s, ""]),
    "--",
    `${content.reason} Questions? Just reply to this email.`,
    `Expervia Technologies · ${siteConfig.url}`,
    ...(content.unsubscribe
      ? [`Unsubscribe from these emails: ${content.unsubscribe.pageUrl}`]
      : []),
  ]
    .filter((l) => l !== null && l !== undefined)
    .join("\n");

  return { html, text };
}

/** Reply-To for member emails: the team inbox, when configured. */
export function replyToHeader(): { replyTo?: string } {
  const replyTo = process.env.CONTACT_TO_EMAIL?.trim();
  return replyTo ? { replyTo } : {};
}

/**
 * Everything Resend needs for one email (from, to, subject, html, text,
 * Reply-To). Use it directly with resend.batch.send, or via sendEmail().
 */
export function emailPayload(params: {
  from: string;
  to: string;
  subject: string;
  content: EmailContent;
}) {
  const { html, text } = renderEmail(params.content);
  return {
    from: params.from,
    to: params.to,
    subject: params.subject,
    html,
    text,
    ...replyToHeader(),
    // One-click unsubscribe (RFC 8058), required by Gmail and Yahoo for bulk mail.
    ...(params.content.unsubscribe
      ? {
          headers: {
            "List-Unsubscribe": `<${params.content.unsubscribe.oneClickUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }
      : {}),
  };
}

/** Send one email. Returns an error message, or null when sent. Never throws. */
export async function sendEmail(params: {
  to: string;
  subject: string;
  content: EmailContent;
}): Promise<string | null> {
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!from) return "Email isn't configured.";
  try {
    const { error } = await getResendClient().emails.send(
      emailPayload({ from, ...params }),
    );
    return error ? error.message : null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}
