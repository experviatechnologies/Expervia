import Link from "next/link";
import { BadgeCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";

export function HuaweiHero() {
  return (
    <section className="pb-section relative overflow-hidden pt-40">
      <div className="absolute inset-0 -z-10">
        <div className="hero-mesh absolute inset-0" />
        <div className="from-surface via-surface/80 absolute inset-0 bg-gradient-to-r to-transparent" />
      </div>

      <Container className="relative z-10">
        <div className="max-w-3xl">
          <span className="border-primary/20 bg-primary/10 text-primary text-label-sm mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono tracking-wider uppercase">
            <BadgeCheck className="size-4" />
            Huawei Enterprise Partner
          </span>
          <h1 className="font-display text-on-surface md:text-display-lg mb-6 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
            Join the Expervia{" "}
            <span className="gradient-text">Huawei Professionals</span>{" "}
            Community
          </h1>
          <p className="text-body-lg text-on-surface-variant mb-10 max-w-xl">
            Building Africa&apos;s premier network of Huawei-certified
            professionals. Scale your impact with the region&apos;s elite cloud
            and infrastructure ecosystem.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild variant="brand" size="pill" className="font-bold">
              <Link href="#apply">
                Apply to Join
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              variant="brandOutline"
              size="pill"
              className="font-bold"
            >
              <Link href="#foundation">View Our Vision</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
