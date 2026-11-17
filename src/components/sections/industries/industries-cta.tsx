import Link from "next/link";
import { ButtonLink } from "@/components/site/ui";
import { NetworkGraphic } from "@/components/site/network-graphic";

export function IndustriesCta() {
  return (
    <section
      aria-labelledby="industries-cta-heading"
      className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="from-brand-950 via-brand-900 to-brand-700 relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br px-6 py-16 text-center text-white shadow-[0_40px_80px_-40px_rgba(33,0,93,0.9)] sm:px-12 sm:py-20">
        <NetworkGraphic
          idPrefix="industries-cta-a"
          className="absolute -top-20 -left-24 -z-10 w-[420px] opacity-30"
        />
        <NetworkGraphic
          idPrefix="industries-cta-b"
          className="absolute -right-24 -bottom-24 -z-10 w-[420px] rotate-180 opacity-30"
        />
        <h2
          id="industries-cta-heading"
          className="font-jakarta mx-auto max-w-3xl text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl"
        >
          Building the Intelligent Enterprise Across Every Industry
        </h2>
        <p className="text-brand-100/90 mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
          Technology is reshaping every sector. Partner with Expervia to lead
          your industry&apos;s digital evolution.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/contact" variant="light" arrow>
            Book an Industry Consultation
          </ButtonLink>
          <ButtonLink href="/contact" variant="outlineLight">
            Speak with an Expert
          </ButtonLink>
        </div>
        <Link
          href="/contact"
          className="text-brand-200 mt-7 inline-block text-xs font-bold tracking-[0.2em] uppercase transition-colors hover:text-white"
        >
          Request an Assessment
        </Link>
      </div>
    </section>
  );
}
