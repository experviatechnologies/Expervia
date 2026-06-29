import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";

export function AboutCta() {
  return (
    <section className="py-section relative overflow-hidden">
      <div className="bg-primary/5 absolute inset-0" />
      <Container className="relative z-10 text-center">
        <div className="glass-card relative overflow-hidden rounded-3xl p-12 md:p-24">
          <div className="bg-primary/20 absolute top-0 right-0 size-64 blur-[100px]" />
          <h2 className="font-display text-on-surface text-headline-lg mb-6 font-bold">
            Building Africa&apos;s Intelligent Future
          </h2>
          <p className="text-body-lg text-on-surface-variant mx-auto mb-10 max-w-xl">
            Join the forward-thinking organizations building the future on
            Expervia&apos;s intelligence framework. Let&apos;s architect your
            success story together.
          </p>
          <Button
            variant="brand"
            size="pill"
            className="primary-glow font-bold"
          >
            Schedule an Architecture Review
          </Button>
        </div>
      </Container>
    </section>
  );
}
