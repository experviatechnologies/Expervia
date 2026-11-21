import { CyberHero } from "@/components/sections/solutions/cybersecurity/cyber-hero";
import { CyberCapabilities } from "@/components/sections/solutions/cybersecurity/cyber-capabilities";
import { CyberApproach } from "@/components/sections/solutions/cybersecurity/cyber-approach";
import { CyberStack } from "@/components/sections/solutions/cybersecurity/cyber-stack";
import { CyberSoc } from "@/components/sections/solutions/cybersecurity/cyber-soc";
import { CyberAssessments } from "@/components/sections/solutions/cybersecurity/cyber-assessments";
import { CyberCta } from "@/components/sections/solutions/cybersecurity/cyber-cta";
import { pageMeta } from "@/lib/seo";
import { RelatedSolutions } from "@/components/site/internal-links";

export const metadata = pageMeta("/solutions/cybersecurity");

export default function CybersecuritySolutionsPage() {
  return (
    <>
      <CyberHero />
      <CyberCapabilities />
      <CyberApproach />
      <CyberStack />
      <CyberSoc />
      <CyberAssessments />
      <RelatedSolutions current="cybersecurity" />
      <CyberCta />
    </>
  );
}
