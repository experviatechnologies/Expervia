import { MicrosoftHero } from "@/components/sections/solutions/microsoft/microsoft-hero";
import { PartnerTrustBar } from "@/components/sections/solutions/microsoft/partner-trust-bar";
import { WhyPartner } from "@/components/sections/solutions/microsoft/why-partner";
import { Capabilities } from "@/components/sections/solutions/microsoft/capabilities";
import { CspServices } from "@/components/sections/solutions/microsoft/csp-services";
import { MicrosoftAssessments } from "@/components/sections/solutions/microsoft/microsoft-assessments";
import { MicrosoftCta } from "@/components/sections/solutions/microsoft/microsoft-cta";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/solutions/microsoft");

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
