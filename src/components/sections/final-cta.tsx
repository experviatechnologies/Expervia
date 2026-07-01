import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";

export function FinalCta() {
  return (
    <section
      id="contact"
      className="bg-primary-container text-on-primary-container relative overflow-hidden py-24"
    >
      <Container className="relative z-10">
        <div className="flex flex-col items-center justify-between gap-12 text-center md:flex-row md:text-left">
          <div className="max-w-3xl">
            <h2 className="font-display text-headline-lg mb-4 font-bold">
              Ready to Accelerate Your Digital Transformation?
            </h2>
            <p className="text-on-primary-container/80 text-lg">
              Speak with our experts today and discover how we can future-proof
              your enterprise operations.
            </p>
          </div>
          <Button
            asChild
            size="pill"
            className="bg-surface text-on-surface shrink-0 text-lg font-bold shadow-2xl hover:scale-105"
          >
            <Link href="/contact">Talk to an Expert</Link>
          </Button>
        </div>
      </Container>

      {/* Decorative abstract pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute size-full scale-150 rotate-12 border-y border-black/20" />
        <div className="absolute size-full scale-150 -rotate-12 border-x border-black/20" />
      </div>
    </section>
  );
}
