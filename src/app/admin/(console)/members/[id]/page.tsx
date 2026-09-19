import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  FileText,
  MapPin,
  Star,
  X,
} from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MemberStatusControl } from "../member-status-control";
import { MemberVLevelControl } from "../member-vlevel-control";
import { AddEvidence } from "../add-evidence";
import { vLevelLabel } from "@/lib/eten/v-levels";
import {
  EVIDENCE_CATEGORY_LABEL,
  type EvidenceCategory,
} from "@/lib/eten/evidence-types";

export const metadata: Metadata = {
  title: "Member",
  robots: { index: false, follow: false },
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-eten-verified-soft text-eten-verified",
  suspended: "bg-amber-500/10 text-amber-400",
  deactivated: "bg-destructive/10 text-destructive",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();

  const { data: member } = await admin
    .from("members")
    .select("id, status, role, origin, claimed_at, created_at, v_level")
    .eq("id", id)
    .maybeSingle();
  if (!member) notFound();

  const [
    { data: profile },
    { data: authUser },
    { data: membershipRows },
    { data: skillRows },
    { data: certRows },
    { data: verificationRows },
    { data: evidenceRows },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "full_name, headline, job_title, location, bio, industry_experience, availability_status, languages, years_experience, primary_specialization_pod_id",
      )
      .eq("member_id", id)
      .maybeSingle(),
    admin.auth.admin.getUserById(id),
    admin
      .from("pod_memberships")
      .select("role_in_pod, pods(id, name, is_main)")
      .eq("member_id", id),
    admin
      .from("member_skills")
      .select("skills(name, is_active)")
      .eq("member_id", id),
    admin
      .from("certifications")
      .select(
        "id, name, issuer, credential_id, date_obtained, expiry_date, verification_status, certificate_path",
      )
      .eq("member_id", id)
      .order("date_obtained", { ascending: false, nullsFirst: false }),
    admin
      .from("member_verifications")
      .select("kind, status, document_type, file_path, review_note")
      .eq("member_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("evidence_records")
      .select(
        "id, title, description, category, capability_area, v_level, occurred_at, created_at",
      )
      .eq("member_id", id)
      .order("created_at", { ascending: false }),
  ]);

  type VRow = {
    kind: "identity" | "address";
    status: "unverified" | "verified" | "rejected";
    document_type: "passport" | "drivers_license" | "nin" | null;
    file_path: string;
    review_note: string | null;
  };
  const vrows = (verificationRows ?? []) as VRow[];
  const identityV = vrows.find((v) => v.kind === "identity") ?? null;
  const addressV = vrows.find((v) => v.kind === "address") ?? null;

  type EvidenceRow = {
    id: string;
    title: string;
    description: string | null;
    category: string;
    capability_area: string | null;
    v_level: number | null;
    occurred_at: string | null;
    created_at: string;
  };
  const evidence = (evidenceRows ?? []) as EvidenceRow[];

  const email = authUser?.user?.email ?? null;

  type PodRow = {
    role_in_pod: "member" | "lead" | "co_lead";
    pods: { id: string; name: string; is_main: boolean } | null;
  };
  const pods = ((membershipRows ?? []) as unknown as PodRow[])
    .map((r) => ({ role: r.role_in_pod, pod: r.pods }))
    .filter(
      (
        r,
      ): r is {
        role: PodRow["role_in_pod"];
        pod: NonNullable<PodRow["pods"]>;
      } => Boolean(r.pod),
    );
  const primaryPodId = profile?.primary_specialization_pod_id ?? null;

  const skills = (
    (skillRows ?? []) as unknown as {
      skills: { name: string; is_active: boolean } | null;
    }[]
  )
    .map((r) => r.skills)
    .filter((s): s is { name: string; is_active: boolean } =>
      Boolean(s?.is_active),
    )
    .map((s) => s.name);

  const certs = certRows ?? [];
  const languages = profile?.languages ?? [];
  const name = profile?.full_name ?? "—";
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();
  const roleLabel = { member: "Member", lead: "Lead", co_lead: "Co-lead" };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
      <Link
        href="/admin/members"
        className="text-eten-faint hover:text-eten-ink mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        All members
      </Link>

      {/* Identity header */}
      <header className="bg-eten-panel border-eten-line rounded-2xl border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="from-eten-accent grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br to-[#3257b8] text-xl font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <h1 className="text-eten-ink text-xl font-extrabold tracking-[-0.01em]">
                {name}
              </h1>
              {profile?.headline && (
                <p className="text-eten-ink-muted mt-0.5 text-sm">
                  {profile.headline}
                </p>
              )}
              <div className="text-eten-faint mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {profile?.job_title && <span>{profile.job_title}</span>}
                {profile?.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {profile.location}
                  </span>
                )}
                {email && <span>{email}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={
                "inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize " +
                (STATUS_STYLE[member.status] ??
                  "bg-eten-panel-hi text-eten-faint")
              }
            >
              {member.status}
            </span>
            <MemberStatusControl
              memberId={member.id}
              status={member.status}
              isOperations={member.role === "operations"}
            />
          </div>
        </div>
      </header>

      {/* Account facts */}
      <Section title="Account">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fact
            label="Role"
            value={member.role === "operations" ? "Operations" : "Member"}
          />
          <Fact
            label="Origin"
            value={
              member.origin === "self_signup" ? "Self sign-up" : "Migrated"
            }
          />
          <Fact label="Joined" value={formatDate(member.created_at)} />
          <Fact
            label="Activated"
            value={
              member.claimed_at ? formatDate(member.claimed_at) : "Not yet"
            }
          />
        </dl>
        <div className="border-eten-line-soft mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div>
            <dt className="text-eten-faint font-mono text-[11px] tracking-wider uppercase">
              Readiness level (V0–V5)
            </dt>
            <dd className="text-eten-ink-muted mt-1 text-xs">
              Set by the Readiness Panel. Currently V{member.v_level} ·{" "}
              {vLevelLabel(member.v_level)}.
            </dd>
          </div>
          <MemberVLevelControl memberId={member.id} vLevel={member.v_level} />
        </div>
      </Section>

      {/* Specialization */}
      {(pods.length > 0 || skills.length > 0) && (
        <Section title="Pods & specialization">
          {pods.length > 0 && (
            <div className="mb-4 flex flex-col gap-2">
              {pods.map(({ role, pod }) => (
                <div key={pod.id} className="flex items-center gap-2.5">
                  <span className="text-eten-ink text-sm font-medium">
                    {pod.name}
                    {pod.is_main && (
                      <span className="text-eten-faint"> · Main community</span>
                    )}
                  </span>
                  {pod.id === primaryPodId && (
                    <span className="text-eten-accent bg-eten-accent-soft inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
                      <Star className="size-3" />
                      Primary
                    </span>
                  )}
                  {role !== "member" && (
                    <span className="bg-eten-verified-soft text-eten-verified rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase">
                      {roleLabel[role]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="border-eten-line text-eten-ink-muted rounded-full border px-3 py-1 text-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Certifications */}
      <Section title={`Certifications · ${certs.length}`}>
        {certs.length === 0 ? (
          <p className="text-eten-faint text-sm">
            No certifications submitted.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {certs.map((c) => (
              <li
                key={c.id}
                className="border-eten-line-soft flex flex-wrap items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-eten-ink font-semibold">{c.name}</div>
                  <div className="text-eten-faint text-xs">
                    {[
                      c.issuer,
                      c.credential_id ? `ID ${c.credential_id}` : null,
                      c.date_obtained ? formatDate(c.date_obtained) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {c.certificate_path && (
                    <a
                      href={`/api/admin/certificate?path=${encodeURIComponent(c.certificate_path)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-eten-accent mt-1 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                    >
                      <FileText className="size-3.5" />
                      View file
                    </a>
                  )}
                </div>
                <CertBadge status={c.verification_status} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Identity & address verification */}
      <Section title="Identity & address">
        <div className="flex flex-col gap-3">
          <VerificationLine label="Identity" row={identityV} />
          <VerificationLine label="Proof of address" row={addressV} />
        </div>
      </Section>

      {/* Capability passport */}
      <Section title={`Capability passport · ${evidence.length}`}>
        {evidence.length === 0 ? (
          <p className="text-eten-faint text-sm">No evidence records yet.</p>
        ) : (
          <ul className="mb-4 flex flex-col gap-3">
            {evidence.map((e) => (
              <li
                key={e.id}
                className="border-eten-line-soft flex flex-wrap items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-eten-ink font-medium">{e.title}</div>
                  {e.description && (
                    <div className="text-eten-faint mt-0.5 text-xs">
                      {e.description}
                    </div>
                  )}
                  <div className="text-eten-faint mt-1 text-xs">
                    {[
                      e.capability_area,
                      e.v_level != null ? `V${e.v_level}` : null,
                      formatDate(e.occurred_at ?? e.created_at),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <span className="bg-eten-accent-soft text-eten-accent shrink-0 rounded-full px-2.5 py-1 text-xs font-medium">
                  {EVIDENCE_CATEGORY_LABEL[e.category as EvidenceCategory] ??
                    "Other"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <AddEvidence memberId={member.id} />
      </Section>

      {/* About + details */}
      {profile?.bio && (
        <Section title="About">
          <p className="text-eten-ink text-sm whitespace-pre-line">
            {profile.bio}
          </p>
        </Section>
      )}

      {(profile?.industry_experience ||
        profile?.years_experience != null ||
        languages.length > 0 ||
        profile?.availability_status) && (
        <Section title="Details">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {profile?.availability_status && (
              <Fact label="Availability" value={profile.availability_status} />
            )}
            {profile?.industry_experience && (
              <Fact
                label="Industry experience"
                value={profile.industry_experience}
              />
            )}
            {profile?.years_experience != null && (
              <Fact
                label="Years of experience"
                value={String(profile.years_experience)}
              />
            )}
            {languages.length > 0 && (
              <Fact label="Languages" value={languages.join(", ")} />
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
    <section className="bg-eten-panel border-eten-line mt-4 rounded-2xl border p-5 sm:p-6">
      <h2 className="text-eten-ink mb-4 text-sm font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-eten-faint font-mono text-[11px] tracking-wider uppercase">
        {label}
      </dt>
      <dd className="text-eten-ink mt-1 text-sm">{value}</dd>
    </div>
  );
}

function CertBadge({
  status,
}: {
  status: "unverified" | "verified" | "rejected";
}) {
  if (status === "verified") {
    return (
      <span className="bg-eten-verified-soft text-eten-verified inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
        <BadgeCheck className="size-3.5" />
        Verified
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
        <X className="size-3.5" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
      <Clock className="size-3.5" />
      Pending
    </span>
  );
}

const VERIFY_ID_TYPE: Record<string, string> = {
  passport: "International Passport",
  drivers_license: "Driver's License",
  nin: "National ID (NIN)",
};

function VerificationLine({
  label,
  row,
}: {
  label: string;
  row: {
    status: "unverified" | "verified" | "rejected";
    document_type: "passport" | "drivers_license" | "nin" | null;
    file_path: string;
    review_note: string | null;
  } | null;
}) {
  return (
    <div className="border-eten-line-soft flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
      <div className="min-w-0">
        <div className="text-eten-ink text-sm font-medium">{label}</div>
        {row ? (
          <div className="text-eten-faint text-xs">
            {row.document_type ? `${VERIFY_ID_TYPE[row.document_type]} · ` : ""}
            <a
              href={`/api/admin/verification?path=${encodeURIComponent(row.file_path)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-eten-accent inline-flex items-center gap-1 font-medium hover:underline"
            >
              <FileText className="size-3" />
              View document
            </a>
            {row.status === "rejected" && row.review_note
              ? ` · ${row.review_note}`
              : ""}
          </div>
        ) : (
          <div className="text-eten-faint/70 text-xs">Not submitted</div>
        )}
      </div>
      {row ? (
        <CertBadge status={row.status} />
      ) : (
        <span className="text-eten-faint/60 text-xs">—</span>
      )}
    </div>
  );
}
