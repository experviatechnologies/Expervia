import {
  BadgeCheck,
  Network,
  ShieldCheck,
  Server,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";

const reasons: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: BadgeCheck,
    title: "Microsoft AI Cloud Partner",
    body: "Expertise in the full Microsoft stack, from Azure to M365 and specialized AI integrations.",
  },
  {
    icon: Network,
    title: "Strategic Partnerships",
    body: "Microsoft Cloud Solutions Partner and Huawei Enterprise Partner, offering a diverse and resilient technology ecosystem.",
  },
  {
    icon: ShieldCheck,
    title: "Security-First Methodology",
    body: "Every solution we deploy is built on a foundation of Zero-Trust and proactive risk management.",
  },
];

export function WhyChoose() {
  return (
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
          {/* Image placeholder — TODO: swap to next/image with real photo */}
          <div className="group relative overflow-hidden rounded-2xl">
            <div className="bg-surface-container-high flex aspect-square w-full items-center justify-center">
              <Server className="text-on-surface-variant/20 size-24" />
            </div>
            <div className="from-background absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
          </div>

          <div>
            <h2 className="font-display text-on-surface text-headline-lg mb-8 font-bold">
              Why Global Leaders <br />
              <span className="text-primary">Choose Expervia</span>
            </h2>
            <div className="space-y-8">
              {reasons.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <span className="bg-primary/10 text-primary flex size-fit shrink-0 items-center justify-center rounded-lg p-2">
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <h4 className="font-display text-on-surface text-headline-md mb-1 font-semibold">
                      {title}
                    </h4>
                    <p className="text-body-md text-on-surface-variant">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
