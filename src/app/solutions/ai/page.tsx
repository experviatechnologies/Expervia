import { AiHero } from "@/components/sections/solutions/ai/ai-hero";
import { AiCapabilities } from "@/components/sections/solutions/ai/ai-capabilities";
import { AiApproach } from "@/components/sections/solutions/ai/ai-approach";
import { AiUseCases } from "@/components/sections/solutions/ai/ai-use-cases";
import { ResponsibleAi } from "@/components/sections/solutions/ai/responsible-ai";
import { AiAssessments } from "@/components/sections/solutions/ai/ai-assessments";
import { AiCta } from "@/components/sections/solutions/ai/ai-cta";
import { pageMeta } from "@/lib/seo";
import { RelatedSolutions } from "@/components/site/internal-links";

export const metadata = pageMeta("/solutions/ai");

export default function AiSolutionsPage() {
  return (
    <>
      <AiHero />
      <AiCapabilities />
      <AiApproach />
      <AiUseCases />
      <ResponsibleAi />
      <AiAssessments />
      <RelatedSolutions current="ai" />
      <AiCta />
    </>
  );
}
