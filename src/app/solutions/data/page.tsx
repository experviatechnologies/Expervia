import { DataHero } from "@/components/sections/solutions/data/data-hero";
import { DataCapabilities } from "@/components/sections/solutions/data/data-capabilities";
import { DataApproach } from "@/components/sections/solutions/data/data-approach";
import { DataStack } from "@/components/sections/solutions/data/data-stack";
import { DataInsight } from "@/components/sections/solutions/data/data-insight";
import { DataAssessments } from "@/components/sections/solutions/data/data-assessments";
import { DataCta } from "@/components/sections/solutions/data/data-cta";
import { pageMeta } from "@/lib/seo";
import { RelatedSolutions } from "@/components/site/internal-links";

export const metadata = pageMeta("/solutions/data");

export default function DataSolutionsPage() {
  return (
    <>
      <DataHero />
      <DataCapabilities />
      <DataApproach />
      <DataStack />
      <DataInsight />
      <DataAssessments />
      <RelatedSolutions current="data" />
      <DataCta />
    </>
  );
}
