import "server-only";
import { siteConfig } from "@/config/site";
import { greetingFor, type EmailContent } from "@/lib/email-template";

/**
 * Copy for the account emails: password reset and the profile reminders ops
 * send. (Sign-up confirmation lives in confirmation-email.ts, the migrated
 * member claim email in migration.ts.) Each returns a subject plus template
 * content for emailPayload() / sendEmail().
 */

type Email = { subject: string; content: EmailContent };

const PRODUCT = { eten: "ETEN", mentorship: "ETEN Mentorship" } as const;

export function resetPasswordEmail(
  product: keyof typeof PRODUCT,
  fullName: unknown,
  email: string,
  url: string,
): Email {
  const name = PRODUCT[product];
  return {
    subject: `Reset your ${name} password`,
    content: {
      brand: product,
      preview: "Choose a new password. The link works once.",
      greeting: greetingFor(typeof fullName === "string" ? fullName : null),
      paragraphs: [
        `We received a request to reset the password for your ${name} account (${email}). Use the button below to choose a new one.`,
      ],
      cta: { label: "Choose a new password", url },
      showLink: true,
      smallPrint: [
        "For your security, this link works once and expires after a short time. If it has expired, request a new one from the sign-in page.",
        "Didn't ask for this? You can ignore this email. Your password won't change unless you use this link.",
      ],
      reason:
        "You're receiving this because a password reset was requested for this address.",
    },
  };
}

const DOCUMENT_LABEL: Record<string, string> = {
  identity: "Identity verification (KYC)",
  address: "Proof of address",
  certification: "A professional certification",
};

/** Reminder for members with outstanding verification documents. */
export function documentReminderEmail(
  fullName: string | null,
  kinds: string[],
): Email {
  const n = kinds.length;
  const needsVerification =
    kinds.includes("identity") || kinds.includes("address");
  const certsUrl = `${siteConfig.url}/profile/certifications`;
  return {
    subject: `${n} item${n === 1 ? "" : "s"} left to complete your ETEN profile`,
    content: {
      brand: "eten",
      preview: "Finish these so we can verify your membership.",
      greeting: greetingFor(fullName),
      paragraphs: [
        "Your ETEN profile is almost complete. Once these are in, we can verify your membership and you get the full benefits of being a member.",
      ],
      list: {
        title: "Still needed:",
        items: kinds.map((k) => DOCUMENT_LABEL[k] ?? k),
      },
      cta: needsVerification
        ? {
            label: "Verify identity and address",
            url: `${siteConfig.url}/profile/verification`,
          }
        : { label: "Add a certification", url: certsUrl },
      smallPrint: [
        ...(needsVerification && kinds.includes("certification")
          ? [`Add your certification from your profile: ${certsUrl}`]
          : []),
        "Already sent these? No action is needed.",
      ],
      reason: "You're receiving this because you're an ETEN member.",
    },
  };
}

/** Reminder for members who haven't finished the compulsory details step. */
export function detailsReminderEmail(
  fullName: string,
  missing: string[],
  url: string,
): Email {
  return {
    subject: "Please add your missing ETEN details",
    content: {
      brand: "eten",
      preview: `Still needed: ${missing.join(", ")}. It takes about two minutes.`,
      greeting: greetingFor(fullName),
      paragraphs: [
        "Your Pod Leader uses your contact details and CV to reach you and put you forward for client work and opportunities. ETEN now asks for these before you can continue.",
      ],
      list: { title: "Still needed:", items: missing },
      cta: { label: "Complete my details", url },
      smallPrint: ["It takes about two minutes."],
      reason: "You're receiving this because you're an ETEN member.",
    },
  };
}
