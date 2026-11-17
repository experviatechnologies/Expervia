import { Compass, Target } from "lucide-react";
import { Section, SectionIntro } from "@/components/site/ui";

const pillars = ["Learn", "Connect", "Grow", "Lead"];

/** About (#about) plus Vision and Mission (#vision-mission). */
export function WitAbout() {
  return (
    <>
      <Section id="about" labelledBy="wit-about-heading">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <SectionIntro
              id="wit-about-heading"
              eyebrow="About the Community"
              title="More Than a Community. A Network for Growth, Opportunity and Impact."
            />
            <div className="text-ink/80 mt-7 space-y-5 text-lg leading-relaxed">
              <p>
                ETEN Women in Tech is a women-focused professional community
                within the Expervia Technologies Expert Network (ETEN). It
                brings together women who are learning, working and leading
                across technology.
              </p>
              <p>
                Members come together to build practical skills, find
                mentorship, form meaningful professional relationships, grow
                their visibility and collaborate on ideas that matter, with
                access to resources and opportunities as they become available.
              </p>
            </div>
          </div>
          <aside
            aria-label="What we do"
            className="from-brand-900 to-brand-700 relative self-center overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white shadow-[0_30px_60px_-30px_rgba(33,0,93,0.7)] sm:p-10"
          >
            <div
              aria-hidden
              className="absolute -top-16 -right-16 size-56 rounded-full bg-white/10 blur-2xl"
            />
            <p className="text-brand-200 text-xs font-bold tracking-[0.2em] uppercase">
              Our tagline
            </p>
            <p className="font-jakarta mt-3 text-3xl leading-snug font-extrabold">
              Connect. Empower. Lead.
            </p>
            <p className="text-brand-100/90 mt-4 leading-relaxed">
              A community where women learn, connect, grow and create
              opportunities in technology.
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {pillars.map((p) => (
                <li
                  key={p}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-center text-sm font-semibold"
                >
                  {p}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Section>

      <Section id="vision-mission" labelledBy="wit-vm-heading" tone="lavender">
        <h2 id="wit-vm-heading" className="sr-only">
          Vision and Mission
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              icon: Compass,
              title: "Our Vision",
              text: "A connected and empowered network of women who are actively shaping the future of technology, innovation and digital transformation.",
            },
            {
              icon: Target,
              title: "Our Mission",
              text: "To create opportunities for women to learn, develop professional skills, access mentorship, build relationships and advance their careers through technology education, collaboration and community engagement.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="border-brand-100 rounded-3xl border bg-white p-8 shadow-[0_24px_50px_-34px_rgba(33,0,93,0.45)] md:p-10"
            >
              <span className="from-brand-50 to-brand-100 text-brand-700 ring-brand-200/70 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ring-1">
                <Icon aria-hidden className="size-6" />
              </span>
              <h3 className="font-jakarta text-brand-950 mt-6 text-2xl font-bold">
                {title}
              </h3>
              <p className="text-ink/75 mt-3 text-lg leading-relaxed">{text}</p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
