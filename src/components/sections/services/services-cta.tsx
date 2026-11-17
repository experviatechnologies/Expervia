import { ButtonLink } from "@/components/site/ui";
import { NetworkGraphic } from "@/components/site/network-graphic";

export function ServicesCta() {
  return (
    <section
      aria-labelledby="services-cta-heading"
      className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="from-brand-950 via-brand-900 to-brand-700 relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br px-6 py-16 text-center text-white shadow-[0_40px_80px_-40px_rgba(33,0,93,0.9)] sm:px-12 sm:py-20">
        <NetworkGraphic
          idPrefix="services-cta-a"
          className="absolute -top-20 -left-24 -z-10 w-[420px] opacity-30"
        />
        <NetworkGraphic
          idPrefix="services-cta-b"
          className="absolute -right-24 -bottom-24 -z-10 w-[420px] rotate-180 opacity-30"
        />
        <h2
          id="services-cta-heading"
          className="font-jakarta mx-auto max-w-3xl text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl"
        >
          Ready to Accelerate Your Transformation?
        </h2>
        <p className="text-brand-100/90 mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
          Schedule a strategy session with our specialists to map your technical
          roadmap and pinpoint immediate, high-ROI opportunities.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/contact" variant="light" arrow>
            Speak with an Expert
          </ButtonLink>
          <ButtonLink href="/contact" variant="outlineLight">
            Book a Consultation
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
