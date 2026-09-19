import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Award } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  EVIDENCE_CATEGORY_LABEL,
  type EvidenceCategory,
} from "@/lib/eten/evidence-types";
import { vLevelBadge } from "@/lib/eten/v-levels";

export const metadata: Metadata = {
  title: "Capability Passport",
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PassportPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("evidence_records")
    .select(
      "id, title, description, category, capability_area, v_level, occurred_at, created_at",
    )
    .eq("member_id", member.id)
    .order("created_at", { ascending: false });

  const records = rows ?? [];

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
      <header className="mb-8">
        <Link
          href="/profile"
          className="text-eten-ink-muted hover:text-eten-ink mb-4 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to profile
        </Link>
        <p className="text-label-sm text-eten-accent font-mono tracking-widest uppercase">
          Capability Passport
        </p>
        <h1 className="font-display text-headline-md text-eten-ink mt-1 font-bold">
          Your evidence
        </h1>
        <p className="text-eten-ink-muted mt-2 text-sm">
          A verified record of the capability you&apos;ve demonstrated across
          ETEN — added by the ETEN team and, soon, by your mentors. It grows as
          you progress.
        </p>
      </header>

      {records.length === 0 ? (
        <div className="bg-eten-panel border-eten-line text-eten-ink-muted flex flex-col items-center gap-3 rounded-2xl border p-12 text-center">
          <Award className="text-eten-ink-muted/40 size-9" />
          <p className="text-sm">
            No evidence yet. As you complete certifications, mentorship circles
            and assessments, verified evidence will appear here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {records.map((r) => (
            <li
              key={r.id}
              className="bg-eten-panel border-eten-line rounded-2xl border p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-eten-ink font-semibold">{r.title}</h2>
                <span className="bg-eten-accent-soft text-eten-accent rounded-full px-2.5 py-1 text-xs font-medium">
                  {EVIDENCE_CATEGORY_LABEL[r.category as EvidenceCategory] ??
                    "Other"}
                </span>
              </div>
              {r.description && (
                <p className="text-eten-ink-muted mt-2 text-sm whitespace-pre-line">
                  {r.description}
                </p>
              )}
              <div className="text-eten-faint mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {r.capability_area && <span>{r.capability_area}</span>}
                {r.v_level != null && (
                  <span className="text-eten-verified font-medium">
                    {vLevelBadge(r.v_level)}
                  </span>
                )}
                <span>{formatDate(r.occurred_at ?? r.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
