import { CloudHero } from "@/components/sections/solutions/cloud/cloud-hero";
import { CloudCapabilities } from "@/components/sections/solutions/cloud/cloud-capabilities";
import { CloudJourney } from "@/components/sections/solutions/cloud/cloud-journey";
import { CloudPlatforms } from "@/components/sections/solutions/cloud/cloud-platforms";
import { CloudResilience } from "@/components/sections/solutions/cloud/cloud-resilience";
import { CloudAssessments } from "@/components/sections/solutions/cloud/cloud-assessments";
import { CloudCta } from "@/components/sections/solutions/cloud/cloud-cta";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/solutions/cloud");

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
