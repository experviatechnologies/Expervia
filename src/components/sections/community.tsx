import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";
import Link from "next/link";

export function Community() {
  return (
    <section id="resources" className="bg-surface py-section">
      <Container>
        <div className="glass-panel relative mx-auto max-w-5xl overflow-hidden rounded-3xl p-12 text-center md:p-20">
          <div className="bg-primary/10 absolute -top-24 -left-24 size-64 rounded-full blur-[100px]" />
          <div className="bg-secondary-container/10 absolute -right-24 -bottom-24 size-64 rounded-full blur-[100px]" />

          <SectionLabel className="mb-6">Empowering Africa</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg md:text-display-lg mb-8 font-extrabold">
            Building Africa&apos;s Next Generation of{" "}
            <span className="text-primary">AI &amp; Cloud Professionals.</span>
          </h2>
          <p className="text-body-lg text-on-surface-variant mx-auto mb-12 max-w-3xl">
            Join the Expervia AI &amp; Cloud Community. We are dedicated to
            bridging the digital skills gap by providing world-class training,
            mentorship, and opportunities to talent across the continent.
          </p>
          <div className="flex flex-col justify-center gap-6 sm:flex-row">
            <Button
              asChild
              variant="brand"
              size="pill"
              className="primary-glow font-bold"
            >
              <Link href="/contact">
                Join the Community
                <Users />
              </Link>
            </Button>
            <Button
              asChild
              variant="brandOutline"
              size="pill"
              className="font-bold"
            >
              <Link href="/contact">View Training Programs</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
