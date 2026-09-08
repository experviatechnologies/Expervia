import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, MapPin, Pencil } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Member Profile",
  robots: { index: false, follow: false },
};

/**
 * Public (member-facing) profile view — how a member appears to the rest of the
 * community. Read-only, distinct from the owner's /profile edit view.
 *
 * Visibility is enforced by RLS on the viewer's own session: profiles_select
 * only returns a row for the viewer themselves, ops, or another CLAIMED + ACTIVE
 * member — so an unclaimed/suspended target simply 404s here.
 *
 * Certifications are the exception: certifications_select is own-or-ops only, so
 * a viewer can't read another member's certs through their session. We therefore
 * read VERIFIED certs via service_role and expose only their metadata (name /
 * issuer / date) — never the private certificate file. Only verified credentials
 * are shown publicly; pending/rejected ones stay between the member and ops.
 */
export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getCurrentMember();
  if (!viewer) notFound();

  const isSelf = viewer.id === id;
  const supabase = await createSupabaseServerClient();

  // RLS decides whether this profile is visible to the viewer at all.
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, headline, job_title, location, industry_experience, availability_status, bio, languages, years_experience, primary_specialization_pod_id",
    )
    .eq("member_id", id)
    .maybeSingle();

  if (!profile) notFound();

  const [{ data: mySkillRows }, { data: pod }, { data: verifiedCerts }] =
    await Promise.all([
      // member_skills_select allows any active member to read; join to names.
      supabase
        .from("member_skills")
        .select("skills(id, name, is_active, pod_id)")
        .eq("member_id", id),
      profile.primary_specialization_pod_id
        ? supabase
            .from("pods")
            .select("name")
            .eq("id", profile.primary_specialization_pod_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      // Verified credentials only, metadata only — never the file path. Read via
      // service_role because certifications RLS is own-or-ops.
      getSupabaseAdmin()
        .from("certifications")
        .select("id, name, issuer, date_obtained")
        .eq("member_id", id)
        .eq("verification_status", "verified")
        .order("date_obtained", { ascending: false, nullsFirst: false }),
    ]);

  const skills = (mySkillRows ?? [])
    .map(
      (r) => r.skills as unknown as { name: string; is_active: boolean } | null,
    )
    .filter((s): s is { name: string; is_active: boolean } =>
      Boolean(s?.is_active),
    )
    .map((s) => s.name);

  const certs = verifiedCerts ?? [];
  const languages = profile.languages ?? [];
  const initials = (profile.full_name ?? "?").trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
        {isSelf && (
          <Link
            href="/profile"
            className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            <Pencil className="size-4" />
            Edit profile
          </Link>
        )}
      </div>

      {/* Identity header */}
      <header className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span className="bg-primary/10 text-primary flex size-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold">
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-headline-md text-on-surface font-bold">
              {profile.full_name}
            </h1>
            {profile.headline && (
              <p className="text-on-surface-variant text-body-lg mt-1">
                {profile.headline}
              </p>
            )}
            <div className="text-on-surface-variant mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {profile.job_title && <span>{profile.job_title}</span>}
              {profile.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {profile.location}
                </span>
              )}
            </div>
            {profile.availability_status && (
              <span className="bg-primary/10 text-primary mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium">
                {profile.availability_status}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Verified credentials — the credential-backed identity */}
      <Section title="Verified credentials">
        {certs.length === 0 ? (
          <p className="text-on-surface-variant text-sm">
            No verified credentials yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {certs.map((c) => (
              <li key={c.id} className="flex items-start gap-3">
                <BadgeCheck className="text-primary mt-0.5 size-5 shrink-0" />
                <span className="min-w-0">
                  <span className="text-on-surface block font-semibold">
                    {c.name}
                  </span>
                  <span className="text-on-surface-variant block text-sm">
                    {[c.issuer, formatYear(c.date_obtained)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* About */}
      {profile.bio && (
        <Section title="About">
          <p className="text-on-surface text-sm whitespace-pre-line">
            {profile.bio}
          </p>
        </Section>
      )}

      {/* Specialization */}
      {(pod?.name || skills.length > 0) && (
        <Section title="Specialization">
          {pod?.name && (
            <div className="mb-4">
              <p className="text-label-sm text-on-surface-variant font-mono uppercase">
                Primary pod
              </p>
              <p className="text-on-surface mt-1 font-semibold">{pod.name}</p>
            </div>
          )}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((name) => (
                <span
                  key={name}
                  className="border-outline-variant text-on-surface rounded-full border px-3 py-1 text-sm"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Details */}
      {(profile.industry_experience ||
        profile.years_experience != null ||
        languages.length > 0) && (
        <Section title="Details">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {profile.industry_experience && (
              <Detail label="Industry experience">
                {profile.industry_experience}
              </Detail>
            )}
            {profile.years_experience != null && (
              <Detail label="Years of experience">
                {profile.years_experience}
              </Detail>
            )}
            {languages.length > 0 && (
              <Detail label="Languages">{languages.join(", ")}</Detail>
            )}
          </dl>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card mt-6 rounded-2xl p-6">
      <h2 className="font-display text-body-lg text-on-surface mb-4 font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-label-sm text-on-surface-variant font-mono uppercase">
        {label}
      </dt>
      <dd className="text-on-surface mt-1 text-sm">{children}</dd>
    </div>
  );
}

/** Year from a YYYY-MM-DD date string; "" if absent/unparsable. */
function formatYear(date: string | null): string {
  if (!date) return "";
  const year = date.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "";
}
