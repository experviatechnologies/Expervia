import { Section, SectionIntro } from "@/components/site/ui";
import { StepTrack } from "@/components/site/step-track";

const steps = [
  {
    title: "Assess",
    body: "Identify high-value use cases and evaluate your data, infrastructure, and governance readiness.",
  },
  {
    title: "Prototype",
    body: "Rapidly build a proof-of-concept to validate measurable impact before committing to scale.",
  },
  {
    title: "Productionize",
    body: "Engineer secure, monitored, production-grade AI systems with full MLOps lifecycle support.",
  },
  {
    title: "Govern & Scale",
    body: "Embed responsible-AI guardrails and roll out across teams, regions, and workloads.",
  },
];

export function AiApproach() {
  return (
    <Section id="approach" labelledBy="ai-approach-heading">
      <SectionIntro
        id="ai-approach-heading"
        eyebrow="How We Deliver"
        title="From Idea to Production, De-Risked"
        intro="A staged approach that proves value early and scales responsibly, so AI becomes an operational capability, not a science experiment."
      />
      <StepTrack steps={steps} />
    </Section>
  );
}
