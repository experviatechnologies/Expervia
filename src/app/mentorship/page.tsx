import Link from "next/link";
import Image from "next/image";
import { ArrowRight, GraduationCap, Check } from "lucide-react";
import { MntNav } from "@/components/mentorship/mnt-nav";
import { siteConfig } from "@/config/site";

const PERSPECTIVE_FEATURES = [
  { t: "100% Direct Practitioner Mentorship", d: "Active enterprise leaders." },
  { t: "Enterprise Project Readiness", d: "Real architectural rigour." },
  { t: "Pan-African Ecosystem Network", d: "Cross-continental reach." },
];

const GROWTH_MODEL = [
  { n: "01", t: "Connect", d: "Find the right mentor or mentee." },
  { n: "02", t: "Learn", d: "Gain knowledge, guidance and perspective." },
  {
    n: "03",
    t: "Build",
    d: "Develop practical skills through projects and real-world challenges.",
  },
  { n: "04", t: "Verify", d: "Demonstrate your growing capability." },
  {
    n: "05",
    t: "Grow",
    d: "Build professional visibility, confidence and career opportunities.",
    green: true,
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

const SPECIALIZATIONS = [
  {
    t: "Cloud & Infrastructure",
    d: "Azure • Cloud Architecture • Networking • Infrastructure",
  },
  { t: "Modern Work", d: "Microsoft 365 • Collaboration • Productivity" },
  { t: "Cybersecurity", d: "Security • Identity • Compliance • Risk" },
  {
    t: "Data & AI",
    d: "Data Engineering • Analytics • AI • Machine Learning",
  },
  {
    t: "Business Applications",
    d: "Dynamics 365 • Power Platform • Enterprise Applications",
  },
  {
    t: "Software Development",
    d: "Software Engineering • DevOps • Application Development",
  },
  {
    t: "Digital Transformation",
    d: "Enterprise Architecture • Digital Strategy • Technology Consulting",
  },
  {
    t: "Technology Leadership",
    d: "CIO • CTO • IT Leadership • Technology Management",
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

const HOW_IT_WORKS = [
  {
    n: "01",
    t: "Apply",
    d: "Tell us about your experience, goals, interests and areas of expertise.",
  },
  {
    n: "02",
    t: "Assessment",
    d: "We review your profile, objectives and development needs.",
  },
  {
    n: "03",
    t: "Match",
    d: "We identify a suitable mentor-mentee pairing based on expertise, goals and compatibility.",
  },
  {
    n: "04",
    t: "Set Goals",
    d: "Mentor and mentee establish clear development objectives and a mentorship plan.",
  },
  {
    n: "05",
    t: "Meet & Develop",
    d: "Regular mentorship sessions focused on practical learning, career development and professional growth.",
  },
  {
    n: "06",
    t: "Build",
    d: "Where appropriate, mentees work on practical projects, case studies or technology challenges.",
  },
  {
    n: "07",
    t: "Review",
    d: "Progress is reviewed against agreed objectives.",
  },
  {
    n: "08",
    t: "Progress",
    d: "Successful mentees continue within the wider Expervia ecosystem and access relevant opportunities.",
  },
];

const DIFFERENTIATORS = [
  {
    t: "Experienced Mentors",
    d: "Learn directly from professionals with practical industry experience.",
  },
  {
    t: "Structured Development",
    d: "Set clear goals rather than relying on informal conversations.",
  },
  {
    t: "Practical Exposure",
    d: "Where appropriate, connect learning with projects, case studies and real technology challenges.",
  },
  {
    t: "Technology Specialisation",
    d: "Develop within Cloud, AI, Cybersecurity, Data, Microsoft technologies and Digital Transformation.",
  },
  {
    t: "Professional Network",
    d: "Become part of a broader ecosystem of technology professionals across Africa.",
  },
  {
    t: "Enterprise Orientation",
    d: "Develop capabilities relevant to real enterprise environments and technology projects.",
  },
];

const JOURNEY = [
  { t: "Discover", d: "Identify your goals." },
  { t: "Match", d: "Connect with the right mentor." },
  { t: "Learn", d: "Develop knowledge and perspective." },
  { t: "Build", d: "Apply skills through practice." },
  { t: "Verify", d: "Demonstrate your capability." },
  { t: "Grow", d: "Build visibility and professional confidence." },
  {
    t: "Opportunity",
    d: "Projects, consulting, training and career.",
    green: true,
  },
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
  "Mentor Testimonials",
  "Mentee Spotlights",
  "Career Progression Paths",
  "Certification Milestones",
  "Enterprise Delivery Impact",
];

const FAQS = [
  {
    q: "Who can become a mentor?",
    a: "Experienced professionals with relevant technical, consulting, leadership or enterprise experience can apply to become mentors.",
  },
  {
    q: "Who can become a mentee?",
    a: "Technology professionals at different stages of their careers can apply, particularly those seeking structured professional or technical development.",
  },
  {
    q: "Is mentorship one-to-one?",
    a: "The programme can support one-to-one mentorship as well as structured group or cohort-based mentorship where appropriate.",
  },
  {
    q: "How are mentors matched with mentees?",
    a: "Matching can consider professional experience, technical specialisation, career goals, development needs and availability.",
  },
  {
    q: "How long does a mentorship relationship last?",
    a: "Each mentorship cycle has defined objectives and a structured review period.",
  },
  {
    q: "Does joining guarantee a job or project?",
    a: "No. The programme is designed for development, guidance and professional growth. Participation does not guarantee employment, contracts or project opportunities.",
  },
  {
    q: "Do I need to be Microsoft certified?",
    a: "Not necessarily. Eligibility depends on the specific mentorship track and programme requirements.",
  },
];

const eyebrow =
  "text-mnt-faint text-label-sm font-mono tracking-widest uppercase";
const sectionH =
  "font-display text-mnt-ink text-[28px] font-extrabold leading-tight tracking-tight sm:text-headline-lg";
const lead = "text-mnt-ink-muted text-body-lg";
const card = "bg-mnt-panel border-mnt-line rounded-2xl border";

function BenefitList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((b) => (
        <li key={b} className="text-body-md text-mnt-ink-muted flex gap-2.5">
          <Check
            className="text-mnt-green mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MentorshipLandingPage() {
  return (
    <>
      <MntNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-[560px] w-[900px] opacity-70 [background:radial-gradient(600px_400px_at_80%_0,rgba(167,140,250,0.18),transparent_60%)]"
        />
        <div className="mx-auto grid max-w-[1140px] items-center gap-12 px-6 pt-16 pb-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
          <div>
            <span className="border-mnt-brand/30 bg-mnt-brand/10 text-mnt-brand text-label-sm inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono tracking-widest uppercase">
              ETEN Mentorship Programme
            </span>
            <h1 className="text-mnt-ink font-display md:text-display-lg mt-5 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl">
              Learn From Experience. Build Your Capability.{" "}
              <span className="text-mnt-brand">Shape Your Future.</span>
            </h1>
            <p className="text-body-lg text-mnt-ink-muted mt-5 max-w-[34rem]">
              Connect with experienced technology professionals who can help you
              develop the skills, confidence and practical experience needed to
              thrive in Africa&apos;s evolving technology ecosystem.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/mentorship/register"
                className="bg-mnt-brand text-mnt-on-brand text-body-md inline-flex items-center gap-2 rounded-full px-[22px] py-3.5 font-bold transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Become a Mentee
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/mentorship/register"
                className="border-mnt-line-strong text-mnt-ink hover:border-mnt-brand text-body-md inline-flex items-center gap-2 rounded-full border px-[22px] py-3.5 font-bold transition hover:-translate-y-0.5"
              >
                <GraduationCap className="size-4" aria-hidden="true" />
                Become a Mentor
              </Link>
            </div>
            <p className="text-mnt-faint text-label-sm mt-6 font-mono tracking-wide uppercase">
              Part of the Expervia Technology Experts Network (ETEN)
            </p>
          </div>

          <div className="relative">
            <Image
              src="/mentorship/hero.jpg"
              alt="A senior technology professional mentoring a junior colleague at a workstation"
              width={1408}
              height={768}
              priority
              sizes="(max-width: 1024px) 100vw, 540px"
              className="border-mnt-line h-auto w-full rounded-2xl border object-cover shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>
      </section>

      {/* PERSPECTIVE */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <div className={eyebrow}>Perspective &amp; Purpose</div>
            <h2 className={`${sectionH} mt-3`}>
              Your Career Shouldn&apos;t Be Built Alone.
            </h2>
            <p className={`${lead} mt-4`}>
              Technology moves quickly. Certifications matter. Technical skills
              matter. But building a successful career also requires experience,
              guidance, relationships and exposure to real-world opportunities.
              The ETEN Mentorship Programme connects emerging technology
              professionals with experienced practitioners who share their
              knowledge and help the next generation of African technology
              professionals grow. Whether you are beginning your career,
              changing specialisations, pursuing certifications or preparing for
              enterprise-level opportunities, the right mentor can help you move
              forward with greater clarity.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {PERSPECTIVE_FEATURES.map((f) => (
              <div key={f.t} className={`${card} p-5`}>
                <div className="text-body-lg text-mnt-ink font-bold">{f.t}</div>
                <div className="text-body-md text-mnt-ink-muted mt-1">
                  {f.d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GROWTH MODEL */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal">
          <div className="mb-9 text-center">
            <h2 className={sectionH}>
              A Mentorship Programme Built Around Growth
            </h2>
            <p className={`${lead} mx-auto mt-3 max-w-[42rem]`}>
              This is not simply about having someone to talk to. Our approach
              moves professionals through a structured development journey.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {GROWTH_MODEL.map((s) => (
              <div
                key={s.n}
                className={`${card} hover:border-mnt-brand/40 p-[22px] transition hover:-translate-y-1`}
              >
                <div
                  className={`font-display text-xl font-extrabold ${s.green ? "text-mnt-green" : "text-mnt-brand"}`}
                >
                  {s.n}
                </div>
                <h3 className="text-body-lg text-mnt-ink mt-3 font-bold">
                  {s.t}
                </h3>
                <p className="text-body-md text-mnt-ink-muted mt-2">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOMAINS MARQUEE */}
      <section className="pt-20">
        <div className="mx-auto mb-6 flex max-w-[1140px] flex-wrap items-center justify-between gap-3 px-6">
          <div className={eyebrow}>Specialist mentors across 8 domains</div>
          <div className="text-mnt-faint text-body-md">
            Matched to your goal, not just assigned
          </div>
        </div>
        <div className="mnt-marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
          <div className="mnt-marquee-track flex w-max gap-3">
            {[...DOMAINS, ...DOMAINS].map((d, i) => (
              <span
                key={i}
                className="border-mnt-line bg-mnt-panel-2 text-mnt-ink-muted text-body-md rounded-full border px-[18px] py-[11px] whitespace-nowrap"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SELECT YOUR TRAJECTORY */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal">
          <div className="mb-9 text-center">
            <h2 className={sectionH}>Select Your Trajectory</h2>
            <p className={`${lead} mx-auto mt-3 max-w-[42rem]`}>
              Whether sharpening personal technical precision or nurturing
              emerging Pan-African engineers, ETEN provides the dedicated
              framework.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className={`${card} border-mnt-brand/28 p-[30px]`}>
              <span className="text-mnt-brand bg-mnt-brand/12 text-label-sm rounded-full px-3 py-1.5 font-mono tracking-widest uppercase">
                Become a Mentee
              </span>
              <h3 className="font-display text-mnt-ink mt-[18px] text-[22px] font-bold">
                Get Guidance. Build Capability. Accelerate Your Growth.
              </h3>
              <p className="text-body-md text-mnt-ink-muted mt-2.5 mb-5">
                The Mentee Programme is for technology professionals who want
                structured guidance from experienced practitioners.
              </p>
              <BenefitList items={MENTEE_BENEFITS} />
              <Link
                href="/mentorship/register"
                className="bg-mnt-brand text-mnt-on-brand text-body-md mt-6 inline-flex rounded-full px-[18px] py-3 font-bold transition hover:brightness-110"
              >
                Apply as a Mentee
              </Link>
            </div>

            <div className={`${card} p-[30px]`}>
              <span className="text-mnt-green bg-mnt-green/12 text-label-sm rounded-full px-3 py-1.5 font-mono tracking-widest uppercase">
                Become a Mentor
              </span>
              <h3 className="font-display text-mnt-ink mt-[18px] text-[22px] font-bold">
                Share Your Experience. Develop Talent. Strengthen the Ecosystem.
              </h3>
              <p className="text-body-md text-mnt-ink-muted mt-2.5 mb-5">
                Great technology professionals do not just build systems, they
                build people. The Mentor Programme helps experienced
                professionals develop the next generation of talent across
                Africa.
              </p>
              <BenefitList items={MENTOR_BENEFITS} />
              <Link
                href="/mentorship/register"
                className="border-mnt-line-strong text-mnt-ink hover:border-mnt-brand text-body-md mt-6 inline-flex rounded-full border px-[18px] py-3 font-bold transition"
              >
                Apply as a Mentor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALIZATIONS */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal">
          <div className="mb-9 text-center">
            <div className={eyebrow}>
              Experienced Professionals. Practical Knowledge. Real Impact.
            </div>
            <h2 className={`${sectionH} mt-3`}>Who Can Become a Mentor?</h2>
            <p className={`${lead} mx-auto mt-2 max-w-[44rem]`}>
              We welcome experienced professionals across the technology
              ecosystem, aligned with the specialisation areas of ETEN.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SPECIALIZATIONS.map((s) => (
              <div
                key={s.t}
                className={`${card} hover:border-mnt-brand/40 p-5 transition hover:-translate-y-1`}
              >
                <h3 className="text-body-lg text-mnt-ink font-bold">{s.t}</h3>
                <p className="text-body-md text-mnt-faint mt-2">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CANDIDATE MATRIX */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal text-center">
          <div className={eyebrow}>For Professionals Ready to Grow</div>
          <h2 className={`${sectionH} mt-3`}>Who Is The Programme For?</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {CANDIDATES.map((c) => (
              <span
                key={c}
                className="border-mnt-line bg-mnt-panel-2 text-mnt-ink-muted text-body-md rounded-full border px-4 py-2"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal">
          <div className="mb-9 text-center">
            <div className={eyebrow}>
              A Structured Journey From Connection to Capability
            </div>
            <h2 className={`${sectionH} mt-3`}>How It Works</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.n} className={`${card} p-[22px]`}>
                <div className="font-display text-mnt-brand text-xl font-extrabold">
                  {s.n}
                </div>
                <h3 className="text-body-lg text-mnt-ink mt-3 font-bold">
                  {s.t}
                </h3>
                <p className="text-body-md text-mnt-ink-muted mt-2">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal">
          <div className="mb-9 text-center">
            <div className={eyebrow}>Beyond Advice. Towards Capability.</div>
            <h2 className={`${sectionH} mt-3`}>
              What Makes ETEN Mentorship Different?
            </h2>
            <p className={`${lead} mx-auto mt-2 max-w-[44rem]`}>
              Most mentorship programmes stop at conversations. The ETEN model
              connects mentorship with practical capability development.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIFFERENTIATORS.map((f) => (
              <div key={f.t} className={`${card} p-6`}>
                <h3 className="text-body-lg text-mnt-ink font-bold">{f.t}</h3>
                <p className="text-body-md text-mnt-ink-muted mt-2.5">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GROWTH JOURNEY */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal">
          <div className="mb-9 text-center">
            <div className={eyebrow}>From Learning to Opportunity</div>
            <h2 className={`${sectionH} mt-3`}>The ETEN Growth Journey</h2>
            <p className={`${lead} mx-auto mt-2 max-w-[44rem]`}>
              Bridging the gap between professional certification, hands-on
              capability, and commercial opportunity.
            </p>
          </div>
          <div className="flex flex-wrap items-stretch justify-center gap-3">
            {JOURNEY.map((s, i) => (
              <div key={s.t} className="flex items-center gap-3">
                <div
                  className={`${card} w-[150px] p-4 ${s.green ? "border-mnt-green/40" : ""}`}
                >
                  <div
                    className={`font-display text-body-lg font-bold ${s.green ? "text-mnt-green" : "text-mnt-ink"}`}
                  >
                    {s.t}
                  </div>
                  <p className="text-mnt-faint text-label-sm mt-1 leading-snug normal-case">
                    {s.d}
                  </p>
                </div>
                {i < JOURNEY.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="text-mnt-faint hidden text-lg lg:inline"
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENTERPRISE */}
      <section
        id="enterprise"
        className="mx-auto max-w-[1140px] px-6 pt-[88px]"
      >
        <div className="border-mnt-line mnt-reveal grid gap-8 rounded-[20px] border p-8 [background:linear-gradient(120deg,rgba(167,140,250,0.10),rgba(52,211,153,0.06))] md:grid-cols-2 md:items-center md:p-10">
          <div>
            <div className={eyebrow}>Build Your Internal Capability</div>
            <h2 className={`${sectionH} mt-3`}>
              Want to Develop Your Technology Talent?
            </h2>
            <p className={`${lead} mt-3`}>
              Organisations can engage with the ETEN Mentorship Programme to
              support the development of their technology teams and emerging
              leaders.
            </p>
            <Link
              href={`${siteConfig.url}/contact`}
              className="bg-mnt-brand text-mnt-on-brand text-body-md mt-6 inline-flex items-center gap-2 rounded-full px-[22px] py-3 font-bold transition hover:brightness-110"
            >
              Talk to Expervia
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {ENTERPRISE_SERVICES.map((s) => (
              <li
                key={s}
                className="text-body-md text-mnt-ink-muted flex gap-2.5"
              >
                <Check
                  className="text-mnt-green mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CONTINENTAL FOOTPRINT */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px] text-center">
        <div className="mnt-reveal">
          <h2 className={sectionH}>Growing Africa&apos;s Technology Talent</h2>
          <p className={`${lead} mx-auto mt-3 max-w-[46rem]`}>
            We are building a network where experience is shared, capabilities
            are developed and emerging professionals are prepared for the
            opportunities shaping Africa&apos;s digital future.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {FOOTPRINT_TOPICS.map((t) => (
              <span
                key={t}
                className="border-mnt-line text-mnt-faint text-body-md rounded-full border px-4 py-2"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[820px] px-6 pt-[88px]">
        <div className="mnt-reveal">
          <div className="mb-8 text-center">
            <div className={eyebrow}>Frequently asked questions</div>
            <h2 className={`${sectionH} mt-3`}>Everything you need to know</h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS.map((f, i) => (
              <details
                key={f.q}
                open={i === 0}
                className="mnt-faq bg-mnt-panel border-mnt-line open:border-mnt-brand/40 rounded-2xl border"
              >
                <summary className="flex items-center justify-between gap-4 px-[22px] py-5">
                  <span className="font-display text-body-lg text-mnt-ink font-bold">
                    {f.q}
                  </span>
                  <svg
                    className="mnt-faq-plus text-mnt-brand shrink-0"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M9 1v16M1 9h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </summary>
                <div className="text-body-md text-mnt-ink-muted px-[22px] pb-5">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px] text-center">
        <div className="mnt-reveal">
          <div className={eyebrow}>
            Your Next Level Starts With the Right Connection
          </div>
          <h2 className={`${sectionH} mt-3`}>Initiate Your Trajectory</h2>
          <p className={`${lead} mx-auto mt-3 max-w-[42rem]`}>
            Whether you are ready to share your experience or learn from someone
            who has already walked the path, there is a place for you in the
            ETEN Mentorship Programme.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/mentorship/register"
              className="bg-mnt-brand text-mnt-on-brand text-body-md rounded-full px-[26px] py-[15px] font-bold transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Become a Mentee
            </Link>
            <Link
              href="/mentorship/register"
              className="border-mnt-line-strong text-mnt-ink hover:border-mnt-brand text-body-md rounded-full border px-[26px] py-[15px] font-bold transition"
            >
              Become a Mentor
            </Link>
          </div>
          <p className="text-mnt-faint text-label-sm mt-5 font-mono tracking-wide uppercase">
            Join the Expervia Technology Experts Network (ETEN)
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-mnt-line mt-[92px] border-t">
        <div className="mx-auto max-w-[1140px] px-6 py-11">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-8 place-items-center rounded-lg bg-gradient-to-br text-[15px] font-extrabold">
                  E
                </span>
                <span className="font-display text-mnt-ink text-lg font-extrabold">
                  ETEN Mentorship
                </span>
              </div>
              <p className="text-mnt-faint text-body-md mt-4 max-w-[24rem]">
                The Expervia Technology Experts Network (ETEN) Mentorship
                Programme develops world-class engineers, architects and
                technical leaders through structured curriculum and 1:1 veteran
                guidance.
              </p>
              <div className="text-mnt-faint mt-4 font-mono text-[11px]">
                mentorship.experviatechnologies.com
              </div>
            </div>
            <FooterCol
              head="Programme"
              links={[
                ["Mentorship Tracks", "/mentorship#how"],
                ["Enterprise Programmes", "/mentorship#enterprise"],
                ["Curriculum Directory", "/mentorship#how"],
              ]}
            />
            <FooterCol
              head="Network"
              links={[
                ["ETEN Community", siteConfig.url],
                ["Events & Summits", `${siteConfig.url}/events`],
                ["Mentor Application", "/mentorship/register"],
              ]}
            />
            <FooterCol
              head="Governance"
              links={[
                ["Privacy Policy", siteConfig.url],
                ["Terms of Service", siteConfig.url],
              ]}
            />
          </div>
          <div className="border-mnt-line text-mnt-faint mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-[12px]">
            <span>© 2026 Expervia Technologies. All rights reserved.</span>
            <span className="flex gap-[18px]">
              <Link
                href={siteConfig.url}
                className="text-mnt-faint hover:text-mnt-ink"
              >
                Privacy
              </Link>
              <Link
                href={siteConfig.url}
                className="text-mnt-faint hover:text-mnt-ink"
              >
                Terms
              </Link>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

function FooterCol({
  head,
  links,
}: {
  head: string;
  links: [string, string][];
}) {
  return (
    <div>
      <div className="text-mnt-faint mb-3.5 font-mono text-[10.5px] tracking-[0.16em] uppercase">
        {head}
      </div>
      <div className="text-body-md flex flex-col gap-2.5">
        {links.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="text-mnt-ink-muted hover:text-mnt-ink transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
