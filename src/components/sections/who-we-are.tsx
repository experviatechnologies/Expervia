import Image from "next/image";
import { Section, SectionIntro } from "@/components/site/ui";

const stats = [
  { value: "40+", label: "Years Combined Expertise" },
  { value: "2+", label: "Enterprise Partners" },
];

export function WhoWeAre() {
  return (
    <Section id="about" labelledBy="identity-heading">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionIntro
            id="identity-heading"
            eyebrow="Our Identity"
            title={
              <>
                Strategy, Innovation, Execution, People,{" "}
                <span className="text-brand-600">Do.</span>
              </>
            }
          />
          <div className="text-ink/80 mt-7 space-y-5 text-lg leading-relaxed">
            <p>
              Expervia Technologies bridges the gap between complex global
              innovation and local market realities. We don&apos;t just consult;
              we execute.
            </p>
            <p>
              Our philosophy is built on five pillars: deep strategic insight,
              relentless innovation, flawless execution, a focus on
              people-centric results, and a bias for action. We combine global
              technical excellence with a nuanced understanding of the African
              business landscape.
            </p>
          </div>
          <dl className="border-brand-100 mt-9 grid grid-cols-2 gap-8 border-y py-6">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="text-ink/70 order-2 text-sm">{s.label}</dt>
                <dd className="font-jakarta text-brand-700 order-1 mb-1 text-4xl font-extrabold">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="from-brand-200 to-brand-50 absolute -inset-2 -z-0 rounded-[2rem] bg-gradient-to-br opacity-70 sm:-inset-4"
          />
          <Image
            src="/identity.jpg"
            alt="Expervia team members collaborating on laptops in a technology workshop"
            width={512}
            height={342}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="relative h-auto w-full rounded-3xl shadow-[0_30px_60px_-30px_rgba(33,0,93,0.6)]"
          />
        </div>
      </div>
    </Section>
  );
}
