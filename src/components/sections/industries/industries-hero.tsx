import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

export function IndustriesHero() {
  return (
    <section className="hero-mesh pb-section relative overflow-hidden pt-40">
      <Container className="relative z-10">
        <div className="max-w-4xl">
          <SectionLabel className="mb-4">
            Industries &amp; Expertise
          </SectionLabel>
          <h1 className="font-display text-on-surface md:text-display-lg mb-6 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            Industry-Focused Technology Solutions for a{" "}
            <span className="text-primary">Digital-First World</span>
          </h1>
          <p className="font-display text-headline-md text-on-surface-variant mb-8 max-w-2xl font-semibold">
            Helping Organizations Transform, Innovate, and Grow
          </p>
          <p className="text-body-lg text-on-surface-variant/80 mb-10 max-w-3xl leading-relaxed">
            Every industry faces unique challenges—from strict regulatory
            requirements to supply chain complexities. Expervia&apos;s
            industry-focused approach ensures that AI, Cloud, and Cybersecurity
            aren&apos;t just buzzwords, but tools leveraged to deliver
            measurable business outcomes and operational resilience.
          </p>
          <Button asChild variant="brand" size="pill" className="font-semibold">
            <Link href="/services">
              Explore Solutions
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
