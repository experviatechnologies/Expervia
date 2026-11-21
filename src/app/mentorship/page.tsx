import Image from "next/image";
import {
  Award,
  BadgeCheck,
  BrainCircuit,
  Briefcase,
  Building2,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Cloud,
  CodeXml,
  Compass,
  Crown,
  Globe2,
  Hammer,
  Handshake,
  LayoutGrid,
  Layers,
  Lightbulb,
  Rocket,
  Route,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { MntNav } from "@/components/mentorship/mnt-nav";
import { MntFooter } from "@/components/mentorship/mnt-footer";
import { CtaPanel } from "@/components/site/cta-panel";
import { FaqList } from "@/components/site/faq-list";
import { NetworkGraphic } from "@/components/site/network-graphic";
import { Reveal } from "@/components/site/reveal";
import {
  ButtonLink,
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";
import { siteConfig } from "@/config/site";
import { pageMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";

/*
 * Public ETEN Mentorship landing, in the Expervia site's new look (Nov 2026):
 * indigo hero and feature bands, white and lavender content sections, the
 * shared site components, and scroll-reveal motion (Reveal) throughout.
 */

const PERSPECTIVE_FEATURES: { icon: LucideIcon; t: string; d: string }[] = [
  {
    icon: UserCheck,
    t: "100% direct practitioner mentorship",
    d: "Learn from active enterprise leaders, not theory.",
  },
  {
    icon: Briefcase,
    t: "Enterprise project readiness",
    d: "Real architectural rigour and delivery standards.",
  },
  {
    icon: Globe2,
    t: "Pan-African ecosystem network",
    d: "Connections that reach across the continent.",
  },
];

const GROWTH_MODEL: { icon: LucideIcon; t: string; d: string }[] = [
  { icon: Handshake, t: "Connect", d: "Find the right mentor or mentee." },
  {
    icon: Lightbulb,
    t: "Learn",
    d: "Gain knowledge, guidance and perspective.",
  },
  {
    icon: Hammer,
    t: "Build",
    d: "Develop practical skills through projects and real-world challenges.",
  },
  { icon: BadgeCheck, t: "Verify", d: "Demonstrate your growing capability." },
  {
    icon: TrendingUp,
    t: "Grow",
    d: "Build professional visibility, confidence and career opportunities.",
  },
];

const DOMAINS = [
  "Cloud & Infrastructure",
  "Modern Work / M365",
  "Cybersecurity",
  "Data & AI",
  "Business Applications",
  "Software Development",
  "Digital Transformation",
  "Technology Leadership",
];

const MENTEE_BENEFITS = [
  "Receive career and technical guidance",
  "Develop a structured learning plan",
  "Get support with certification pathways",
  "Learn from real-world enterprise experience",
  "Work through practical technology challenges",
  "Improve your professional confidence",
  "Build your industry network",
  "Prepare for enterprise project opportunities",
  "Receive feedback on your professional development",
];

const MENTOR_BENEFITS = [
  "Give back to the technology community",
  "Develop emerging technology professionals",
  "Share your enterprise experience",
  "Build your professional visibility",
  "Support certification and career development",
  "Participate in structured mentorship programmes",
  "Identify emerging talent",
  "Contribute to Africa's technology ecosystem",
];

const SPECIALIZATIONS: { icon: LucideIcon; t: string; d: string }[] = [
  {
    icon: Cloud,
    t: "Cloud & Infrastructure",
    d: "Azure, cloud architecture, networking and infrastructure.",
  },
  {
    icon: LayoutGrid,
    t: "Modern Work",
    d: "Microsoft 365, collaboration and productivity.",
  },
  {
    icon: ShieldCheck,
    t: "Cybersecurity",
    d: "Security, identity, compliance and risk.",
  },
  {
    icon: BrainCircuit,
    t: "Data & AI",
    d: "Data engineering, analytics, AI and machine learning.",
  },
  {
    icon: Layers,
    t: "Business Applications",
    d: "Dynamics 365, Power Platform and enterprise applications.",
  },
  {
    icon: CodeXml,
    t: "Software Development",
    d: "Software engineering, DevOps and application development.",
  },
  {
    icon: Workflow,
    t: "Digital Transformation",
    d: "Enterprise architecture, digital strategy and consulting.",
  },
  {
    icon: Crown,
    t: "Technology Leadership",
    d: "CIO, CTO, IT leadership and technology management.",
  },
];

const CANDIDATES = [
  "Students entering technology",
  "Junior technology professionals",
  "Mid-level professionals",
  "Career switchers",
  "Certification candidates",
  "Emerging consultants",
  "Developers and engineers",
  "Cloud professionals",
  "Cybersecurity professionals",
  "Data and AI professionals",
  "Professionals preparing for leadership",
];

const HOW_IT_WORKS: { icon: LucideIcon; t: string; d: string }[] = [
  {
    icon: ClipboardCheck,
    t: "Apply",
    d: "Tell us about your experience, goals, interests and areas of expertise.",
  },
  {
    icon: Search,
    t: "Assessment",
    d: "We review your profile, objectives and development needs.",
  },
  {
    icon: Handshake,
    t: "Match",
    d: "We pair mentor and mentee on expertise, goals and compatibility.",
  },
  {
    icon: Target,
    t: "Set goals",
    d: "Mentor and mentee agree clear objectives and a mentorship plan.",
  },
  {
    icon: CalendarCheck,
    t: "Meet & develop",
    d: "Regular sessions focused on practical learning and career growth.",
  },
  {
    icon: Hammer,
    t: "Build",
    d: "Where appropriate, mentees work on projects, case studies or challenges.",
  },
  {
    icon: BadgeCheck,
    t: "Review",
    d: "Progress is reviewed against the agreed objectives.",
  },
  {
    icon: Rocket,
    t: "Progress",
    d: "Successful mentees continue in the wider Expervia ecosystem and its opportunities.",
  },
];

const DIFFERENTIATORS: { icon: LucideIcon; t: string; d: string }[] = [
  {
    icon: Award,
    t: "Experienced mentors",
    d: "Learn directly from professionals with practical industry experience.",
  },
  {
    icon: Route,
    t: "Structured development",
    d: "Set clear goals rather than relying on informal conversations.",
  },
  {
    icon: Hammer,
    t: "Practical exposure",
    d: "Connect learning with projects, case studies and real technology challenges.",
  },
  {
    icon: Layers,
    t: "Technology specialisation",
    d: "Grow within Cloud, AI, Cybersecurity, Data, Microsoft technologies and Digital Transformation.",
  },
  {
    icon: Users,
    t: "Professional network",
    d: "Join a broader ecosystem of technology professionals across Africa.",
  },
  {
    icon: Building2,
    t: "Enterprise orientation",
    d: "Build capabilities that matter in real enterprise environments and projects.",
  },
];

const JOURNEY = [
  { t: "Discover", d: "Identify your goals." },
  { t: "Match", d: "Connect with the right mentor." },
  { t: "Learn", d: "Develop knowledge and perspective." },
  { t: "Build", d: "Apply skills through practice." },
  { t: "Verify", d: "Demonstrate your capability." },
  { t: "Grow", d: "Build visibility and confidence." },
  { t: "Opportunity", d: "Projects, consulting, training and career." },
];

const ENTERPRISE_SERVICES = [
  "Corporate mentorship",
  "Technical capability development",
  "Leadership mentorship",
  "Certification support",
  "Emerging technology talent programmes",
  "Technology leadership development",
  "Enterprise project readiness",
];

const FOOTPRINT_TOPICS = [
  "Mentor testimonials",
  "Mentee spotlights",
  "Career progression paths",
  "Certification milestones",
  "Enterprise delivery impact",
];

const FAQS = [
  {
    question: "Who can become a mentor?",
    answer:
      "Experienced professionals with relevant technical, consulting, leadership or enterprise experience can apply to become mentors.",
  },
  {
    question: "Who can become a mentee?",
    answer:
      "Technology professionals at different stages of their careers can apply, particularly those seeking structured professional or technical development.",
  },
  {
    question: "Is mentorship one-to-one?",
    answer:
      "The programme can support one-to-one mentorship as well as structured group or cohort-based mentorship where appropriate.",
  },
  {
    question: "How are mentors matched with mentees?",
    answer:
      "Matching can consider professional experience, technical specialisation, career goals, development needs and availability.",
  },
  {
    question: "How long does a mentorship relationship last?",
    answer:
      "Each mentorship cycle has defined objectives and a structured review period.",
  },
  {
    question: "Does joining guarantee a job or project?",
    answer:
      "No. The programme is designed for development, guidance and professional growth. Participation does not guarantee employment, contracts or project opportunities.",
  },
  {
    question: "Do I need to be Microsoft certified?",
    answer:
      "Not necessarily. Eligibility depends on the specific mentorship track and programme requirements.",
  },
];

function BenefitList({
  items,
  dark = false,
}: {
  items: string[];
  dark?: boolean;
}) {
  return (
    <ul className="grid gap-3">
      {items.map((b) => (
        <li
          key={b}
          className={cn(
            "flex gap-3 leading-relaxed",
            dark ? "text-brand-50/90" : "text-ink/80",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full",
              dark ? "bg-white/15 text-white" : "bg-brand-100 text-brand-700",
            )}
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

const rise = (ms: number) =>
  ({ "--rise-delay": `${ms}ms` }) as React.CSSProperties;

export const metadata = pageMeta("/mentorship");

export default function MentorshipLandingPage() {
  return (
    <div className="text-ink bg-white">
      <MntNav />

      <main id="main">
        {/* HERO */}
        <section
          aria-labelledby="mnt-hero-heading"
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
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-24 lg:pb-28">
            <div>
              <p
                className="site-rise text-brand-100 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase"
                style={rise(0)}
              >
                <span
                  aria-hidden
                  className="bg-brand-300 size-1.5 rounded-full"
                />
                ETEN Mentorship Programme
              </p>
              <h1
                id="mnt-hero-heading"
                className="site-rise font-jakarta mt-6 text-[2.4rem] leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]"
                style={rise(90)}
              >
                Learn From Experience. Build Your Capability.{" "}
                <span className="text-brand-200">Shape Your Future.</span>
              </h1>
              <p
                className="site-rise mt-6 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl"
                style={rise(180)}
              >
                Connect with experienced technology professionals who can help
                you develop the skills, confidence and practical experience
                needed to thrive in Africa&apos;s evolving technology ecosystem.
              </p>
              <div
                className="site-rise mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
                style={rise(270)}
              >
                <ButtonLink
                  href="/mentorship/register?role=mentee"
                  variant="light"
                  arrow
                >
                  Become a Mentee
                </ButtonLink>
                <ButtonLink
                  href="/mentorship/register?role=mentor"
                  variant="outlineLight"
                >
                  Become a Mentor
                </ButtonLink>
              </div>
              <p
                className="site-rise text-brand-200 mt-8 text-xs font-semibold tracking-[0.18em] uppercase"
                style={rise(360)}
              >
                Part of the Expervia Technology Experts Network (ETEN)
              </p>
            </div>

            <div className="site-rise relative" style={rise(200)}>
              <NetworkGraphic
                idPrefix="mnt-hero-net"
                className="absolute -top-16 -right-20 -z-10 hidden w-[480px] opacity-40 lg:block"
              />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-2 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur">
                <Image
                  src="/mentorship/hero.jpg"
                  alt="A senior technology professional mentoring a junior colleague at a workstation"
                  width={1408}
                  height={768}
                  priority
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="h-auto w-full rounded-[1.6rem] object-cover"
                />
              </div>
              <div className="mnt-float absolute -bottom-6 left-4 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-[0_24px_40px_-20px_rgba(33,0,93,0.6)] sm:flex">
                <IconBadge icon={Handshake} className="size-10 rounded-xl" />
                <span>
                  <span className="text-brand-950 block text-sm font-bold">
                    Matched to your goal
                  </span>
                  <span className="text-ink/60 block text-xs">
                    Not just assigned
                  </span>
                </span>
              </div>
              <div
                className="mnt-float absolute -top-5 right-4 hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur sm:flex"
                style={{ animationDelay: "1.5s" }}
              >
                <Compass aria-hidden className="text-brand-200 size-4" />8
                specialist domains
              </div>
            </div>
          </div>
        </section>

        {/* DOMAINS MARQUEE */}
        <section
          aria-label="Mentorship domains"
          className="border-brand-100 border-b bg-white py-8"
        >
          <div className="mnt-marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
            <ul className="mnt-marquee-track flex w-max gap-3">
              {[...DOMAINS, ...DOMAINS].map((d, i) => (
                <li
                  key={i}
                  aria-hidden={i >= DOMAINS.length}
                  className="border-brand-100 bg-lavender text-brand-800 rounded-full border px-5 py-2.5 text-sm font-semibold whitespace-nowrap"
                >
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* PERSPECTIVE */}
        <Section labelledBy="mnt-perspective">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <Reveal variant="left">
              <SectionIntro
                id="mnt-perspective"
                eyebrow="Perspective & purpose"
                title={
                  <>
                    Your Career Shouldn&apos;t Be{" "}
                    <span className="text-brand-600">Built Alone.</span>
                  </>
                }
              />
              <div className="text-ink/75 mt-6 space-y-4 text-lg leading-relaxed">
                <p>
                  Technology moves quickly. Certifications matter. Technical
                  skills matter. But building a successful career also requires
                  experience, guidance, relationships and exposure to real-world
                  opportunities.
                </p>
                <p>
                  The ETEN Mentorship Programme connects emerging technology
                  professionals with experienced practitioners who share their
                  knowledge. Whether you are beginning your career, changing
                  specialisations, pursuing certifications or preparing for
                  enterprise-level opportunities, the right mentor can help you
                  move forward with greater clarity.
                </p>
              </div>
            </Reveal>
            <ul className="grid gap-4">
              {PERSPECTIVE_FEATURES.map((f, i) => (
                <Reveal
                  as="li"
                  key={f.t}
                  variant="right"
                  delay={i * 110}
                  className={cn(cardClass, "flex items-start gap-5 p-6")}
                >
                  <IconBadge icon={f.icon} />
                  <span>
                    <span className="font-jakarta text-brand-950 block text-lg font-bold">
                      {f.t}
                    </span>
                    <span className="text-ink/70 mt-1 block leading-relaxed">
                      {f.d}
                    </span>
                  </span>
                </Reveal>
              ))}
            </ul>
          </div>
        </Section>

        {/* GROWTH MODEL */}
        <Section tone="lavender" labelledBy="mnt-growth">
          <Reveal>
            <SectionIntro
              id="mnt-growth"
              center
              eyebrow="Our approach"
              title="A Mentorship Programme Built Around Growth"
              intro="This is not simply about having someone to talk to. Our approach moves professionals through a structured development journey."
            />
          </Reveal>
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {GROWTH_MODEL.map((s, i) => (
              <Reveal
                as="li"
                key={s.t}
                delay={i * 90}
                className={cn(cardClass, "relative p-6")}
              >
                <span className="font-jakarta text-brand-200 absolute top-5 right-6 text-3xl font-extrabold">
                  0{i + 1}
                </span>
                <IconBadge icon={s.icon} />
                <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                  {s.t}
                </h3>
                <p className="text-ink/70 mt-2 leading-relaxed">{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </Section>

        {/* SELECT YOUR TRAJECTORY */}
        <Section labelledBy="mnt-trajectory">
          <Reveal>
            <SectionIntro
              id="mnt-trajectory"
              center
              eyebrow="Choose your path"
              title="Select Your Trajectory"
              intro="Whether sharpening your own technical precision or nurturing emerging Pan-African engineers, ETEN provides the framework."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <Reveal
              variant="left"
              className="from-brand-950 via-brand-900 to-brand-700 relative isolate flex flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br p-8 text-white shadow-[0_40px_80px_-40px_rgba(33,0,93,0.9)] sm:p-10"
            >
              <NetworkGraphic
                idPrefix="mnt-mentee-net"
                className="absolute -right-24 -bottom-24 -z-10 w-[380px] opacity-25"
              />
              <p className="text-brand-200 text-xs font-bold tracking-[0.2em] uppercase">
                Become a mentee
              </p>
              <h3 className="font-jakarta mt-4 text-2xl leading-tight font-extrabold sm:text-3xl">
                Get Guidance. Build Capability. Accelerate Your Growth.
              </h3>
              <p className="text-brand-100/85 mt-4 leading-relaxed">
                For technology professionals who want structured guidance from
                experienced practitioners.
              </p>
              <div className="mt-7 flex-1">
                <BenefitList items={MENTEE_BENEFITS} dark />
              </div>
              <ButtonLink
                href="/mentorship/register?role=mentee"
                variant="light"
                arrow
                className="mt-9 self-start"
              >
                Apply as a Mentee
              </ButtonLink>
            </Reveal>

            <Reveal
              variant="right"
              className="border-brand-100 flex flex-col rounded-[2rem] border bg-white p-8 shadow-[0_30px_60px_-40px_rgba(33,0,93,0.35)] sm:p-10"
            >
              <p className="text-brand-600 text-xs font-bold tracking-[0.2em] uppercase">
                Become a mentor
              </p>
              <h3 className="font-jakarta text-brand-950 mt-4 text-2xl leading-tight font-extrabold sm:text-3xl">
                Share Your Experience. Develop Talent. Strengthen the Ecosystem.
              </h3>
              <p className="text-ink/75 mt-4 leading-relaxed">
                Great technology professionals do not just build systems, they
                build people. Help develop the next generation of talent across
                Africa.
              </p>
              <div className="mt-7 flex-1">
                <BenefitList items={MENTOR_BENEFITS} />
              </div>
              <ButtonLink
                href="/mentorship/register?role=mentor"
                variant="primary"
                arrow
                className="mt-9 self-start"
              >
                Apply as a Mentor
              </ButtonLink>
            </Reveal>
          </div>
        </Section>

        {/* WHO CAN BECOME A MENTOR */}
        <Section id="mentors" tone="lavender" labelledBy="mnt-mentors">
          <Reveal>
            <SectionIntro
              id="mnt-mentors"
              center
              eyebrow="Experienced professionals. Practical knowledge. Real impact."
              title="Who Can Become a Mentor?"
              intro="We welcome experienced professionals across the technology ecosystem, aligned with the specialisation areas of ETEN."
            />
          </Reveal>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SPECIALIZATIONS.map((s, i) => (
              <Reveal
                as="li"
                key={s.t}
                variant="zoom"
                delay={(i % 4) * 80}
                className={cn(cardClass, "p-6")}
              >
                <IconBadge icon={s.icon} />
                <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                  {s.t}
                </h3>
                <p className="text-ink/70 mt-2 text-[0.95rem] leading-relaxed">
                  {s.d}
                </p>
              </Reveal>
            ))}
          </ul>
        </Section>

        {/* WHO IS IT FOR */}
        <Section labelledBy="mnt-for">
          <Reveal>
            <SectionIntro
              id="mnt-for"
              center
              eyebrow="For professionals ready to grow"
              title="Who Is the Programme For?"
            />
          </Reveal>
          <ul className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
            {CANDIDATES.map((c, i) => (
              <Reveal
                as="li"
                key={c}
                variant="zoom"
                delay={i * 45}
                className="border-brand-100 text-brand-900 hover:border-brand-300 hover:bg-lavender rounded-full border bg-white px-5 py-2.5 text-[0.95rem] font-medium shadow-[0_8px_20px_-16px_rgba(33,0,93,0.5)] transition-colors"
              >
                {c}
              </Reveal>
            ))}
          </ul>
        </Section>

        {/* HOW IT WORKS */}
        <Section id="how" tone="indigo" labelledBy="mnt-how">
          <Reveal>
            <SectionIntro
              id="mnt-how"
              center
              dark
              eyebrow="A structured journey from connection to capability"
              title="How It Works"
            />
          </Reveal>
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s, i) => (
              <Reveal
                as="li"
                key={s.t}
                delay={(i % 4) * 90}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <IconBadge icon={s.icon} dark />
                  <span className="font-jakarta text-brand-300/70 text-sm font-bold tracking-[0.2em]">
                    STEP {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-jakarta mt-5 text-lg font-bold text-white">
                  {s.t}
                </h3>
                <p className="text-brand-100/80 mt-2 leading-relaxed">{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </Section>

        {/* DIFFERENTIATORS */}
        <Section labelledBy="mnt-diff">
          <Reveal>
            <SectionIntro
              id="mnt-diff"
              center
              eyebrow="Beyond advice. Towards capability."
              title={
                <>
                  What Makes ETEN Mentorship{" "}
                  <span className="text-brand-600">Different?</span>
                </>
              }
              intro="Most mentorship programmes stop at conversations. The ETEN model connects mentorship with practical capability development."
            />
          </Reveal>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DIFFERENTIATORS.map((f, i) => (
              <Reveal
                as="li"
                key={f.t}
                delay={(i % 3) * 100}
                className={cn(cardClass, "p-7")}
              >
                <IconBadge icon={f.icon} />
                <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                  {f.t}
                </h3>
                <p className="text-ink/70 mt-2 leading-relaxed">{f.d}</p>
              </Reveal>
            ))}
          </ul>
        </Section>

        {/* GROWTH JOURNEY */}
        <Section tone="lavender" labelledBy="mnt-journey">
          <Reveal>
            <SectionIntro
              id="mnt-journey"
              center
              eyebrow="From learning to opportunity"
              title="The ETEN Growth Journey"
              intro="Bridging the gap between professional certification, hands-on capability and commercial opportunity."
            />
          </Reveal>
          <ol className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-7 lg:gap-3">
            <span
              aria-hidden
              className="from-brand-300 via-brand-400 to-brand-700 absolute top-7 right-[7%] left-[7%] hidden h-0.5 rounded-full bg-gradient-to-r lg:block"
            />
            {JOURNEY.map((s, i) => {
              const last = i === JOURNEY.length - 1;
              return (
                <Reveal
                  as="li"
                  key={s.t}
                  delay={i * 90}
                  className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center"
                >
                  <span
                    className={cn(
                      "font-jakarta relative z-10 inline-flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ring-8 ring-[#f3eeff]",
                      last
                        ? "bg-brand-700 text-white shadow-[0_10px_25px_-8px_rgba(100,38,220,0.8)]"
                        : "text-brand-700 border-brand-200 border-2 bg-white",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="lg:pt-5">
                    <span
                      className={cn(
                        "font-jakarta block text-lg font-bold",
                        last ? "text-brand-700" : "text-brand-950",
                      )}
                    >
                      {s.t}
                    </span>
                    <span className="text-ink/70 mt-1 block text-sm leading-relaxed">
                      {s.d}
                    </span>
                  </span>
                </Reveal>
              );
            })}
          </ol>
        </Section>

        {/* ENTERPRISE */}
        <Section id="enterprise" labelledBy="mnt-enterprise">
          <Reveal
            variant="zoom"
            className="border-brand-100 bg-lavender relative isolate grid gap-10 overflow-hidden rounded-[2rem] border p-8 sm:p-12 lg:grid-cols-2 lg:items-center"
          >
            <NetworkGraphic
              idPrefix="mnt-ent-net"
              className="absolute -top-24 -right-24 -z-10 w-[420px] opacity-15"
            />
            <div>
              <SectionIntro
                id="mnt-enterprise"
                eyebrow="Build your internal capability"
                title="Want to Develop Your Technology Talent?"
                intro="Organisations can engage with the ETEN Mentorship Programme to support the development of their technology teams and emerging leaders."
              />
              <ButtonLink
                href={`${siteConfig.url}/contact`}
                variant="primary"
                arrow
                className="mt-8"
              >
                Talk to Expervia
              </ButtonLink>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {ENTERPRISE_SERVICES.map((s, i) => (
                <Reveal
                  as="li"
                  key={s}
                  variant="right"
                  delay={i * 60}
                  className="border-brand-100 text-brand-950 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-[0.95rem] font-semibold"
                >
                  <span
                    aria-hidden
                    className="bg-brand-100 text-brand-700 inline-flex size-6 shrink-0 items-center justify-center rounded-full"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {s}
                </Reveal>
              ))}
            </ul>
          </Reveal>
        </Section>

        {/* GROWING AFRICA'S TALENT */}
        <Section tone="indigo" labelledBy="mnt-africa" className="text-center">
          <Reveal>
            <SectionIntro
              id="mnt-africa"
              center
              dark
              eyebrow="Our ambition"
              title="Growing Africa's Technology Talent"
              intro="We are building a network where experience is shared, capabilities are developed and emerging professionals are prepared for the opportunities shaping Africa's digital future."
            />
          </Reveal>
          <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
            {FOOTPRINT_TOPICS.map((t, i) => (
              <Reveal
                as="li"
                key={t}
                variant="zoom"
                delay={i * 70}
                className="text-brand-50 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium backdrop-blur"
              >
                {t}
              </Reveal>
            ))}
          </ul>
        </Section>

        {/* FAQ */}
        <Section id="faq" labelledBy="mnt-faq">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal variant="left">
              <SectionIntro
                id="mnt-faq"
                eyebrow="Frequently asked questions"
                title="Everything You Need to Know"
                intro="Still unsure where you fit? Reach out and our team will help you find the right track."
              />
              <ButtonLink
                href={`${siteConfig.url}/contact`}
                variant="outline"
                className="mt-8"
              >
                Contact us
              </ButtonLink>
            </Reveal>
            <Reveal variant="right" delay={100}>
              <FaqList items={FAQS} />
            </Reveal>
          </div>
        </Section>

        {/* FINAL CTA */}
        <Reveal variant="zoom">
          <CtaPanel
            id="mnt-cta"
            title="Your Next Level Starts With the Right Connection"
            intro="Whether you are ready to share your experience or learn from someone who has already walked the path, there is a place for you in the ETEN Mentorship Programme."
            footer={
              <p className="text-brand-200 mt-8 text-xs font-semibold tracking-[0.18em] uppercase">
                Join the Expervia Technology Experts Network (ETEN)
              </p>
            }
          >
            <ButtonLink
              href="/mentorship/register?role=mentee"
              variant="light"
              arrow
            >
              Become a Mentee
            </ButtonLink>
            <ButtonLink
              href="/mentorship/register?role=mentor"
              variant="outlineLight"
            >
              Become a Mentor
            </ButtonLink>
          </CtaPanel>
        </Reveal>
      </main>

      <MntFooter />
    </div>
  );
}
