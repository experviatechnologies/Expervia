import { ButtonLink } from "@/components/site/ui";
import { PageHero } from "@/components/site/page-hero";

export function IndustriesHero() {
  return (
    <PageHero
      id="industries-hero-heading"
      eyebrow="Industries & Expertise"
      title={
        <>
          Industry-Focused Technology Solutions for a{" "}
          <span className="text-brand-200">Digital-First World</span>
        </>
      }
      actions={
        <ButtonLink href="/services" variant="light" arrow>
          Explore Solutions
        </ButtonLink>
      }
    >
      <p className="font-jakarta mt-6 text-xl font-bold text-white sm:text-2xl">
        Helping Organizations Transform, Innovate, and Grow
      </p>
      <p className="text-brand-100/85 mt-4 max-w-2xl text-lg leading-relaxed">
        Every industry faces unique challenges, from strict regulatory
        requirements to supply chain complexities. Expervia&apos;s
        industry-focused approach ensures that AI, Cloud, and Cybersecurity
        aren&apos;t just buzzwords, but tools leveraged to deliver measurable
        business outcomes and operational resilience.
      </p>
    </PageHero>
  );
}
