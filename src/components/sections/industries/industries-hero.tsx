import { ButtonLink } from "@/components/site/ui";
import { NetworkGraphic } from "@/components/site/network-graphic";

export function IndustriesHero() {
  return (
    <section
      aria-labelledby="industries-hero-heading"
      className="bg-brand-950 relative isolate overflow-hidden pt-20 text-white"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_85%_-10%,rgba(100,38,220,0.65),transparent_60%),radial-gradient(800px_500px_at_-10%_110%,rgba(124,77,255,0.35),transparent_60%),linear-gradient(160deg,#21005D_0%,#2D006B_55%,#1A0049_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] bg-[size:56px_56px]"
      />
      <NetworkGraphic
        idPrefix="industries-hero"
        className="absolute top-24 -right-16 -z-10 hidden w-[520px] opacity-50 lg:block"
      />
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="max-w-3xl">
          <p className="text-brand-100 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase">
            <span aria-hidden className="bg-brand-300 size-1.5 rounded-full" />
            Industries &amp; Expertise
          </p>
          <h1
            id="industries-hero-heading"
            className="font-jakarta mt-6 text-[2.4rem] leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.6rem]"
          >
            Industry-Focused Technology Solutions for a{" "}
            <span className="text-brand-200">Digital-First World</span>
          </h1>
          <p className="font-jakarta mt-6 text-xl font-bold text-white sm:text-2xl">
            Helping Organizations Transform, Innovate, and Grow
          </p>
          <p className="text-brand-100/85 mt-4 max-w-2xl text-lg leading-relaxed">
            Every industry faces unique challenges, from strict regulatory
            requirements to supply chain complexities. Expervia&apos;s
            industry-focused approach ensures that AI, Cloud, and Cybersecurity
            aren&apos;t just buzzwords, but tools leveraged to deliver
            measurable business outcomes and operational resilience.
          </p>
          <div className="mt-9">
            <ButtonLink href="/services" variant="light" arrow>
              Explore Solutions
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
