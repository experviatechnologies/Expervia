import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const steps = [
  {
    title: "Ingest",
    body: "Connect and collect data from every source — apps, databases, devices, and streams.",
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
    <section className="bg-surface py-section">
      <Container>
        <div className="mb-16 max-w-2xl">
          <SectionLabel className="mb-4">How We Deliver</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            From Data to Decisions
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            A clear path that turns scattered, raw data into trusted insight
            your teams can act on every day.
          </p>
        </div>
        <ol className="gap-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="bg-surface-container hover:border-primary/40 relative rounded-xl border border-white/5 p-8 transition-colors"
            >
              <div className="font-display text-primary/30 mb-4 text-5xl font-extrabold">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-display text-on-surface text-headline-md mb-2 font-semibold">
                {step.title}
              </h3>
              <p className="text-on-surface-variant text-sm">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
