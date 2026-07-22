import { getResendClient, escapeHtml } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_BYTES = 4 * 1024 * 1024; // keep under Vercel's serverless request body limit
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = formData.get("fullName");
  const email = formData.get("email");
  const solutionArea = formData.get("solutionArea");
  const certifications = formData.getAll("certifications");
  const resume = formData.get("resume");

  if (
    typeof fullName !== "string" ||
    !fullName.trim() ||
    typeof email !== "string" ||
    !email.trim()
  ) {
    return Response.json(
      { error: "Full name and email are required." },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(email.trim())) {
    return Response.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  if (!(resume instanceof File) || resume.size === 0) {
    return Response.json(
      { error: "Please upload your resume & certifications." },
      { status: 400 },
    );
  }

  if (!ALLOWED_FILE_TYPES.includes(resume.type)) {
    return Response.json(
      { error: "Resume must be a PDF, JPG, or PNG file." },
      { status: 400 },
    );
  }

  if (resume.size > MAX_FILE_BYTES) {
    return Response.json(
      { error: "Resume file is too large. Max size is 4MB." },
      { status: 400 },
    );
  }

  const attachmentContent = Buffer.from(await resume.arrayBuffer()).toString(
    "base64",
  );

  const certRows = certifications.length
    ? `<tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">Certifications</td><td>${escapeHtml(
        certifications.join(", "),
      )}</td></tr>`
    : "";

  try {
    const { error } = await getResendClient().emails.send({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: email.trim(),
      subject: `New Huawei Community application — ${fullName.trim()}`,
      html: `
        <h2>New Huawei Professionals Community application</h2>
        <table cellspacing="0" cellpadding="0">
          <tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">Name</td><td>${escapeHtml(fullName.trim())}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">Email</td><td>${escapeHtml(email.trim())}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">Solution Area</td><td>${escapeHtml(
            typeof solutionArea === "string" ? solutionArea : "—",
          )}</td></tr>
          ${certRows}
        </table>
      `,
      attachments: [
        {
          filename: resume.name,
          content: attachmentContent,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error.name, error.message);
      return Response.json(
        { error: "Failed to submit your application. Please try again." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("Huawei community application send failed:", err);
    return Response.json(
      { error: "Failed to submit your application. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({ success: true });
}
