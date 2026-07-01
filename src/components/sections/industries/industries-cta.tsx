import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";

export function IndustriesCta() {
  return (
    <section className="bg-surface py-section relative overflow-hidden">
      <Container className="relative z-10">
        <div className="glass-card flex flex-col items-center rounded-3xl p-12 text-center md:p-20">
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            Building the Intelligent Enterprise Across Every Industry
          </h2>
          <p className="text-body-lg text-on-surface-variant mb-12 max-w-2xl">
            Technology is reshaping every sector. Partner with Expervia to lead
            your industry&apos;s digital evolution.
          </p>
          <div className="flex w-full flex-col gap-6 md:w-auto md:flex-row">
            <Button
              asChild
              variant="brand"
              size="pill"
              className="primary-glow text-lg font-bold"
            >
              <Link href="/contact">Book an Industry Consultation</Link>
            </Button>
            <Button
              asChild
              variant="brandOutline"
              size="pill"
              className="text-lg font-bold"
            >
              <Link href="/contact">Speak with an Expert</Link>
            </Button>
          </div>
          <Link
            href="/contact"
            className="text-on-surface-variant hover:text-primary text-label-sm mt-8 font-mono tracking-widest uppercase transition-colors"
          >
            Request an Assessment
          </Link>
        </div>
      </Container>
    </section>
  );
}
