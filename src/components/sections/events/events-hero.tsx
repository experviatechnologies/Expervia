import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";

export function EventsHero() {
  return (
    <section className="pb-section relative overflow-hidden pt-40">
      <div className="absolute inset-0 -z-10">
        <div className="hero-mesh absolute inset-0" />
        <div className="from-surface via-surface/80 absolute inset-0 bg-gradient-to-r to-transparent" />
      </div>

      <Container className="relative z-10">
        <div className="max-w-3xl">
          <span className="border-primary/20 bg-primary/10 text-primary text-label-sm mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono tracking-wider uppercase">
            <CalendarDays className="size-4" />
            Expervia Technology Experts Network
          </span>
          <h1 className="font-display text-on-surface md:text-display-lg mb-6 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
            Connect. Learn. <span className="gradient-text">Build.</span> Lead.
          </h1>
          <p className="text-body-lg text-on-surface-variant mb-4 max-w-xl">
            Technology events for Africa&apos;s Microsoft &amp; digital
            technology community.
          </p>
          <p className="text-body-md text-on-surface-variant/80 mb-10 max-w-2xl">
            Join the Expervia Technology Experts Network (ETEN). Engage in
            high-impact discussions, hands-on workshops, and strategic
            masterclasses designed to accelerate your expertise and career in
            the modern enterprise landscape.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild variant="brand" size="pill" className="font-bold">
              <Link href="#register">
                Register for an Event
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              variant="brandOutline"
              size="pill"
              className="font-bold"
            >
              <Link href="#get-involved">Become a Speaker</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
