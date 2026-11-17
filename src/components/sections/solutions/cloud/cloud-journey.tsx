import { Section, SectionIntro } from "@/components/site/ui";
import { StepTrack } from "@/components/site/step-track";

const steps = [
  {
    title: "Assess",
    body: "Discovery of workloads and dependencies, with a clear business case for the cloud.",
  },
  {
    title: "Architect",
    body: "Secure landing zones and a target architecture aligned to Well-Architected pillars.",
  },
  {
    title: "Migrate",
    body: "Phased migration and modernization executed with minimal business disruption.",
  },
  {
    title: "Optimize",
    body: "Continuously tune for cost, performance, security, and resilience post-migration.",
  },
];

export function CloudJourney() {
  return (
    <Section id="journey" labelledBy="cloud-journey-heading">
      <SectionIntro
        id="cloud-journey-heading"
        eyebrow="How We Deliver"
        title="Your Migration Journey, De-Risked"
        intro="A proven, phased path to the cloud that protects business continuity and proves value at every stage."
      />
      <StepTrack steps={steps} />
    </Section>
  );
}
