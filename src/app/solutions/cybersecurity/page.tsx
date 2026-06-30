import type { Metadata } from "next";
import { CyberHero } from "@/components/sections/solutions/cybersecurity/cyber-hero";
import { CyberCapabilities } from "@/components/sections/solutions/cybersecurity/cyber-capabilities";
import { CyberApproach } from "@/components/sections/solutions/cybersecurity/cyber-approach";
import { CyberStack } from "@/components/sections/solutions/cybersecurity/cyber-stack";
import { CyberSoc } from "@/components/sections/solutions/cybersecurity/cyber-soc";
import { CyberAssessments } from "@/components/sections/solutions/cybersecurity/cyber-assessments";
import { CyberCta } from "@/components/sections/solutions/cybersecurity/cyber-cta";

export const metadata: Metadata = {
  title: "Cybersecurity",
  description:
    "Cybersecurity from Expervia — Zero-Trust architecture, a 24/7 managed SOC, identity and threat protection, and compliance built on Microsoft Defender, Sentinel, Entra, and Purview.",
};

export default function CybersecuritySolutionsPage() {
  return (
    <>
      <CyberHero />
      <CyberCapabilities />
      <CyberApproach />
      <CyberStack />
      <CyberSoc />
      <CyberAssessments />
      <CyberCta />
    </>
  );
}
