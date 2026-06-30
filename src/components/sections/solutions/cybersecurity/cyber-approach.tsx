import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

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
    <section className="bg-surface py-section">
      <Container>
        <div className="mb-16 max-w-2xl">
          <SectionLabel className="mb-4">How We Defend</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            A Defense Lifecycle Built on NIST
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            We align to the NIST Cybersecurity Framework — a proven, end-to-end
            approach that keeps you resilient before, during, and after an
            attack.
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
