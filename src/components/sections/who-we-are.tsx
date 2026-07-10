import { Building2 } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const stats = [
  { value: "40+", label: "Years Combined Expertise" },
  { value: "2+", label: "Enterprise Partners" },
];

export function WhoWeAre() {
  return (
    <section id="about" className="bg-surface py-section">
      <Container>
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
          <div>
            <SectionLabel className="mb-2">Our Identity</SectionLabel>
            <h2 className="font-display text-on-surface text-headline-lg mb-8 leading-tight font-bold">
              Strategy, Innovation, <br />
              Execution, People, <span className="text-primary">Do.</span>
            </h2>
            <div className="mb-10 space-y-6">
              <p className="text-body-lg text-on-surface-variant">
                Expervia Technologies bridges the gap between complex global
                innovation and local market realities. We don&apos;t just
                consult; we execute.
              </p>
              <p className="text-body-md text-on-surface-variant/80">
                Our philosophy is built on five pillars: deep strategic insight,
                relentless innovation, flawless execution, a focus on
                people-centric results, and a bias for action. We combine global
                technical excellence with a nuanced understanding of the African
                business landscape.
              </p>
            </div>
            <div className="border-outline-variant/20 grid grid-cols-2 gap-8 border-y py-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-primary font-display text-headline-lg mb-1 font-bold">
                    {s.value}
                  </div>
                  <p className="text-on-surface-variant text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Image placeholder — TODO: replace with real asset via next/image */}
          <div className="relative">
            <div className="relative z-10 flex items-center justify-center overflow-hidden rounded-2xl">
              {/* <Building2 className="text-on-surface-variant/30 size-24" /> */}
              <img
                src="/identity.jpg"
                alt="identity image"
                className="rounded-2xl"
              />
            </div>
            <div className="bg-primary/10 absolute -right-10 -bottom-10 z-0 size-64 rounded-full blur-[100px]" />
          </div>
        </div>
      </Container>
    </section>
  );
}
