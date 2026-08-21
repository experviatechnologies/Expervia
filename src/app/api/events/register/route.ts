import { getResendClient, escapeHtml } from "@/lib/email";
import {
  saveEventRegistration,
  DuplicateRegistrationError,
} from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegistrationPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  jobTitle?: string;
  organization?: string;
  areaOfExpertise?: string;
  membershipStatus?: string;
  heardFrom?: string[];
  learningGoals?: string;
  consent?: boolean;
};

export async function POST(request: Request) {
  let body: Partial<RegistrationPayload>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    country,
    city,
    jobTitle,
    organization,
    areaOfExpertise,
    membershipStatus,
    heardFrom,
    learningGoals,
    consent,
  } = body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return Response.json(
      { error: "First name, last name, and email are required." },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(email.trim())) {
    return Response.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  const heardFromList = Array.isArray(heardFrom)
    ? heardFrom.filter((h): h is string => typeof h === "string").join(", ")
    : null;

  // Durable record first — Supabase is the source of truth. If this fails we
  // stop and surface an error so the registrant can retry.
  try {
    await saveEventRegistration({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      country: country?.trim() || null,
      city: city?.trim() || null,
      jobTitle: jobTitle?.trim() || null,
      organization: organization?.trim() || null,
      areaOfExpertise: areaOfExpertise?.trim() || null,
      membershipStatus: membershipStatus?.trim() || null,
      heardFrom: heardFromList,
      learningGoals: learningGoals?.trim() || null,
      consent: Boolean(consent),
    });
  } catch (err) {
    if (err instanceof DuplicateRegistrationError) {
      return Response.json({ error: err.message }, { status: 409 });
    }
    console.error("Event registration persist failed:", err);
    return Response.json(
      { error: "Failed to register. Please try again." },
      { status: 500 },
    );
  }

  const detailRows = [
    ["Phone / WhatsApp", phone],
    ["Country", country],
    ["City", city],
    ["Job Title", jobTitle],
    ["Organization", organization],
    ["Area of Expertise", areaOfExpertise],
    ["ETEN Membership", membershipStatus],
    ["Heard About Us Via", heardFromList],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">${label}</td><td>${escapeHtml(
          value as string,
        )}</td></tr>`,
    )
    .join("");

  const goalsBlock = learningGoals?.trim()
    ? `<p style="margin-top:16px;"><strong>What they hope to learn</strong></p>
       <p style="white-space:pre-wrap;">${escapeHtml(learningGoals.trim())}</p>`
    : "";

  // The notification email is best-effort: the record is already saved, so a
  // failed email must not fail the request (that would prompt a duplicate).
  try {
    const { error } = await getResendClient().emails.send({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: email.trim(),
      subject: `New ETEN Event Registration — ${firstName.trim()} ${lastName.trim()}`,
      html: `
        <h2>New ETEN event registration</h2>
        <table cellspacing="0" cellpadding="0">
          <tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">Name</td><td>${escapeHtml(
            `${firstName.trim()} ${lastName.trim()}`,
          )}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#8a8a8a;">Email</td><td>${escapeHtml(email.trim())}</td></tr>
          ${detailRows}
        </table>
        ${goalsBlock}
      `,
    });

    if (error) {
      console.error(
        "Resend error (notification only):",
        error.name,
        error.message,
      );
    }
  } catch (err) {
    console.error("Event registration email failed (record saved):", err);
  }

  return Response.json({ success: true });
}
