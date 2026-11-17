import { Section, SectionIntro } from "@/components/site/ui";
import { StepTrack } from "@/components/site/step-track";

const steps = [
  {
    title: "Identify",
    body: "Map your assets, risks, and threat exposure to establish a clear security baseline.",
  },
  {
    title: "Protect",
    body: "Deploy Zero-Trust controls, identity hardening, and defenses across every layer.",
  },
  {
    title: "Detect",
    body: "Monitor continuously with SIEM, threat intelligence, and proactive threat hunting.",
  },
  {
    title: "Respond & Recover",
    body: "Contain, eradicate, and restore fast with tested incident-response runbooks.",
  },
];

export function CyberApproach() {
  return (
    <Section id="approach" labelledBy="cyber-approach-heading">
      <SectionIntro
        id="cyber-approach-heading"
        eyebrow="How We Defend"
        title="A Defense Lifecycle Built on NIST"
        intro="We align to the NIST Cybersecurity Framework, a proven, end-to-end approach that keeps you resilient before, during, and after an attack."
      />
      <StepTrack steps={steps} />
    </Section>
  );
}
