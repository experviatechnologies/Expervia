import type { Metadata } from "next";
import { Check, Info, Target } from "lucide-react";
import { siteConfig } from "@/config/site";
import {
  audiences,
  benefits,
  communities,
  etenFaqs,
  etenSubnav,
  finalCtaPoints,
  heroDomains,
  joinSteps,
  leadershipRoles,
  PartnerIcon,
  partnerships,
} from "@/config/join-eten";
import {
  ButtonLink,
  IconBadge,
  PageSubnav,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";
import { NetworkGraphic } from "@/components/site/network-graphic";
import { FaqList } from "@/components/site/faq-list";
import { StepTrack } from "@/components/site/step-track";
import { cn } from "@/lib/utils";

const TITLE = "Join ETEN | Expervia Technologies Expert Network";
const DESCRIPTION =
  "Join the Expervia Technologies Expert Network (ETEN): a professional community connecting technology professionals, emerging talents and industry experts across Africa and beyond.";
const URL = `${siteConfig.url}/join-eten`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    type: "website",
    url: URL,
    siteName: "Expervia Technologies",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${siteConfig.url}/join-eten/og-image.png`,
        alt: "Join ETEN: Connect. Collaborate. Build. Grow.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const JOIN_HREF = "/join";

export default function JoinEtenPage() {
  const [featured, ...otherBenefits] = benefits;

  return (
    <>
      {/* HERO (sits under the fixed 80px site header) */}
      <section
        id="top"
        aria-labelledby="hero-heading"
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
              <span
                aria-hidden
                className="bg-brand-300 size-1.5 rounded-full"
              />
              Expervia Technologies Expert Network
            </p>
            <h1
              id="hero-heading"
              className="font-jakarta mt-6 text-[2.6rem] leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-[4.4rem]"
            >
              <span>Connect. </span>
              <span className="text-brand-200">Collaborate. </span>
              <span>Build. </span>
              <span className="text-brand-200">Grow.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
              Join a growing network of technology professionals, engineers,
              developers, cloud architects, cybersecurity specialists, data
              professionals and industry experts shaping the future of
              technology across Africa and beyond.
            </p>
            <p className="text-brand-100/80 mt-4 max-w-2xl text-base leading-relaxed">
              The Expervia Technologies Expert Network (ETEN) brings technology
              professionals together to share knowledge, build meaningful
              connections, collaborate on real-world projects, develop their
              skills and access opportunities within a growing technology
              ecosystem. Whether you are an experienced professional, an
              emerging technology enthusiast, a specialist or an industry
              leader, there is a place for you in ETEN.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href={JOIN_HREF} variant="light" arrow>
                Join the ETEN Community
              </ButtonLink>
              <ButtonLink href="#benefits" variant="outlineLight">
                Discover What ETEN Offers
              </ButtonLink>
            </div>
          </div>
          <div className="relative mx-auto hidden w-full max-w-[520px] sm:block">
            <NetworkGraphic idPrefix="hero" className="w-full" />
            <ul
              aria-label="Technology domains"
              className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2"
            >
              {heroDomains.map(({ icon: Icon, label }) => (
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

      <PageSubnav label="ETEN" links={etenSubnav} />

      {/* WHAT IS ETEN */}
      <Section id="about" labelledBy="about-heading">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <SectionIntro
              id="about-heading"
              eyebrow="What is ETEN?"
              title="More Than a Technology Community. A Network Built for Growth."
            />
            <div className="text-ink/80 mt-7 space-y-5 text-lg leading-relaxed">
              <p>
                The Expervia Technologies Expert Network (ETEN) is a
                professional technology community established by Expervia
                Technologies to connect skilled professionals, emerging talents
                and industry experts across different areas of technology.
              </p>
              <p>
                We believe that the future of technology is built through
                collaboration, shared knowledge and access to the right
                opportunities. ETEN provides an ecosystem where members can
                connect with like-minded professionals, participate in
                specialist communities, exchange ideas, contribute to technical
                initiatives, mentor emerging talents and collaborate on projects
                that create real value.
              </p>
            </div>
          </div>
          <aside
            aria-label="Our mission"
            className="from-brand-900 to-brand-700 relative self-center overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white shadow-[0_30px_60px_-30px_rgba(33,0,93,0.7)] sm:p-10"
          >
            <div
              aria-hidden
              className="absolute -top-16 -right-16 size-56 rounded-full bg-white/10 blur-2xl"
            />
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Target aria-hidden className="size-6" />
            </span>
            <p className="text-brand-200 mt-6 text-xs font-bold tracking-[0.2em] uppercase">
              Our mission
            </p>
            <p className="font-jakarta mt-3 text-2xl leading-snug font-bold sm:text-[1.7rem]">
              Our mission is to build a connected technology ecosystem that
              empowers professionals to learn, contribute, innovate and grow
              together.
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["Learn", "Contribute", "Innovate", "Grow"].map((w) => (
                <li
                  key={w}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-center text-sm font-semibold"
                >
                  {w}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Section>

      {/* BENEFITS */}
      <Section id="benefits" labelledBy="benefits-heading" tone="lavender">
        <SectionIntro
          id="benefits-heading"
          eyebrow="Why join ETEN?"
          title="Be Part of Something Bigger."
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <li className="bg-brand-900 relative overflow-hidden rounded-3xl p-7 text-white shadow-[0_24px_50px_-28px_rgba(33,0,93,0.8)] sm:col-span-2 lg:p-9">
            <div
              aria-hidden
              className="bg-brand-600/40 absolute -right-24 -bottom-24 size-72 rounded-full blur-3xl"
            />
            <IconBadge icon={featured.icon} dark />
            <h3 className="font-jakarta mt-6 text-2xl font-bold sm:text-3xl">
              {featured.title}
            </h3>
            <p className="text-brand-100/90 mt-4 max-w-md text-lg leading-relaxed">
              {featured.description}
            </p>
          </li>
          {otherBenefits.map((b) => (
            <li
              key={b.title}
              className={cn(cardClass, "shadow-[0_1px_2px_rgba(33,0,93,0.04)]")}
            >
              <IconBadge icon={b.icon} />
              <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                {b.title}
              </h3>
              <p className="text-ink/75 mt-2.5 leading-relaxed">
                {b.description}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* COMMUNITIES */}
      <Section id="communities" labelledBy="communities-heading">
        <SectionIntro
          id="communities-heading"
          eyebrow="Explore our technology communities"
          title="Find Your Community. Share Your Expertise."
          intro="ETEN brings together professionals across multiple technology domains through specialist communities and Pods."
        />
        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((c, i) => (
            <li
              key={c.title}
              className="group border-brand-100 hover:border-brand-300 relative flex flex-col overflow-hidden rounded-3xl border bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(33,0,93,0.45)]"
            >
              <span
                aria-hidden
                className="from-brand-900 via-brand-600 to-brand-300 absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100"
              />
              <div className="flex items-start justify-between gap-4">
                <IconBadge icon={c.icon} />
                <span
                  aria-hidden
                  className="font-jakarta text-brand-200 text-sm font-bold"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-jakarta text-brand-950 mt-5 text-xl leading-snug font-bold">
                {c.title}
              </h3>
              <ul
                aria-label={`${c.title} focus areas`}
                className="border-brand-100 mt-5 space-y-2.5 border-t pt-5"
              >
                {c.items.map((item) => (
                  <li
                    key={item}
                    className="text-ink/80 flex items-start gap-2.5 text-[0.95rem]"
                  >
                    <Check
                      aria-hidden
                      className="text-brand-600 mt-0.5 size-4 shrink-0"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="text-ink/75 mt-10 max-w-2xl text-lg leading-relaxed">
          Members can participate in communities aligned with their professional
          experience, interests and development goals.
        </p>
      </Section>

      {/* WHO SHOULD JOIN */}
      <Section id="who-should-join" labelledBy="who-heading" tone="lavender">
        <SectionIntro
          id="who-heading"
          eyebrow="Who should join ETEN?"
          title="There Is a Place for You in the Network."
          center
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {audiences.map((a, i) => (
            <li
              key={a.title}
              className={cn(
                cardClass,
                "lg:col-span-2",
                i === 3 && "lg:col-start-2",
                i === 4 && "sm:col-span-2",
              )}
            >
              <IconBadge icon={a.icon} />
              <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                {a.title}
              </h3>
              <p className="text-ink/75 mt-2.5 leading-relaxed">
                {a.description}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* LEADERSHIP */}
      <Section id="leadership" labelledBy="leadership-heading" tone="indigo">
        <SectionIntro
          id="leadership-heading"
          eyebrow="Become more than a member"
          title="Contribute. Lead. Make an Impact."
          intro="ETEN is not just about joining a community. It is about becoming an active participant in a growing technology ecosystem."
          dark
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {leadershipRoles.map((r) => (
            <li
              key={r.title}
              className="flex gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition duration-300 hover:border-white/25 hover:bg-white/[0.08]"
            >
              <IconBadge icon={r.icon} dark />
              <div>
                <h3 className="font-jakarta text-lg font-bold text-white">
                  {r.title}
                </h3>
                <p className="text-brand-100/80 mt-1.5 leading-relaxed">
                  {r.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="from-brand-700/40 mt-12 flex flex-col items-start justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-r to-transparent p-7 sm:p-9 lg:flex-row lg:items-center">
          <p className="font-jakarta max-w-2xl text-xl leading-snug font-semibold text-white sm:text-2xl">
            Your expertise, experience and contribution can help shape the
            future of the network.
          </p>
          <ButtonLink href={JOIN_HREF} variant="light" arrow>
            Explore Leadership Opportunities
          </ButtonLink>
        </div>
      </Section>

      {/* HOW TO JOIN */}
      <Section id="how-to-join" labelledBy="how-heading">
        <SectionIntro
          id="how-heading"
          eyebrow="How to join ETEN"
          title="Getting Started Is Simple."
          center
        />
        <StepTrack steps={joinSteps} />
        <div className="mt-14 flex justify-center">
          <ButtonLink href={JOIN_HREF} arrow>
            Join ETEN Today
          </ButtonLink>
        </div>
      </Section>

      {/* WHY EXPERVIA */}
      <Section id="why-expervia" labelledBy="expervia-heading" tone="lavender">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionIntro
              id="expervia-heading"
              eyebrow="Why Expervia Technologies?"
              title="An Ecosystem Backed by Technology Expertise."
            />
            <p className="text-ink/80 mt-6 text-lg leading-relaxed">
              ETEN is an initiative of Expervia Technologies, a technology
              solutions and digital transformation company working with
              organisations to deliver innovative enterprise technology
              solutions.
            </p>
            <p className="text-ink/80 mt-5 text-lg leading-relaxed">
              Through its technology ecosystem, Expervia is committed to
              advancing technology knowledge, building professional networks and
              creating opportunities for collaboration and innovation. ETEN
              extends this vision by bringing technology professionals together
              to learn, connect and contribute.
            </p>
          </div>
          <div className="border-brand-100 rounded-3xl border bg-white p-7 shadow-[0_24px_50px_-34px_rgba(33,0,93,0.45)] sm:p-9">
            <h3 className="font-jakarta text-brand-950 text-lg font-bold">
              Partnerships and ecosystem relationships
            </h3>
            <p className="text-ink/70 mt-2">
              Expervia Technologies maintains strategic technology partnerships
              and ecosystem relationships, including:
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {partnerships.map((p) => (
                <li
                  key={p}
                  className="bg-lavender text-brand-950 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[0.95rem] font-semibold"
                >
                  <PartnerIcon
                    aria-hidden
                    className="text-brand-600 size-5 shrink-0"
                  />
                  {p}
                </li>
              ))}
            </ul>
            <p className="border-brand-100 text-ink/65 mt-6 flex gap-2.5 border-t pt-5 text-sm leading-relaxed">
              <Info
                aria-hidden
                className="text-brand-500 mt-0.5 size-4 shrink-0"
              />
              Partnerships listed are held by Expervia Technologies. ETEN is a
              community initiative of Expervia Technologies and is not itself a
              partner of these organisations.
            </p>
          </div>
        </div>
      </Section>

      {/* FAQS */}
      <Section id="faqs" labelledBy="faq-heading">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionIntro
            id="faq-heading"
            eyebrow="FAQs"
            title="Frequently Asked Questions"
          />
          <FaqList items={etenFaqs} />
        </div>
      </Section>

      {/* FINAL CTA */}
      <section
        aria-labelledby="final-cta-heading"
        className="bg-white px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8"
      >
        <div className="from-brand-950 via-brand-900 to-brand-700 relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br px-6 py-16 text-center text-white shadow-[0_40px_80px_-40px_rgba(33,0,93,0.9)] sm:px-12 sm:py-20">
          <NetworkGraphic
            idPrefix="cta-a"
            className="absolute -top-20 -left-24 -z-10 w-[420px] opacity-30"
          />
          <NetworkGraphic
            idPrefix="cta-b"
            className="absolute -right-24 -bottom-24 -z-10 w-[420px] rotate-180 opacity-30"
          />
          <h2
            id="final-cta-heading"
            className="font-jakarta mx-auto max-w-3xl text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl"
          >
            Your Network. Your Knowledge. Your Next Opportunity.
          </h2>
          <p className="text-brand-100/90 mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
            Technology grows when people connect, share knowledge and build
            together. Whether you are an experienced technology professional, an
            emerging talent, an instructor, an innovator or a technology
            enthusiast, ETEN gives you an opportunity to become part of a
            growing professional ecosystem.
          </p>
          <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {finalCtaPoints.map((p) => (
              <li
                key={p}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white"
              >
                {p}
              </li>
            ))}
          </ul>
          <p className="font-jakarta mt-9 text-xl font-semibold">
            Join the Expervia Technologies Expert Network today.
          </p>
          <div className="mt-7 flex justify-center">
            <ButtonLink href={JOIN_HREF} variant="light" arrow>
              Join ETEN Now
            </ButtonLink>
          </div>
          <p className="text-brand-200 mt-6 text-sm">
            An initiative of Expervia Technologies.
          </p>
        </div>
      </section>
    </>
  );
}
