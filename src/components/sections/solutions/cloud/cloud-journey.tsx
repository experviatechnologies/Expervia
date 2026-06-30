import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

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
    <section className="bg-surface py-section">
      <Container>
        <div className="mb-16 max-w-2xl">
          <SectionLabel className="mb-4">How We Deliver</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            Your Migration Journey, De-Risked
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            A proven, phased path to the cloud that protects business continuity
            and proves value at every stage.
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
