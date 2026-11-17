import { Compass, Target } from "lucide-react";

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
    <section
      aria-labelledby="about-hero-heading"
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
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-8 lg:pt-24 lg:pb-28">
        <div>
          <p className="text-brand-100 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase">
            <span aria-hidden className="bg-brand-300 size-1.5 rounded-full" />
            Established 2018
          </p>
          <h1
            id="about-hero-heading"
            className="font-jakarta mt-6 text-[2.4rem] leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]"
          >
            Powering Africa&apos;s Intelligent Enterprise Through{" "}
            <span className="text-brand-200">
              AI, Cloud &amp; Digital Transformation
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">
            In a new era defined by artificial intelligence and escalating
            digital complexity, Expervia Technologies stands as the catalyst for
            organizational evolution across the continent.
          </p>
        </div>
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
      </div>
    </section>
  );
}
