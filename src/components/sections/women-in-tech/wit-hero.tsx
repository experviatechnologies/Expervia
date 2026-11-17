import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/site/ui";
import { WIT_JOIN_HREF } from "@/config/women-in-tech";
import { TrackedLink } from "./tracking";

export function WitHero() {
  return (
    <section
      id="top"
      aria-labelledby="wit-hero-heading"
      className="bg-brand-950 relative isolate overflow-hidden pt-20 text-white"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_85%_-10%,rgba(100,38,220,0.65),transparent_60%),radial-gradient(800px_500px_at_-10%_110%,rgba(124,77,255,0.35),transparent_60%),linear-gradient(160deg,#21005D_0%,#2D006B_55%,#1A0049_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] bg-[size:56px_56px]"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8 lg:pt-24 lg:pb-28">
        <div>
          <p className="text-brand-100 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase">
            <span aria-hidden className="bg-brand-300 size-1.5 rounded-full" />
            ETEN Women in Tech
          </p>
          <h1
            id="wit-hero-heading"
            className="font-jakarta mt-6 text-[2.4rem] leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.6rem]"
          >
            Your Future in Technology Starts With the{" "}
            <span className="text-brand-200">Right Community.</span>
          </h1>
          <p className="font-jakarta text-brand-200 mt-5 text-xl font-bold tracking-tight sm:text-2xl">
            Connect. Empower. Lead.
          </p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">
            A professional community where women connect, develop practical
            skills, access mentorship, collaborate and create opportunities in
            technology.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <TrackedLink
              href={WIT_JOIN_HREF}
              event="women_in_tech_join_click"
              location="hero"
              className={buttonClass("light")}
            >
              Join ETEN Women in Tech
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </TrackedLink>
            <TrackedLink
              href="#contribute"
              event="women_in_tech_contributor_click"
              location="hero"
              className={buttonClass("outlineLight")}
            >
              Become a Contributor
            </TrackedLink>
          </div>
          <p className="text-brand-100/80 mt-6 text-sm">
            Open to students, career explorers and professionals. No advanced
            technical background required.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div
            aria-hidden
            className="bg-brand-600/50 absolute -inset-6 rounded-[2.5rem] blur-3xl"
          />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
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
          <p className="bg-brand-950/80 absolute -bottom-5 left-6 rounded-2xl border border-white/15 px-5 py-3 text-sm text-white shadow-xl backdrop-blur-md">
            A community by{" "}
            <span className="text-brand-200 font-semibold">
              Expervia Technologies
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
