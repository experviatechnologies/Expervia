import type { Metadata } from "next";
import { MicrosoftHero } from "@/components/sections/community/microsoft/microsoft-hero";
import { CommunityStats } from "@/components/sections/community/microsoft/community-stats";
import { WhatIsEmpc } from "@/components/sections/community/microsoft/what-is-empc";
import { WhoShouldJoin } from "@/components/sections/community/microsoft/who-should-join";
import { ProfessionalAdvantages } from "@/components/sections/community/microsoft/professional-advantages";
import { FocusInitiatives } from "@/components/sections/community/microsoft/focus-initiatives";
import { CommunityPrinciples } from "@/components/sections/community/microsoft/community-principles";
import { ApplicationForm } from "@/components/sections/community/microsoft/application-form";

export const metadata: Metadata = {
  title: "Microsoft Professionals Community",
  description:
    "Join the Expervia Microsoft Professionals Community (EMPC) — a Pan-African network of Azure, Security, Data & AI, and Modern Work professionals connecting certified talent with high-value enterprise projects.",
};

export default function MicrosoftCommunityPage() {
  return (
    <>
      <MicrosoftHero />
      <CommunityStats />
      <WhatIsEmpc />
      <WhoShouldJoin />
      <ProfessionalAdvantages />
      <FocusInitiatives />
      <CommunityPrinciples />
      <ApplicationForm />
    </>
  );
}
