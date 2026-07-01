import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-[linear-gradient(to_bottom,rgba(0,0,0,0.6),rgba(0,0,0,0.6)),url('/hero_background.png')] bg-cover bg-center bg-no-repeat pt-20">
      {/* Ambient backdrop — placeholder for the hero image.
          TODO: drop a real asset in /public and swap to next/image. */}

      {/*         
      <div className="absolute inset-0 z-0">
        <div className="bg-surface-container-low absolute inset-0" />
        <div className="bg-brand/20 absolute -top-40 left-1/4 size-[600px] rounded-full blur-[140px]" />
        <div className="bg-secondary-container/20 absolute right-1/4 -bottom-40 size-[500px] rounded-full blur-[140px]" />
        <div className="from-surface/40 to-surface absolute inset-0 bg-gradient-to-b" />
      </div> */}

      <Container className="relative z-20 w-full py-24">
        <div className="max-w-4xl">
          <span className="text-label-sm text-primary border-primary/30 mb-6 inline-block rounded-full border px-3 py-1 font-mono tracking-widest uppercase">
            Enterprise Intelligence
          </span>
          <h1 className="font-display text-on-surface md:text-display-lg mb-8 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
            Powering Africa&apos;s Intelligent Enterprise Through{" "}
            <span className="text-primary">
              AI, Cloud &amp; Digital Transformation.
            </span>
          </h1>
          <p className="text-body-lg text-on-surface-variant mb-10 max-w-2xl">
            As a Microsoft AI Cloud Partner, Cloud Solution Provider (CSP), and
            Huawei Enterprise Partner, we deliver the global expertise and local
            market knowledge required to thrive.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="brand"
              size="pill"
              className="primary-glow font-bold"
            >
              <Link href="/contact">Book a Consultation</Link>
              <CalendarDays />
            </Button>
            <Button variant="brandOutline" size="pill" className="font-bold">
              <Link href="/services">Explore Solutions</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
