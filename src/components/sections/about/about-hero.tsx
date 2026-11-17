import { Compass, Target } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";

const pillars = [
  {
    icon: Compass,
    title: "Our Vision",
    body: "To be the global leader in driving transformative IT experiences, fostering innovation, and reshaping how businesses interact with technology through unparalleled customer experience and cutting-edge solutions.",
  },
  {
    icon: Target,
    title: "Our Mission",
    body: "To revolutionize the IT landscape by delivering innovative, tailored solutions that create exceptional customer experiences and empower our partners and customers to thrive in a dynamic digital world.",
  },
];

export function AboutHero() {
  return (
    <PageHero
      id="about-hero-heading"
      eyebrow="Established 2018"
      title={
        <>
          Powering Africa&apos;s Intelligent Enterprise Through{" "}
          <span className="text-brand-200">
            AI, Cloud &amp; Digital Transformation
          </span>
        </>
      }
      intro="In a new era defined by artificial intelligence and escalating digital complexity, Expervia Technologies stands as the catalyst for organizational evolution across the continent."
      aside={
        <ul className="grid gap-4">
          {pillars.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <span className="text-brand-100 inline-flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Icon aria-hidden className="size-5" />
                </span>
                <h2 className="text-brand-200 text-xs font-bold tracking-[0.2em] uppercase">
                  {title}
                </h2>
              </div>
              <p className="text-brand-50 mt-4 leading-relaxed">{body}</p>
            </li>
          ))}
        </ul>
      }
    />
  );
}
