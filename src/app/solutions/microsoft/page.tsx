import type { Metadata } from "next";
import { MicrosoftHero } from "@/components/sections/solutions/microsoft/microsoft-hero";
import { PartnerTrustBar } from "@/components/sections/solutions/microsoft/partner-trust-bar";
import { WhyPartner } from "@/components/sections/solutions/microsoft/why-partner";
import { Capabilities } from "@/components/sections/solutions/microsoft/capabilities";
import { CspServices } from "@/components/sections/solutions/microsoft/csp-services";
import { MicrosoftAssessments } from "@/components/sections/solutions/microsoft/microsoft-assessments";
import { MicrosoftCta } from "@/components/sections/solutions/microsoft/microsoft-cta";

export const metadata: Metadata = {
  title: "Microsoft Solutions",
  description:
    "Accelerate innovation with Microsoft technologies. As a Microsoft AI Cloud Partner and Microsoft Cloud Solutions Partner, Expervia delivers Azure, Microsoft 365, Copilot, Dynamics 365, Power Platform, and Security solutions with unified licensing and support.",
};

export default function MicrosoftSolutionsPage() {
  return (
    <>
      <MicrosoftHero />
      <PartnerTrustBar />
      <WhyPartner />
      <Capabilities />
      <CspServices />
      <MicrosoftAssessments />
      <MicrosoftCta />
    </>
  );
}
