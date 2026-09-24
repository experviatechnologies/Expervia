import Link from "next/link";
import { MntNav } from "@/components/mentorship/mnt-nav";

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

const STEPS = [
  {
    n: "01",
    t: "Set your goal",
    d: "Register and pick the capability and V-level you are working toward.",
  },
  {
    n: "02",
    t: "Join a Circle",
    d: "Get matched to a verified mentor and a small cohort in your domain.",
  },
  {
    n: "03",
    t: "Meet & learn",
    d: "Work through regular sessions on practical, real-world skills.",
  },
  {
    n: "04",
    t: "Build & submit",
    d: "Complete assignments and submit evidence your mentor reviews.",
  },
  {
    n: "05",
    t: "Graduate",
    d: "Approved evidence earns recognition and moves you up the ladder.",
    green: true,
  },
];

const BUILDS = [
  {
    t: "Capability passport",
    d: "A durable record of the evidence you have had verified, not just certificates.",
  },
  {
    t: "Expert Score & badges",
    d: "Recognition that accrues as your work is approved and Circles completed.",
  },
  {
    t: "Verified mentors",
    d: "Every mentor is vetted through ETEN's Readiness Panel before they lead.",
  },
  {
    t: "A network across Africa",
    d: "Grow inside the wider ETEN community of specialists and employers.",
  },
];

const LADDER = [
  { v: "V0", t: "Registered", d: "In the network; profile started.", h: "22%" },
  {
    v: "V1",
    t: "Credential Verified",
    d: "Identity and certificates confirmed.",
    h: "38%",
  },
  {
    v: "V2",
    t: "Capability Verified",
    d: "Skills shown through real evidence.",
    h: "54%",
  },
  {
    v: "V3",
    t: "Commercially Ready",
    d: "Ready for real client and enterprise work.",
    h: "70%",
  },
  {
    v: "V4",
    t: "Proven Specialist",
    d: "Track record on delivered work.",
    h: "86%",
    alt: true,
  },
  {
    v: "V5",
    t: "Lead Specialist",
    d: "Leads others and sets the standard.",
    h: "100%",
    green: true,
  },
];

const FAQS = [
  {
    q: "Do I need to be an ETEN member to start?",
    a: "No. Register free as a prospect and set your goal in minutes. Full validation, which lets you join live Circles and earn recognition, comes with ETEN membership.",
  },
  {
    q: "Are the mentors vetted?",
    a: "Yes. Every mentor is verified through ETEN's Readiness Panel, confirming their level and specialisation, before they can lead a Circle.",
  },
  {
    q: "What does it cost?",
    a: "Registering, setting a goal and exploring the programme are free. Live Circle participation is part of ETEN membership.",
  },
  {
    q: "How is a Circle structured?",
    a: "A small cohort with one verified mentor, run over a set of sessions with assignments and reviewed evidence, so you get group learning plus individual feedback.",
  },
  {
    q: "How long does a Circle run?",
    a: "Each Circle runs for a defined cycle with clear objectives and review points, typically a few weeks of regular sessions, ending in a completion and recognition step.",
  },
];

const eyebrow =
  "text-mnt-faint font-mono text-[11.5px] tracking-[0.16em] uppercase";
const sectionH =
  "font-display text-3xl font-extrabold tracking-tight sm:text-[32px]";

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
        <div className="mx-auto grid max-w-[1140px] items-center gap-14 px-6 pt-20 pb-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span
              className={`border-mnt-brand/30 bg-mnt-brand/10 text-mnt-brand inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11.5px] tracking-[0.14em] uppercase`}
            >
              ETEN Mentorship Circles
            </span>
            <h1 className="text-mnt-ink font-display mt-5 text-5xl leading-[1.06] font-extrabold tracking-tight text-balance">
              Your career shouldn&apos;t be built{" "}
              <span className="text-mnt-brand">alone.</span>
            </h1>
            <p className="text-mnt-ink-muted mt-5 max-w-[31rem] text-[17px] leading-relaxed">
              Technology takes more than certifications. It takes guidance, real
              projects and proof. Join a small Circle led by a verified
              specialist, set a capability goal, and build evidence that moves
              you up the ladder.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/mentorship/register"
                className="bg-mnt-brand text-mnt-on-brand rounded-[11px] px-[22px] py-3.5 text-[15px] font-bold transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Be a Mentee
              </Link>
              <Link
                href="/mentorship/register"
                className="border-mnt-line-strong text-mnt-ink hover:border-mnt-brand rounded-[11px] border px-[22px] py-3.5 text-[15px] font-bold transition hover:-translate-y-0.5"
              >
                Be a Mentor
              </Link>
            </div>
            <div className="text-mnt-faint mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
              <span className="inline-flex items-center gap-2">
                <span className="bg-mnt-amber size-2 rounded-full" />
                Free to start
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="bg-mnt-green size-2 rounded-full" />
                Validated through ETEN membership
              </span>
            </div>
          </div>

          {/* preview card */}
          <div className="mnt-float bg-mnt-panel border-mnt-line rounded-2xl border p-6 shadow-[0_24px_60px_rgba(0,0,0,0.42)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-mnt-green/15 text-mnt-green flex size-9 items-center justify-center rounded-[11px] font-bold">
                  CN
                </div>
                <div>
                  <div className="text-[14px] font-bold">Chidi Nwosu</div>
                  <div className="text-mnt-green font-mono text-[10.5px]">
                    Verified Mentor · V4
                  </div>
                </div>
              </div>
              <span className="text-mnt-green bg-mnt-green/12 rounded-full px-2.5 py-1 font-mono text-[10.5px]">
                Active
              </span>
            </div>
            <div className="text-mnt-faint mt-5 mb-2.5 font-mono text-[10.5px] tracking-[0.12em] uppercase">
              Cloud Security Circle · 5 mentees
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="bg-mnt-panel-2 border-mnt-line flex items-center gap-2.5 rounded-xl border p-3">
                <div className="bg-mnt-brand/16 text-mnt-brand flex size-[30px] items-center justify-center rounded-lg text-[13px] font-bold">
                  AO
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold">Amara Okoye</div>
                  <div className="text-mnt-faint text-[11.5px]">
                    Goal · V2 to V3 · Azure landing-zone design
                  </div>
                </div>
                <span className="text-mnt-green font-mono text-[10px]">
                  2/3
                </span>
              </div>
              <div className="bg-mnt-panel-2 border-mnt-line flex items-center gap-2.5 rounded-xl border p-3">
                <div className="bg-mnt-blue/16 text-mnt-blue flex size-[30px] items-center justify-center rounded-lg text-[13px] font-bold">
                  TB
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold">Tunde Bello</div>
                  <div className="text-mnt-faint text-[11.5px]">
                    Goal · V1 to V2 · Threat detection
                  </div>
                </div>
                <span className="text-mnt-amber font-mono text-[10px]">
                  in review
                </span>
              </div>
            </div>
            <div className="border-mnt-line text-mnt-faint mt-4 flex justify-between border-t pt-4 text-[12px]">
              <span>Session 3 of 6 · Thu 7:00pm WAT</span>
              <span className="text-mnt-brand">View Circle</span>
            </div>
          </div>
        </div>
      </section>

      {/* DOMAINS MARQUEE */}
      <section className="pt-20">
        <div className="mx-auto mb-6 flex max-w-[1140px] flex-wrap items-center justify-between gap-3 px-6">
          <div className={eyebrow}>Specialist mentors across 8 domains</div>
          <div className="text-mnt-faint text-[13px]">
            Matched to your goal, not just assigned
          </div>
        </div>
        <div className="mnt-marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
          <div className="mnt-marquee-track flex w-max gap-3">
            {[...DOMAINS, ...DOMAINS].map((d, i) => (
              <span
                key={i}
                className="border-mnt-line bg-mnt-panel-2 text-mnt-ink-muted rounded-full border px-[18px] py-[11px] text-[14px] whitespace-nowrap"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* TWO WAYS IN */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal">
          <div className="mb-9 text-center">
            <h2 className={sectionH}>Two ways in</h2>
            <p className="text-mnt-ink-muted mx-auto mt-3 max-w-[40rem] text-[15px]">
              Whether you are building your capability or ready to grow others,
              there is a seat in the Circle.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="bg-mnt-panel border-mnt-brand/28 hover:border-mnt-brand/45 rounded-2xl border p-[30px] transition hover:-translate-y-1">
              <span className="text-mnt-brand bg-mnt-brand/12 rounded-full px-3 py-1.5 font-mono text-[10.5px] tracking-[0.12em] uppercase">
                Be a Mentee
              </span>
              <h3 className="font-display mt-[18px] mb-2.5 text-[23px] font-bold">
                Grow with guidance
              </h3>
              <p className="text-mnt-ink-muted mb-5 text-[14px] leading-relaxed">
                Move forward with clarity: a structured plan, real projects, and
                feedback from someone who has done it.
              </p>
              <ul className="flex flex-col gap-3 text-[13.5px]">
                {[
                  "Students and graduates entering tech",
                  "Junior and mid-level professionals",
                  "Career switchers and certification candidates",
                  "Emerging consultants and engineers",
                ].map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <span className="text-mnt-brand">›</span>
                    {x}
                  </li>
                ))}
              </ul>
              <Link
                href="/mentorship/register"
                className="bg-mnt-brand text-mnt-on-brand mt-6 inline-flex rounded-[11px] px-[18px] py-3 text-[14px] font-bold transition hover:brightness-110"
              >
                Join as a mentee
              </Link>
            </div>

            <div className="bg-mnt-panel border-mnt-line hover:border-mnt-brand/40 rounded-2xl border p-[30px] transition hover:-translate-y-1">
              <span className="text-mnt-green bg-mnt-green/12 rounded-full px-3 py-1.5 font-mono text-[10.5px] tracking-[0.12em] uppercase">
                Be a Mentor
              </span>
              <h3 className="font-display mt-[18px] mb-2.5 text-[23px] font-bold">
                Give back, and lead
              </h3>
              <p className="text-mnt-ink-muted mb-5 text-[14px] leading-relaxed">
                Turn your experience into the next generation of specialists,
                and build your own visibility as a verified mentor.
              </p>
              <ul className="flex flex-col gap-3 text-[13.5px]">
                {[
                  "Experienced practitioners and architects",
                  "Consultants and certified specialists",
                  "Technology and team leaders",
                  "Anyone ready to develop emerging talent",
                ].map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <span className="text-mnt-green">›</span>
                    {x}
                  </li>
                ))}
              </ul>
              <Link
                href="/mentorship/register"
                className="border-mnt-line-strong text-mnt-ink hover:border-mnt-brand mt-6 inline-flex rounded-[11px] border px-[18px] py-3 text-[14px] font-bold transition"
              >
                Apply to mentor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW A CIRCLE WORKS */}
      <section id="how" className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal">
          <div className="mb-10 text-center">
            <div className={eyebrow}>How a Circle works</div>
            <h2 className={`${sectionH} mt-3`}>
              Beyond advice, towards capability
            </h2>
            <p className="text-mnt-ink-muted mx-auto mt-2 max-w-[42rem] text-[15px]">
              A guided path from goal to proof, run as a small cohort over a set
              of sessions.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="bg-mnt-panel border-mnt-line hover:border-mnt-brand/40 rounded-2xl border p-[22px] transition hover:-translate-y-1"
              >
                <div
                  className={`font-display text-xl font-extrabold ${s.green ? "text-mnt-green" : "text-mnt-brand"}`}
                >
                  {s.n}
                </div>
                <h4 className="mt-3 text-[15px] font-bold">{s.t}</h4>
                <p className="text-mnt-ink-muted mt-2 text-[12.5px] leading-relaxed">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU BUILD */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUILDS.map((b) => (
            <div
              key={b.t}
              className="bg-mnt-panel border-mnt-line hover:border-mnt-brand/40 rounded-2xl border p-6 transition hover:-translate-y-1"
            >
              <h4 className="text-[15px] font-bold">{b.t}</h4>
              <p className="text-mnt-ink-muted mt-2.5 text-[12.5px] leading-relaxed">
                {b.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CAPABILITY LADDER */}
      <section id="ladder" className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="mnt-reveal">
          <div className="mb-9 text-center">
            <div className={eyebrow}>The capability ladder</div>
            <h2 className={`${sectionH} mt-3`}>
              From registered to lead specialist
            </h2>
            <p className="text-mnt-ink-muted mx-auto mt-2 max-w-[44rem] text-[15px]">
              The V-scale is how ETEN measures readiness. Mentorship moves you
              up it, one verified step at a time.
            </p>
          </div>
          <div className="bg-mnt-panel border-mnt-line rounded-2xl border px-6 py-[30px]">
            <div className="mb-6 grid h-32 grid-cols-6 items-end gap-3.5">
              {LADDER.map((l) => (
                <div
                  key={l.v}
                  style={{ height: l.h }}
                  className={`rounded-t-lg ${l.green ? "from-mnt-green/70 to-mnt-green/12 bg-gradient-to-b" : "from-mnt-brand/65 to-mnt-brand/12 bg-gradient-to-b"}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-6 gap-3.5">
              {LADDER.map((l) => (
                <div key={l.v}>
                  <div
                    className={`font-display text-[17px] font-extrabold ${l.green ? "text-mnt-green" : ""}`}
                  >
                    {l.v}
                  </div>
                  <div className="text-mnt-ink mt-0.5 text-[12.5px] font-semibold">
                    {l.t}
                  </div>
                  <p className="text-mnt-faint mt-1.5 text-[11.5px] leading-snug">
                    {l.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TWO-TIER BAND */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px]">
        <div className="border-mnt-line mnt-reveal grid items-center gap-7 rounded-[20px] border p-8 [background:linear-gradient(120deg,rgba(245,177,61,0.08),rgba(52,211,153,0.08))] md:grid-cols-[1fr_auto_1fr]">
          <div>
            <span className="text-mnt-amber bg-mnt-amber/12 rounded-full px-2.5 py-1 font-mono text-[10.5px] tracking-[0.12em] uppercase">
              Step 1 · Prospect
            </span>
            <h3 className="font-display mt-3.5 mb-1.5 text-[19px] font-bold">
              Start free, right away
            </h3>
            <p className="text-mnt-ink-muted text-[13.5px] leading-relaxed">
              Register, set a goal, and explore Circles as a prospect while you
              get set up.
            </p>
          </div>
          <div className="text-mnt-faint font-display hidden text-[26px] md:block">
            →
          </div>
          <div>
            <span className="text-mnt-green bg-mnt-green/12 rounded-full px-2.5 py-1 font-mono text-[10.5px] tracking-[0.12em] uppercase">
              Step 2 · ETEN-Validated
            </span>
            <h3 className="font-display mt-3.5 mb-1.5 text-[19px] font-bold">
              Validate to go live
            </h3>
            <p className="text-mnt-ink-muted text-[13.5px] leading-relaxed">
              Complete ETEN membership to be fully validated, join live Circles
              and count toward recognition.
            </p>
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
                  <span className="font-display text-[16.5px] font-bold">
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
                <div className="text-mnt-ink-muted max-w-[56rem] px-[22px] pb-5 text-[14px] leading-relaxed">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="mx-auto max-w-[1140px] px-6 pt-[88px] text-center">
        <div className="mnt-reveal">
          <h2 className="font-display text-[34px] font-extrabold tracking-tight">
            Ready to grow, or to give back?
          </h2>
          <p className="text-mnt-ink-muted mt-3.5 text-[15px]">
            Join the network turning expertise into verified capability across
            Africa.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/mentorship/register"
              className="bg-mnt-brand text-mnt-on-brand rounded-[11px] px-[26px] py-[15px] text-[15px] font-bold transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Get started free
            </Link>
            <Link
              href="/mentorship#faq"
              className="border-mnt-line-strong text-mnt-ink hover:border-mnt-brand rounded-[11px] border px-[26px] py-[15px] text-[15px] font-bold transition"
            >
              Talk to the team
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-mnt-line mt-[92px] border-t">
        <div className="mx-auto max-w-[1140px] px-6 py-11">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-7 place-items-center rounded-lg bg-gradient-to-br text-[13px] font-extrabold">
                  E
                </span>
                <span className="font-display text-[14px] font-extrabold">
                  ETEN Mentorship
                </span>
              </div>
              <p className="text-mnt-faint mt-4 max-w-[22rem] text-[12.5px] leading-relaxed">
                Developing engineers, architects and technical leaders across
                Africa through verified mentorship and real, evidence-based
                capability.
              </p>
              <div className="text-mnt-faint mt-4 font-mono text-[11px]">
                mentorship.expervia.com
              </div>
            </div>
            <FooterCol
              head="Programme"
              links={[
                ["How it works", "/mentorship#how"],
                ["Capability ladder", "/mentorship#ladder"],
                ["Domains", "/mentorship#how"],
                ["Enterprise programmes", "/mentorship"],
              ]}
            />
            <FooterCol
              head="Take part"
              links={[
                ["Become a mentee", "/mentorship/register"],
                ["Become a mentor", "/mentorship/register"],
                ["Sign in", "/mentorship/signin"],
                ["FAQ", "/mentorship#faq"],
              ]}
            />
            <FooterCol
              head="Network"
              links={[
                ["ETEN Community", "/"],
                ["Events & summits", "/events"],
                ["About Expervia", "/about"],
                ["Contact", "/contact"],
              ]}
            />
          </div>
          <div className="border-mnt-line text-mnt-faint mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-[12px]">
            <span>© 2026 Expervia Technologies · An ETEN programme</span>
            <span className="flex gap-[18px]">
              <Link href="/" className="text-mnt-faint hover:text-mnt-ink">
                Privacy
              </Link>
              <Link href="/" className="text-mnt-faint hover:text-mnt-ink">
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
      <div className="flex flex-col gap-2.5 text-[13px]">
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
