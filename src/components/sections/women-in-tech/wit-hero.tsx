import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { WIT_JOIN_HREF } from "@/config/women-in-tech";
import { TrackedLink } from "./tracking";

export function WitHero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="hero-mesh absolute inset-0" />
        <div className="bg-brand/20 absolute -top-32 right-0 size-[520px] rounded-full blur-[140px]" />
        <div className="absolute bottom-0 -left-40 size-[420px] rounded-full bg-fuchsia-500/10 blur-[140px]" />
      </div>

      <Container className="relative max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <span className="border-primary/20 bg-primary/10 text-primary text-label-sm mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono tracking-wider uppercase">
              <Sparkles className="size-4" aria-hidden />
              ETEN Women in Tech
            </span>

            <h1 className="font-display text-on-surface md:text-display-lg mb-5 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl">
              Your Future in Technology Starts With the{" "}
              <span className="gradient-text">Right Community.</span>
            </h1>

            <p className="font-display mb-6 text-xl font-bold tracking-tight text-fuchsia-200 italic sm:text-2xl">
              Connect. Empower. Lead.
            </p>

            <p className="text-body-lg text-on-surface-variant mb-10 max-w-xl">
              A professional community where women connect, develop practical
              skills, access mentorship, collaborate and create opportunities in
              technology.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild variant="brand" size="pill" className="font-bold">
                <TrackedLink
                  href={WIT_JOIN_HREF}
                  event="women_in_tech_join_click"
                  location="hero"
                >
                  Join ETEN Women in Tech
                  <ArrowRight aria-hidden />
                </TrackedLink>
              </Button>
              <Button
                asChild
                variant="brandOutline"
                size="pill"
                className="font-bold"
              >
                <TrackedLink
                  href="#contribute"
                  event="women_in_tech_contributor_click"
                  location="hero"
                >
                  Become a Contributor
                </TrackedLink>
              </Button>
            </div>

            <p className="text-on-surface-variant/80 mt-6 text-sm">
              Open to students, career explorers and professionals. No advanced
              technical background required.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div
              aria-hidden
              className="from-brand/60 absolute -inset-3 rounded-[2rem] bg-gradient-to-br via-fuchsia-500/30 to-transparent opacity-70 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
              <Image
                src="/women-in-tech/hero-women.webp"
                alt="Three smiling women professionals in purple and dark business attire, representing the ETEN Women in Tech community"
                width={800}
                height={827}
                priority
                sizes="(min-width: 1024px) 45vw, (min-width: 640px) 512px, 100vw"
                className="h-auto w-full"
              />
            </div>
            <p className="bg-surface/85 text-on-surface absolute -bottom-5 left-6 rounded-2xl border border-white/10 px-5 py-3 text-sm shadow-xl backdrop-blur-md">
              A community by{" "}
              <span className="text-primary font-semibold">
                Expervia Technologies
              </span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
