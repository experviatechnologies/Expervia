import { Building2 } from "lucide-react";
import { Container } from "@/components/shared/container";

const pillars = [
  {
    title: "Our Vision",
    body: "To be Africa's premier architect of the intelligent future, bridging the gap between today's infrastructure and tomorrow's possibilities.",
  },
  {
    title: "Our Mission",
    body: "To empower African enterprises with world-class technical expertise, secure digital foundations, and transformative AI solutions.",
  },
];

export function AboutHero() {
  return (
    <section className="hero-radial relative flex min-h-[80vh] items-center overflow-hidden pt-20">
      <Container className="gap-gutter py-section grid grid-cols-1 items-center lg:grid-cols-2">
        <div className="space-y-6">
          <span className="text-label-sm text-primary-container font-mono tracking-widest uppercase">
            Established 2018
          </span>
          <h1 className="font-display text-on-surface text-glow md:text-display-lg text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            Powering Africa&apos;s Intelligent Enterprise Through AI, Cloud
            &amp; Digital Transformation
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-xl">
            In a new era defined by artificial intelligence and escalating
            digital complexity, Expervia Technologies stands as the catalyst for
            organizational evolution across the continent.
          </p>
          <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
            {pillars.map((p) => (
              <div key={p.title} className="glass-card rounded-xl p-6">
                <h3 className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
                  {p.title}
                </h3>
                <p className="text-body-md text-on-surface">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Image placeholder — TODO: replace with real asset via next/image */}
        <div className="group relative hidden aspect-square lg:block">
          <div className="bg-primary/10 group-hover:bg-primary/20 absolute -inset-4 rounded-full blur-3xl transition-all duration-700" />
          <div className="bg-surface-container-high relative z-10 flex size-full items-center justify-center rounded-2xl border border-white/10 shadow-2xl">
            <Building2 className="text-on-surface-variant/30 size-24" />
          </div>
        </div>
      </Container>
    </section>
  );
}
