import { getResendClient, escapeHtml } from "@/lib/email";
import { saveApplication, DuplicateRegistrationError } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_BYTES = 4 * 1024 * 1024; // keep under Vercel's serverless request body limit
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = formData.get("fullName");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const linkedin = formData.get("linkedin");
  const location = formData.get("location");
  const solutionArea = formData.get("solutionArea");
  const certifications = formData.get("certifications");
  const availability = formData.get("availability");
  const resume = formData.get("resume");

  if (
    typeof fullName !== "string" ||
    !fullName.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof phone !== "string" ||
    !phone.trim()
  ) {
    return Response.json(
      { error: "Full name, email, and phone number are required." },
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
      { error: "Please upload your resume/CV or portfolio." },
      { status: 400 },
    );
  }

  if (!ALLOWED_FILE_TYPES.includes(resume.type)) {
    return Response.json(
      { error: "Resume must be a PDF or DOCX file." },
      { status: 400 },
    );
  }

  if (resume.size > MAX_FILE_BYTES) {
    return Response.json(
      { error: "Resume file is too large. Max size is 4MB." },
      { status: 400 },
    );
  }

  const asString = (v: FormDataEntryValue | null) =>
    typeof v === "string" && v.trim() ? v.trim() : null;

  // Durable record first — Supabase is the source of truth.
  try {
    await saveApplication(
      {
        vendor: "microsoft",
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        linkedin: asString(linkedin),
        location: asString(location),
        solutionArea: asString(solutionArea),
        certifications: asString(certifications),
        availability: asString(availability),
      },
      resume,
    );
  } catch (err) {
    if (err instanceof DuplicateRegistrationError) {
      return Response.json({ error: err.message }, { status: 409 });
    }
    console.error("Microsoft application persist failed:", err);
    return Response.json(
      { error: "Failed to submit your application. Please try again." },
      { status: 500 },
    );
  }

  const attachmentContent = Buffer.from(await resume.arrayBuffer()).toString(
    "base64",
  );

  const detailRows = [
    ["Phone", phone],
    ["LinkedIn", linkedin],
    ["Location", location],
    ["Solution Area", solutionArea],
    ["Certifications", certifications],
    ["Weekly Availability", availability],
  ]
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">${label}</td><td>${escapeHtml(
          (value as string).trim(),
        )}</td></tr>`,
    )
    .join("");

  try {
    const { error } = await getResendClient().emails.send({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: email.trim(),
      subject: `New Microsoft Community application — ${fullName.trim()}`,
      html: `
        <h2>New Microsoft Professionals Community application</h2>
        <table cellspacing="0" cellpadding="0">
          <tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">Name</td><td>${escapeHtml(fullName.trim())}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">Email</td><td>${escapeHtml(email.trim())}</td></tr>
          ${detailRows}
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
      // Record already saved; failed notification must not fail the request.
      console.error(
        "Resend error (notification only):",
        error.name,
        error.message,
      );
    }
  } catch (err) {
    console.error("Microsoft notification email failed (record saved):", err);
  }

  return Response.json({ success: true });
}
