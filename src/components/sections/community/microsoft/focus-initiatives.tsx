import { Bot, ShieldCheck, type LucideIcon } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const initiatives: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Bot,
    title: "AI & Copilot Adoption",
    body: "Leading the wave of generative AI implementation across African enterprise sectors using Azure OpenAI and Microsoft 365 Copilot.",
  },
  {
    icon: ShieldCheck,
    title: "Security & Identity",
    body: "Hardening infrastructure through Zero Trust architectures and advanced Entra ID implementations for highly regulated industries.",
  },
];

export function FocusInitiatives() {
  return (
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">Focus Initiatives</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            Where We&apos;re Driving Impact
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-1 lg:grid-cols-2">
          {initiatives.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="glass-card hover:border-primary/50 space-y-4 rounded-2xl p-10 transition-all"
            >
              <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
                <Icon className="size-6" />
              </div>
              <h3 className="font-display text-on-surface text-headline-md font-semibold">
                {title}
              </h3>
              <p className="text-on-surface-variant">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
