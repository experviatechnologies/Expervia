import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { safeNext } from "@/lib/safe-next";
import { DETAIL_LABEL, missingDetails } from "@/lib/eten/member-details";
import { loadDetails } from "@/lib/eten/member-details-server";
import { SignOutButton } from "../sign-out-button";
import { DetailsForm } from "./details-form";

export const metadata: Metadata = {
  title: "Your details · ETEN",
  robots: { index: false, follow: false },
};

/**
 * "Your details" (7 Nov 2026): every member gives a phone number, location,
 * job title, experience and CV, and agrees to share them with their Pod
 * Leaders and ETEN staff, before using the app. New members reach it after
 * choosing a pod; existing members are sent here by the app gate until it is
 * done. ?edit=1 lets anyone update their details later.
 */
export default async function DetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; edit?: string }>;
}) {
  const { next: rawNext, edit } = await searchParams;
  const next = safeNext(rawNext);
  const member = await getCurrentMember();
  if (!member)
    redirect(`/signin?next=${encodeURIComponent("/onboarding/details")}`);
  if (!member.emailConfirmed) redirect("/onboarding");

  const details = await loadDetails(member.id);
  const missing = missingDetails(details);
  if (missing.length === 0 && edit !== "1") redirect(next);

  const { data: contact } = await getSupabaseAdmin()
    .from("member_contact")
    .select("phone, linkedin_url")
    .eq("member_id", member.id)
    .maybeSingle();

  const isUpdate = edit === "1" || missing.length < 7;

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-primary font-mono tracking-widest uppercase">
            ETEN profile
          </p>
          <h1 className="font-display text-headline-md text-on-surface mt-1 font-bold">
            {edit === "1" ? "Update your details" : "Complete your details"}
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Your Pod Leader uses these to reach you and to put you forward for
            client work and opportunities. It takes about two minutes.
          </p>
          {isUpdate && missing.length > 0 && (
            <p className="text-on-surface mt-3 text-sm">
              Still needed:{" "}
              <span className="font-medium">
                {missing.map((k) => DETAIL_LABEL[k]).join(", ")}
              </span>
            </p>
          )}
        </div>
        <SignOutButton />
      </header>

      <DetailsForm
        next={next}
        initial={{
          fullName: details.fullName ?? member.fullName ?? "",
          phone: (contact?.phone as string) ?? "",
          linkedin: (contact?.linkedin_url as string) ?? "",
          location: details.location ?? "",
          jobTitle: details.jobTitle ?? "",
          yearsExperience:
            details.yearsExperience === null
              ? ""
              : String(details.yearsExperience),
          hasCv: details.hasCv,
        }}
      />
    </div>
  );
}
