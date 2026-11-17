import {
  BarChart3,
  BrainCircuit,
  Cloud,
  LayoutGrid,
  Network,
  ShieldCheck,
} from "lucide-react";
import { ButtonLink } from "@/components/site/ui";
import { NetworkGraphic } from "@/components/site/network-graphic";

const domains = [
  { icon: BrainCircuit, label: "AI" },
  { icon: Cloud, label: "Cloud" },
  { icon: ShieldCheck, label: "Security" },
  { icon: BarChart3, label: "Data" },
  { icon: LayoutGrid, label: "Microsoft" },
  { icon: Network, label: "Huawei" },
];

/** Home hero in the Join ETEN look (sits under the fixed 80px header). */
export function Hero() {
  return (
    <section
      aria-labelledby="home-hero-heading"
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
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:px-8 lg:pt-24 lg:pb-28">
        <div>
          <p className="text-brand-100 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase">
            <span aria-hidden className="bg-brand-300 size-1.5 rounded-full" />
            Enterprise Intelligence
          </p>
          <h1
            id="home-hero-heading"
            className="font-jakarta mt-6 text-[2.4rem] leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.6rem]"
          >
            Powering Africa&apos;s Intelligent Enterprise Through{" "}
            <span className="text-brand-200">
              AI, Cloud &amp; Digital Transformation.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            As a Microsoft AI Cloud Partner, Microsoft Cloud Solutions Partner,
            and Huawei Enterprise Partner, we deliver the global expertise and
            local market knowledge required to thrive.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href="/contact" variant="light" arrow>
              Book a Consultation
            </ButtonLink>
            <ButtonLink href="/services" variant="outlineLight">
              Explore Solutions
            </ButtonLink>
          </div>
        </div>
        <div className="relative mx-auto hidden w-full max-w-[520px] sm:block">
          <NetworkGraphic idPrefix="home-hero" className="w-full" />
          <ul
            aria-label="What we deliver"
            className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2"
          >
            {domains.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="bg-brand-950/60 text-brand-50 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur"
              >
                <Icon aria-hidden className="text-brand-200 size-3.5" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
