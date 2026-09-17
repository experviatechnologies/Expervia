import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  VerificationManager,
  type VerificationRow,
} from "./verification-manager";

export const metadata: Metadata = {
  title: "Identity & Address Verification",
  robots: { index: false, follow: false },
};

export default async function VerificationPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  // RLS scopes this to the caller's own rows. Newest first, so the first row of
  // each kind is the current submission.
  const { data: rows } = await supabase
    .from("member_verifications")
    .select("kind, status, document_type, file_path, review_note")
    .eq("member_id", member.id)
    .order("created_at", { ascending: false });

  const toRow = (kind: "identity" | "address"): VerificationRow | null => {
    const r = (rows ?? []).find((x) => x.kind === kind);
    if (!r) return null;
    return {
      kind,
      status: r.status,
      documentType: r.document_type,
      filePath: r.file_path,
      reviewNote: r.review_note,
    };
  };

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
          Verification
        </p>
        <h1 className="font-display text-headline-md text-eten-ink mt-1 font-bold">
          Identity &amp; address
        </h1>
        <p className="text-eten-ink-muted mt-2 text-sm">
          Verify who you are to build trust across ETEN. The ETEN team reviews
          your documents privately — they&apos;re never shown to other members.
        </p>
      </header>

      <VerificationManager
        identity={toRow("identity")}
        address={toRow("address")}
      />
    </div>
  );
}
