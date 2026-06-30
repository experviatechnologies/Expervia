import Link from "next/link";
import { BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";

const chips = [
  "Data Strategy",
  "Modern Data Platform",
  "BI & Dashboards",
  "Data Engineering",
  "Governance",
  "Predictive Analytics",
];

export function DataHero() {
  return (
    <section className="pb-section relative overflow-hidden pt-40">
      <div className="absolute inset-0 -z-10">
        <div className="hero-mesh absolute inset-0" />
        <div className="primary-glow absolute -top-32 right-0 size-[40rem] opacity-40" />
        <div className="from-surface absolute inset-0 bg-gradient-to-t to-transparent" />
      </div>

      <Container className="relative z-10">
        <div className="max-w-3xl">
          <span className="border-primary/20 bg-primary/10 text-primary text-label-sm mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono tracking-wider uppercase">
            <BarChart3 className="size-4" />
            Data & Analytics
          </span>
          <h1 className="font-display text-on-surface md:text-display-lg mb-6 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
            Turn Raw Data Into Decisive{" "}
            <span className="gradient-text">Intelligence</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant mb-8 max-w-xl">
            We unify your data, modernize the platform beneath it, and surface
            the insight that drives faster, smarter decisions — from real-time
            dashboards to predictive models.
          </p>

          <div className="mb-10 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="border-outline-variant bg-surface-container text-on-surface-variant rounded-full border px-3 py-1 text-xs font-medium"
              >
                {c}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild variant="brand" size="pill" className="font-bold">
              <Link href="/contact">
                Talk to a Data Expert
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              variant="brandOutline"
              size="pill"
              className="font-bold"
            >
              <Link href="/contact">Book a Consultation</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
