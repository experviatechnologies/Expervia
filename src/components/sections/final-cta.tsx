import { ButtonLink } from "@/components/site/ui";
import { NetworkGraphic } from "@/components/site/network-graphic";

/** Home closing call to action, in the Join ETEN rounded indigo panel. */
export function FinalCta() {
  return (
    <section
      id="contact"
      aria-labelledby="home-final-heading"
      className="bg-white px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8"
    >
      <div className="from-brand-950 via-brand-900 to-brand-700 relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br px-6 py-16 text-white shadow-[0_40px_80px_-40px_rgba(33,0,93,0.9)] sm:px-12 sm:py-20">
        <NetworkGraphic
          idPrefix="home-cta"
          className="absolute -right-24 -bottom-24 -z-10 w-[420px] rotate-180 opacity-30"
        />
        <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
          <div className="max-w-3xl">
            <h2
              id="home-final-heading"
              className="font-jakarta text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
            >
              Ready to Accelerate Your Digital Transformation?
            </h2>
            <p className="text-brand-100/90 mt-5 text-lg leading-relaxed">
              Speak with our experts today and discover how we can future-proof
              your enterprise operations.
            </p>
          </div>
          <ButtonLink
            href="/contact"
            variant="light"
            arrow
            className="shrink-0"
          >
            Talk to an Expert
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
