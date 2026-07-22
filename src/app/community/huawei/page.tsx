import type { Metadata } from "next";
import { HuaweiHero } from "@/components/sections/community/huawei/huawei-hero";
import { Foundation } from "@/components/sections/community/huawei/foundation";
import { ProfessionalAdvantage } from "@/components/sections/community/huawei/professional-advantage";
import { WhoShouldJoin } from "@/components/sections/community/huawei/who-should-join";
import { SpecializationTracks } from "@/components/sections/community/huawei/specialization-tracks";
import { ApplicationForm } from "@/components/sections/community/huawei/application-form";

export const metadata: Metadata = {
  title: "Huawei Professionals Community",
  description:
    "Join Expervia's Pan-African network of Huawei-certified Cloud, AI, Security, and Intelligent Infrastructure professionals, bridging certification and commercial opportunity.",
};

export default function HuaweiCommunityPage() {
  return (
    <>
      <HuaweiHero />
      <Foundation />
      <ProfessionalAdvantage />
      <WhoShouldJoin />
      <SpecializationTracks />
      <ApplicationForm />
    </>
  );
}
