import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";

export function CyberCta() {
  return (
    <section className="bg-surface-container-lowest py-section">
      <Container>
        <div className="bg-primary-container text-on-primary-container relative overflow-hidden rounded-3xl p-12 text-center md:p-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18)_0%,_transparent_70%)]" />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="font-display mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Ready to Strengthen Your Defenses?
            </h2>
            <p className="text-on-primary-container/80 text-body-lg mb-10">
              Let&apos;s pressure-test your security posture and build a roadmap
              to resilience — starting with a free assessment.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="pill"
                className="bg-surface text-on-surface font-bold hover:scale-105"
              >
                <Link href="/contact">Book a Consultation</Link>
              </Button>
              <Button
                asChild
                size="pill"
                className="bg-on-primary-container/10 text-on-primary-container border-on-primary-container/20 hover:bg-on-primary-container/20 border font-bold"
              >
                <Link href="/contact">Request an Assessment</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
