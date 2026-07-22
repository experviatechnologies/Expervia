import { getResendClient, escapeHtml } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  fullName: string;
  email: string;
  organization: string;
  jobTitle?: string;
  industry?: string;
  service?: string;
  budget?: string;
  timeline?: string;
  message: string;
};

export async function POST(request: Request) {
  let body: Partial<ContactPayload>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    fullName,
    email,
    organization,
    jobTitle,
    industry,
    service,
    budget,
    timeline,
    message,
  } = body;

  if (
    !fullName?.trim() ||
    !email?.trim() ||
    !organization?.trim() ||
    !message?.trim()
  ) {
    return Response.json(
      { error: "Full name, email, organization, and message are required." },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(email.trim())) {
    return Response.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  const detailRows = [
    ["Organization", organization],
    ["Job Title", jobTitle],
    ["Industry", industry],
    ["Service of Interest", service],
    ["Project Budget", budget],
    ["Timeline", timeline],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">${label}</td><td>${escapeHtml(
          value as string,
        )}</td></tr>`,
    )
    .join("");

  try {
    const { error } = await getResendClient().emails.send({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: email.trim(),
      subject: `New contact form inquiry from ${fullName.trim()}`,
      html: `
        <h2>New inquiry from the Expervia website</h2>
        <table cellspacing="0" cellpadding="0">
          <tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">Name</td><td>${escapeHtml(fullName.trim())}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">Email</td><td>${escapeHtml(email.trim())}</td></tr>
          ${detailRows}
        </table>
        <p style="margin-top:16px;white-space:pre-wrap;">${escapeHtml(message.trim())}</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error.name, error.message);
      return Response.json(
        { error: "Failed to send your message. Please try again." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("Contact form send failed:", err);
    return Response.json(
      { error: "Failed to send your message. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({ success: true });
}
