import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/config/site";
import { getSupabaseAdmin } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetch-all";
import { greetingFor, type EmailContent } from "@/lib/email-template";
import {
  loadUnsubscribed,
  unsubscribeOneClickUrl,
  unsubscribePageUrl,
} from "@/lib/email-unsubscribe";

/**
 * Activation emails for accounts that were created for people (CRM import,
 * earlier migration) and never activated.
 *
 * The email links to /auth/activate?t=<token>. The token is signed here and
 * valid for 14 days; only when it is opened does the server ask Supabase for
 * a fresh one-time link (which expires quickly), so a person who opens the
 * email days later still gets in. Once the account is activated, the link
 * just sends them to sign in.
 */

export const ACTIVATION_DAYS = 14;
export const BATCH_SIZE = 50;

function secret(): string {
  const s =
    process.env.ACTIVATION_LINK_SECRET ??
    process.env.EMAIL_UNSUBSCRIBE_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("No secret for activation links.");
  return s;
}

function sign(memberId: string, exp: number): string {
  return createHmac("sha256", secret())
    .update(`activate:${memberId}:${exp}`)
    .digest("base64url")
    .slice(0, 43);
}

export function activationToken(memberId: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + ACTIVATION_DAYS * 86_400;
  return `${memberId}.${exp}.${sign(memberId, exp)}`;
}

/** The member id if the token is genuine and not expired, else null. */
export function verifyActivationToken(token: string | null): string | null {
  if (!token) return null;
  const [memberId, expText, sig] = token.split(".");
  const exp = Number(expText);
  if (!memberId || !Number.isFinite(exp) || !sig) return null;
  if (exp * 1000 < Date.now()) return null;
  const expected = Buffer.from(sign(memberId, exp));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }
  return memberId;
}

export function activationUrl(memberId: string): string {
  return `${siteConfig.url}/auth/activate?t=${encodeURIComponent(activationToken(memberId))}`;
}

export type EmailVersion = "ad_lead" | "registry" | "general";

/**
 * Which wording fits how we got them. Only people from the mentorship ad
 * form (tag "Mentorship lead") get the mentorship version; the Microsoft
 * expert network form and the registry get the registry version.
 */
export function versionFor(
  source: string | null,
  tags: string[],
): EmailVersion {
  if (tags.includes("Mentorship lead")) return "ad_lead";
  const s = (source ?? "").toLowerCase();
  if (
    tags.includes("FB/IG ETEN prospect") ||
    s.includes("registration") ||
    s.includes("registry") ||
    s.includes("certification")
  ) {
    return "registry";
  }
  return "general";
}

export const VERSION_LABEL: Record<EmailVersion, string> = {
  ad_lead: "Mentorship ad leads",
  registry: "ETEN registry and expert network form",
  general: "Everyone else",
};

/** The activation email for one person. */
export function activationEmail(
  fullName: string | null,
  email: string,
  url: string,
  version: EmailVersion,
): { subject: string; content: EmailContent } {
  const why: Record<EmailVersion, string> = {
    ad_lead:
      "You recently asked about mentorship with ETEN (the Expervia Technology Experts Network) through our Facebook or Instagram form, so we've set up a free ETEN account for you.",
    registry:
      "You registered with the ETEN expert network (Expervia Technology Experts Network), so we've set up your account with the details you gave us.",
    general:
      "We've set up your ETEN account (Expervia Technology Experts Network) with the details you gave us.",
  };
  return {
    subject:
      version === "ad_lead"
        ? "Your free ETEN mentorship account is ready"
        : "Your ETEN account is ready",
    content: {
      brand: "eten",
      preview: "Set a password to sign in. It takes about a minute.",
      greeting: greetingFor(fullName),
      paragraphs: [
        why[version],
        version === "ad_lead"
          ? "With it you can find a mentor, book sessions, join a specialist pod and meet other people building careers in tech."
          : "With it you can join specialist pods, find mentors and hear about opportunities first.",
        "Set a password to sign in, then check your profile. It takes about a minute.",
      ],
      cta: { label: "Activate my account", url },
      showLink: true,
      smallPrint: [
        `This link works for ${ACTIVATION_DAYS} days. After that, choose "Forgot password" on the sign-in page with this email address.`,
        "Didn't ask for this? You can ignore this email and the account will stay inactive.",
      ],
      reason:
        version === "ad_lead"
          ? "You're receiving this because you asked about ETEN mentorship."
          : "You're receiving this because you registered with Expervia.",
      unsubscribe: {
        pageUrl: unsubscribePageUrl(email),
        oneClickUrl: unsubscribeOneClickUrl(email),
      },
    },
  };
}

// ------------------------------------------------------------- candidates
export type Candidate = {
  memberId: string;
  contactId: string;
  name: string;
  email: string;
  source: string | null;
  version: EmailVersion;
  lastSentAt: string | null;
  timesSent: number;
};

type MemberRow = { id: string; created_at: string };
type ContactRow = {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  source: string | null;
  tags: string[] | null;
};

/**
 * Everyone with an account that was never activated (staff logins and
 * suspended accounts left out), with how often they've been emailed.
 * People who unsubscribed are left out.
 */
export async function activationCandidates(): Promise<{
  candidates: Candidate[];
  unsubscribed: number;
}> {
  const admin = getSupabaseAdmin();
  const [members, contacts, sends, unsubscribed] = await Promise.all([
    fetchAllRows<MemberRow>((a, b) =>
      admin
        .from("members")
        .select("id, created_at")
        .is("claimed_at", null)
        .eq("status", "active")
        .neq("role", "operations")
        .order("id")
        .range(a, b),
    ),
    fetchAllRows<ContactRow>((a, b) =>
      admin
        .from("crm_contacts")
        .select("id, member_id, first_name, last_name, email, source, tags")
        .not("member_id", "is", null)
        .order("id")
        .range(a, b),
    ),
    fetchAllRows<{ contact_id: string; occurred_at: string }>((a, b) =>
      admin
        .from("crm_activities")
        .select("contact_id, occurred_at")
        .eq("event", "activation_email_sent")
        .order("id")
        .range(a, b),
    ),
    loadUnsubscribed(),
  ]);
  if (members.error) throw new Error(members.error.message);
  if (contacts.error) throw new Error(contacts.error.message);

  const byMember = new Map(contacts.data.map((c) => [c.member_id, c]));
  const sent = new Map<string, { last: string; n: number }>();
  for (const s of sends.data ?? []) {
    const cur = sent.get(s.contact_id);
    sent.set(s.contact_id, {
      last: !cur || s.occurred_at > cur.last ? s.occurred_at : cur.last,
      n: (cur?.n ?? 0) + 1,
    });
  }

  let skipped = 0;
  const candidates: Candidate[] = [];
  for (const m of members.data) {
    const c = byMember.get(m.id);
    if (!c?.email) continue;
    if (unsubscribed.has(c.email.toLowerCase())) {
      skipped += 1;
      continue;
    }
    const s = sent.get(c.id);
    candidates.push({
      memberId: m.id,
      contactId: c.id,
      name: `${c.first_name} ${c.last_name}`.trim(),
      email: c.email,
      source: c.source,
      version: versionFor(c.source, c.tags ?? []),
      lastSentAt: s?.last ?? null,
      timesSent: s?.n ?? 0,
    });
  }
  // Never emailed first, then the longest since the last email.
  candidates.sort(
    (a, b) =>
      (a.lastSentAt ?? "").localeCompare(b.lastSentAt ?? "") ||
      a.email.localeCompare(b.email),
  );
  return { candidates, unsubscribed: skipped };
}

/** How many emailed people have since activated (the email working). */
export async function activatedAfterEmail(): Promise<number> {
  const admin = getSupabaseAdmin();
  const sends = await fetchAllRows<{ contact_id: string }>((a, b) =>
    admin
      .from("crm_activities")
      .select("contact_id")
      .eq("event", "activation_email_sent")
      .order("id")
      .range(a, b),
  );
  const ids = [...new Set((sends.data ?? []).map((s) => s.contact_id))];
  if (ids.length === 0) return 0;
  let activated = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await admin
      .from("crm_contacts")
      .select("id, account:members!crm_contacts_member_id_fkey(claimed_at)")
      .in("id", ids.slice(i, i + 200));
    for (const c of data ?? []) {
      const acc = Array.isArray(c.account) ? c.account[0] : c.account;
      if ((acc as { claimed_at: string | null } | null)?.claimed_at)
        activated += 1;
    }
  }
  return activated;
}

export type Group = EmailVersion | "all";
export type Mode = "first" | "reminder";
export const REMINDER_AFTER_DAYS = 7;

/**
 * Who a batch goes to: "first" = never emailed; "reminder" = emailed, still
 * not activated, and the last email was at least 7 days ago.
 */
export function pickBatch<
  T extends {
    version: EmailVersion;
    lastSentAt: string | null;
    timesSent: number;
  },
>(all: T[], group: Group, mode: Mode): T[] {
  const cutoff = Date.now() - REMINDER_AFTER_DAYS * 86_400_000;
  return all.filter(
    (c) =>
      (group === "all" || c.version === group) &&
      (mode === "first"
        ? c.timesSent === 0
        : c.timesSent > 0 &&
          c.lastSentAt !== null &&
          Date.parse(c.lastSentAt) < cutoff),
  );
}
