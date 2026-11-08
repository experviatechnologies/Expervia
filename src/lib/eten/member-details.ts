/**
 * The details every ETEN member must give before using the app (7 Nov 2026):
 * full name, phone, location, job title, years of experience, a CV and
 * consent to share them with their Pod Leaders and ETEN staff.
 * Pure helpers: safe for client and server.
 */

export type DetailKey =
  | "fullName"
  | "phone"
  | "location"
  | "jobTitle"
  | "yearsExperience"
  | "cv"
  | "consent";

export const DETAIL_LABEL: Record<DetailKey, string> = {
  fullName: "Full name",
  phone: "Phone number",
  location: "Location",
  jobTitle: "Job title",
  yearsExperience: "Years of experience",
  cv: "CV",
  consent: "Consent to share your details",
};

export type DetailsSnapshot = {
  fullName: string | null;
  phone: string | null;
  location: string | null;
  jobTitle: string | null;
  yearsExperience: number | null;
  hasCv: boolean;
  consentAt: string | null;
};

export function missingDetails(d: DetailsSnapshot): DetailKey[] {
  const out: DetailKey[] = [];
  if (!d.fullName?.trim()) out.push("fullName");
  if (!d.phone?.trim()) out.push("phone");
  if (!d.location?.trim()) out.push("location");
  if (!d.jobTitle?.trim()) out.push("jobTitle");
  if (d.yearsExperience === null || d.yearsExperience === undefined)
    out.push("yearsExperience");
  if (!d.hasCv) out.push("cv");
  if (!d.consentAt) out.push("consent");
  return out;
}

/**
 * A phone number in international form (+234 803 123 4567 -> +2348031234567).
 * A Nigerian local number (0803...) becomes +234... Null when it isn't a
 * plausible number (8 to 15 digits after the country code, per E.164).
 */
export function normalizePhone(raw: string): string | null {
  const cleaned = raw.trim().replace(/[\s().-]/g, "");
  let digits: string;
  if (cleaned.startsWith("+")) digits = cleaned.slice(1);
  else if (cleaned.startsWith("00")) digits = cleaned.slice(2);
  else if (/^0\d{10}$/.test(cleaned)) digits = `234${cleaned.slice(1)}`;
  else digits = cleaned;
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return `+${digits}`;
}

/** A LinkedIn profile URL, or null when it isn't one. Empty input = "". */
export function normalizeLinkedIn(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "";
  try {
    const url = new URL(v.startsWith("http") ? v : `https://${v}`);
    if (!/(^|\.)linkedin\.com$/i.test(url.hostname)) return null;
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

export const CV_MAX_BYTES = 5 * 1024 * 1024;

/** PDF, Word (.docx) or old Word (.doc), judged by the file's first bytes. */
export function cvKind(bytes: Uint8Array): "pdf" | "docx" | "doc" | null {
  const b = bytes;
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46)
    return "pdf"; // %PDF
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04)
    return "docx"; // PK zip
  if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0)
    return "doc"; // OLE
  return null;
}

export const CV_CONTENT_TYPE = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
} as const;
