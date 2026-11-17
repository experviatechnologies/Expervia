import { Section, SectionIntro } from "@/components/site/ui";
import { StepTrack } from "@/components/site/step-track";

const steps = [
  {
    title: "Ingest",
    body: "Connect and collect data from every source: apps, databases, devices, and streams.",
  },
  {
    title: "Unify",
    body: "Cleanse, model, and consolidate into a single, governed source of truth.",
  },
  {
    title: "Analyze",
    body: "Explore with BI, dashboards, and predictive models to surface what matters.",
  },
  {
    title: "Activate",
    body: "Push insight back into the business so teams can act on it in the moment.",
  },
];

export function DataApproach() {
  return (
    <Section id="approach" labelledBy="data-approach-heading">
      <SectionIntro
        id="data-approach-heading"
        eyebrow="How We Deliver"
        title="From Data to Decisions"
        intro="A clear path that turns scattered, raw data into trusted insight your teams can act on every day."
      />
      <StepTrack steps={steps} />
    </Section>
  );
}
