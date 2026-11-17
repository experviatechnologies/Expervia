import { ButtonLink } from "@/components/site/ui";
import { NetworkGraphic } from "@/components/site/network-graphic";

export function AboutCta() {
  return (
    <section
      aria-labelledby="about-cta-heading"
      className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="from-brand-950 via-brand-900 to-brand-700 relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br px-6 py-16 text-center text-white shadow-[0_40px_80px_-40px_rgba(33,0,93,0.9)] sm:px-12 sm:py-20">
        <NetworkGraphic
          idPrefix="about-cta-a"
          className="absolute -top-20 -left-24 -z-10 w-[420px] opacity-30"
        />
        <NetworkGraphic
          idPrefix="about-cta-b"
          className="absolute -right-24 -bottom-24 -z-10 w-[420px] rotate-180 opacity-30"
        />
        <h2
          id="about-cta-heading"
          className="font-jakarta mx-auto max-w-3xl text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl"
        >
          Building Africa&apos;s Intelligent Future
        </h2>
        <p className="text-brand-100/90 mx-auto mt-6 max-w-xl text-lg leading-relaxed">
          Join the forward-thinking organizations building the future on
          Expervia&apos;s intelligence framework. Let&apos;s architect your
          success story together.
        </p>
        <div className="mt-9 flex justify-center">
          <ButtonLink href="/contact" variant="light" arrow>
            Schedule an Architecture Review
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
