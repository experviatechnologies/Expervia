import { ButtonLink } from "@/components/site/ui";
import { PageHero } from "@/components/site/page-hero";

export function ServicesHero() {
  return (
    <PageHero
      id="services-hero-heading"
      eyebrow="Enterprise Portfolio"
      title={
        <>
          One Partner for AI, Cloud, Security &amp;{" "}
          <span className="text-brand-200">Digital Transformation</span>
        </>
      }
      intro="A full portfolio of specialized engineering and strategic implementation, powering Africa's intelligent enterprise from frontier technology to measurable business outcomes."
      actions={
        <>
          <ButtonLink href="/contact" variant="light" arrow>
            Book a Consultation
          </ButtonLink>
          <ButtonLink href="/contact" variant="outlineLight">
            Request an Assessment
          </ButtonLink>
        </>
      }
    />
  );
}
