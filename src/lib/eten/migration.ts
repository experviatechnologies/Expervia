import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resend } from "resend";
import { escapeHtml } from "@/lib/email";

/**
 * ETEN existing-member migration (roadmap M0.2).
 *
 * Turns the people already in `community_applications` + `event_registrations`
 * into pre-provisioned, unclaimed ETEN accounts and emails each a secure invite
 * link to claim it. Everything here is service_role + ops-gated (the calling
 * route verifies operations).
 *
 * Safety model:
 *   - dry-run  : reads only. Reports who WOULD be invited. No writes, no email.
 *   - test     : provisions + invites ONLY the explicitly listed addresses.
 *   - send     : provisions + invites everyone eligible, in bounded batches.
 * Idempotent: anyone who already has an auth account is skipped, so a send can
 * be re-run safely and simply continues where it left off.
 */

export type MigrationMode = "dry-run" | "test" | "send";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** Max accounts provisioned per send/test invocation (keeps us under timeouts). */
export const BATCH_LIMIT = 50;

type ApplicationRow = {
  full_name: string | null;
  email: string | null;
  location: string | null;
  solution_area: string | null;
  availability: string | null;
  resume_path: string | null;
};

type EventRow = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  job_title: string | null;
  area_of_expertise: string | null;
  membership_status: string | null;
};

export type Candidate = {
  email: string;
  fullName: string | null;
  location: string | null;
  jobTitle: string | null;
  industryExperience: string | null;
  availabilityStatus: string | null;
  /** Object path in the private `resumes` bucket, from their application (if any). */
  resumePath: string | null;
  fromApplication: boolean;
  fromEvent: boolean;
};

export type MigrationReport = {
  mode: MigrationMode;
  counts: {
    applications: number;
    events: number;
    uniqueEmails: number;
    eligible: number;
    alreadyClaimed: number; // eligible but an auth account already exists
    toInvite: number; // eligible, no account yet
    excludedMembershipNo: number;
    excludedUnclear: number;
    invalidEmail: number;
  };
  toInvite: { email: string; fullName: string | null }[];
  excludedSamples: {
    membershipNo: string[];
    unclear: string[];
    invalidEmail: string[];
  };
  processed?: { email: string; status: "invited" | "failed"; error?: string }[];
  remaining?: number;
};

function norm(email: string | null | undefined): string | null {
  const e = (email ?? "").trim().toLowerCase();
  return e || null;
}

function firstNonEmpty(...vals: (string | null | undefined)[]): string | null {
  for (const v of vals) {
    const t = (v ?? "").trim();
    if (t) return t;
  }
  return null;
}

/** Event membership intent. Only an explicit "no" excludes an event-only person. */
function membershipDisposition(
  status: string | null,
): "yes" | "no" | "unclear" {
  const s = (status ?? "").trim().toLowerCase();
  if (!s) return "unclear";
  if (["no", "not interested", "none", "false"].includes(s)) return "no";
  return "yes";
}

/**
 * Read both source tables, dedupe by normalised email, merge fields, and
 * classify eligibility. Pure read — no writes.
 */
export async function buildCandidates(admin: SupabaseClient): Promise<{
  candidates: Candidate[];
  counts: MigrationReport["counts"];
  excludedSamples: MigrationReport["excludedSamples"];
}> {
  const [{ data: apps }, { data: events }] = await Promise.all([
    admin
      .from("community_applications")
      .select(
        "full_name, email, location, solution_area, availability, resume_path",
      ),
    admin
      .from("event_registrations")
      .select(
        "first_name, last_name, email, country, city, job_title, area_of_expertise, membership_status",
      ),
  ]);

  const applications = (apps ?? []) as ApplicationRow[];
  const eventRows = (events ?? []) as EventRow[];

  const invalidEmail: string[] = [];
  const membershipNo: string[] = [];
  const unclear: string[] = [];

  // email -> merged candidate
  const byEmail = new Map<string, Candidate>();

  for (const a of applications) {
    const email = norm(a.email);
    if (!email) continue;
    if (!EMAIL_RE.test(email)) {
      invalidEmail.push(email);
      continue;
    }
    const existing = byEmail.get(email);
    const merged: Candidate = {
      email,
      fullName: firstNonEmpty(existing?.fullName, a.full_name),
      location: firstNonEmpty(existing?.location, a.location),
      jobTitle: existing?.jobTitle ?? null,
      industryExperience: firstNonEmpty(
        existing?.industryExperience,
        a.solution_area,
      ),
      availabilityStatus: firstNonEmpty(
        existing?.availabilityStatus,
        a.availability,
      ),
      resumePath: firstNonEmpty(existing?.resumePath, a.resume_path),
      fromApplication: true,
      fromEvent: existing?.fromEvent ?? false,
    };
    byEmail.set(email, merged);
  }

  for (const e of eventRows) {
    const email = norm(e.email);
    if (!email) continue;
    if (!EMAIL_RE.test(email)) {
      invalidEmail.push(email);
      continue;
    }
    const existing = byEmail.get(email);
    // An applicant is always eligible; an event-only person needs intent.
    if (!existing) {
      const disp = membershipDisposition(e.membership_status);
      if (disp === "no") {
        membershipNo.push(email);
        continue;
      }
      if (disp === "unclear") {
        unclear.push(email);
        continue;
      }
    }
    const eventName = firstNonEmpty(
      [e.first_name, e.last_name].filter(Boolean).join(" "),
    );
    const eventLocation = firstNonEmpty(
      [e.city, e.country].filter(Boolean).join(", "),
    );
    const merged: Candidate = {
      email,
      fullName: firstNonEmpty(existing?.fullName, eventName),
      location: firstNonEmpty(existing?.location, eventLocation),
      jobTitle: firstNonEmpty(existing?.jobTitle, e.job_title),
      industryExperience: firstNonEmpty(
        existing?.industryExperience,
        e.area_of_expertise,
      ),
      availabilityStatus: existing?.availabilityStatus ?? null,
      // Event registrations carry no résumé; keep whatever an application gave us.
      resumePath: existing?.resumePath ?? null,
      fromApplication: existing?.fromApplication ?? false,
      fromEvent: true,
    };
    byEmail.set(email, merged);
  }

  const candidates = [...byEmail.values()];

  return {
    candidates,
    counts: {
      applications: applications.length,
      events: eventRows.length,
      uniqueEmails: byEmail.size,
      eligible: candidates.length,
      alreadyClaimed: 0, // filled in by runMigration
      toInvite: 0,
      excludedMembershipNo: membershipNo.length,
      excludedUnclear: unclear.length,
      invalidEmail: invalidEmail.length,
    },
    excludedSamples: {
      membershipNo: membershipNo.slice(0, 25),
      unclear: unclear.slice(0, 25),
      invalidEmail: invalidEmail.slice(0, 25),
    },
  };
}

/** Every email that already has an auth account (lower-cased), paginated. */
async function existingAuthEmails(admin: SupabaseClient): Promise<Set<string>> {
  const set = new Set<string>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error || !data?.users?.length) break;
    for (const u of data.users) if (u.email) set.add(u.email.toLowerCase());
    if (data.users.length < 1000) break;
  }
  return set;
}

function inviteEmailHtml(fullName: string | null, claimUrl: string): string {
  const greeting = fullName
    ? `Hi ${escapeHtml(fullName.split(/\s+/)[0])},`
    : "Hi,";
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:520px;margin:0 auto;">
      <h2 style="margin:0 0 12px;">Your ETEN account is ready</h2>
      <p style="margin:0 0 12px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 12px;line-height:1.6;">
        Because you registered with Expervia, we've set up an ETEN account for you
        with your details already filled in. Click below to set your password and
        finish your profile ahead of launch.
      </p>
      <p style="margin:24px 0;">
        <a href="${claimUrl}" style="background:#2e5395;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block;">
          Claim your account
        </a>
      </p>
      <p style="margin:0 0 12px;line-height:1.6;color:#666;font-size:13px;">
        This link is single-use and expires soon. If you didn't expect this, you
        can ignore this email.
      </p>
    </div>
  `;
}

/**
 * Provision one account (invite) and email the claim link. Enriches the profile
 * with what we already know. Assumes the caller filtered out existing accounts.
 */
async function provisionAndInvite(
  admin: SupabaseClient,
  resend: Resend,
  siteOrigin: string,
  fromEmail: string,
  candidate: Candidate,
): Promise<void> {
  // Create the auth user + generate the invite token (does NOT send email).
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: candidate.email,
    options: {
      data: { full_name: candidate.fullName ?? "", origin: "migrated" },
    },
  });
  if (error || !data?.properties?.hashed_token || !data.user) {
    throw new Error(error?.message ?? "Could not generate invite link.");
  }

  // Build a claim link through our own confirm route → set-password page.
  const claimUrl = `${siteOrigin}/auth/confirm?token_hash=${encodeURIComponent(
    data.properties.hashed_token,
  )}&type=invite&next=/reset-password`;

  // Enrich the profile the trigger just created (best-effort). We retain the
  // structured details they already gave us, and reference their existing résumé
  // file (still in the private `resumes` bucket) so it's attached to the profile —
  // we do NOT parse the résumé into fields here (that's a separate capability).
  await admin
    .from("profiles")
    .update({
      location: candidate.location,
      job_title: candidate.jobTitle,
      industry_experience: candidate.industryExperience,
      availability_status: candidate.availabilityStatus,
      resume_path: candidate.resumePath,
    })
    .eq("member_id", data.user.id);

  const { error: mailError } = await resend.emails.send({
    from: fromEmail,
    to: candidate.email,
    subject: "Your ETEN account is ready — claim it",
    html: inviteEmailHtml(candidate.fullName, claimUrl),
  });
  if (mailError) throw new Error(mailError.message);
}

export async function runMigration(
  admin: SupabaseClient,
  resend: Resend,
  siteOrigin: string,
  fromEmail: string,
  opts: { mode: MigrationMode; testEmails?: string[] },
): Promise<MigrationReport> {
  const { candidates, counts, excludedSamples } = await buildCandidates(admin);
  const existing = await existingAuthEmails(admin);

  let toInvite = candidates.filter((c) => !existing.has(c.email));
  const alreadyClaimed = candidates.length - toInvite.length;

  if (opts.mode === "test") {
    const allow = new Set(
      (opts.testEmails ?? [])
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
    toInvite = toInvite.filter((c) => allow.has(c.email));
  }

  const report: MigrationReport = {
    mode: opts.mode,
    counts: {
      ...counts,
      alreadyClaimed,
      toInvite: toInvite.length,
    },
    toInvite: toInvite
      .slice(0, 500)
      .map((c) => ({ email: c.email, fullName: c.fullName })),
    excludedSamples,
  };

  if (opts.mode === "dry-run") {
    return report;
  }

  // test / send — actually provision, up to the batch limit.
  const batch = toInvite.slice(0, BATCH_LIMIT);
  const processed: NonNullable<MigrationReport["processed"]> = [];
  for (const candidate of batch) {
    try {
      await provisionAndInvite(admin, resend, siteOrigin, fromEmail, candidate);
      processed.push({ email: candidate.email, status: "invited" });
    } catch (err) {
      processed.push({
        email: candidate.email,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  report.processed = processed;
  const invited = processed.filter((p) => p.status === "invited").length;
  report.remaining = toInvite.length - invited;
  return report;
}
