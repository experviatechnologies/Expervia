import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  CertificationsManager,
  type Certification,
} from "./certifications-manager";

export const metadata: Metadata = {
  title: "My Certifications",
  robots: { index: false, follow: false },
};

export default async function CertificationsPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("certifications")
    .select(
      "id, name, issuer, credential_id, date_obtained, expiry_date, verification_status, certificate_path",
    )
    .eq("member_id", member.id)
    .order("date_obtained", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const certifications: Certification[] = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    issuer: r.issuer,
    credentialId: r.credential_id,
    dateObtained: r.date_obtained,
    expiryDate: r.expiry_date,
    verificationStatus: r.verification_status,
    certificatePath: r.certificate_path,
  }));

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <header className="mb-8">
        <Link
          href="/profile"
          className="text-eten-ink-muted hover:text-eten-ink mb-4 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to profile
        </Link>
        <p className="text-label-sm text-eten-accent font-mono tracking-widest uppercase">
          My Certifications
        </p>
        <h1 className="font-display text-headline-md text-eten-ink mt-1 font-bold">
          Certifications &amp; credentials
        </h1>
        <p className="text-eten-ink-muted mt-2 text-sm">
          Add your professional certifications and upload the certificate as
          proof. The ETEN team verifies them — verified badges build trust
          across the community.
        </p>
      </header>

      <CertificationsManager certifications={certifications} />
    </div>
  );
}
