import type { Metadata } from "next";
import { CloudHero } from "@/components/sections/solutions/cloud/cloud-hero";
import { CloudCapabilities } from "@/components/sections/solutions/cloud/cloud-capabilities";
import { CloudJourney } from "@/components/sections/solutions/cloud/cloud-journey";
import { CloudPlatforms } from "@/components/sections/solutions/cloud/cloud-platforms";
import { CloudResilience } from "@/components/sections/solutions/cloud/cloud-resilience";
import { CloudAssessments } from "@/components/sections/solutions/cloud/cloud-assessments";
import { CloudCta } from "@/components/sections/solutions/cloud/cloud-cta";

export const metadata: Metadata = {
  title: "Cloud Transformation",
  description:
    "Cloud transformation from Expervia — hybrid and multi-cloud strategy, secure migration, cloud-native modernization, managed operations, and FinOps on Microsoft Azure and Huawei Cloud.",
};

export default function CloudSolutionsPage() {
  return (
    <>
      <CloudHero />
      <CloudCapabilities />
      <CloudJourney />
      <CloudPlatforms />
      <CloudResilience />
      <CloudAssessments />
      <CloudCta />
    </>
  );
}
