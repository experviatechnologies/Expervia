import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Section, SectionIntro, cardClass } from "@/components/site/ui";

const assessments = [
  {
    title: "AI Readiness",
    description:
      "Analyze your data architecture and governance to identify AI deployment opportunities.",
  },
  {
    title: "Cloud Readiness",
    description:
      "Review legacy infrastructure for optimization and seamless hybrid-cloud migration.",
  },
  {
    title: "Cybersecurity Risk",
    description:
      "A deep dive into your vulnerability landscape and incident response capabilities.",
  },
  {
    title: "Digital Maturity",
    description:
      "Benchmarking your organization against industry-leading digital transformation models.",
  },
];

/** "Request" jumps to the contact form on this page. */
function RequestLink({
  name,
  light = false,
}: {
  name: string;
  light?: boolean;
}) {
  return (
    <Link
      href="#contact-form"
      className={
        light
          ? "group mt-auto inline-flex items-center gap-1.5 font-semibold text-white underline-offset-4 hover:underline"
          : "text-brand-700 group mt-auto inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline"
      }
    >
      Request Assessment
      <span className="sr-only">: {name}</span>
      <ArrowRight
        aria-hidden
        className="size-4 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

export function Assessments() {
  return (
    <Section
      id="assessments"
      labelledBy="contact-assess-heading"
      tone="lavender"
    >
      <SectionIntro
        id="contact-assess-heading"
        eyebrow="Complimentary diagnostics"
        title="Request a Complimentary Assessment"
        intro="Evaluate your current posture and readiness for future-scale technologies with our expert-led diagnostics."
        center
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {assessments.map((a) => (
          <li key={a.title} className={`${cardClass} flex flex-col`}>
            <h3 className="font-jakarta text-brand-950 text-xl font-bold">
              {a.title}
            </h3>
            <p className="text-ink/75 mt-3 mb-6 leading-relaxed">
              {a.description}
            </p>
            <RequestLink name={a.title} />
          </li>
        ))}

        {/* Microsoft Copilot: spans two columns with an icon panel. */}
        <li className="bg-brand-900 relative overflow-hidden rounded-3xl p-7 text-white shadow-[0_24px_50px_-28px_rgba(33,0,93,0.8)] md:col-span-2">
          <div
            aria-hidden
            className="bg-brand-600/40 absolute -right-24 -bottom-24 size-72 rounded-full blur-3xl"
          />
          <div className="relative flex flex-col items-center gap-8 md:flex-row">
            <div className="flex flex-col">
              <h3 className="font-jakarta text-xl font-bold">
                Microsoft Copilot Readiness
              </h3>
              <p className="text-brand-100/90 mt-3 mb-6 leading-relaxed">
                Ensure your tenant is secure and your data is properly
                permissioned for GenAI adoption.
              </p>
              <RequestLink name="Microsoft Copilot Readiness" light />
            </div>
            <div
              aria-hidden
              className="flex h-32 w-full shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 md:w-1/2"
            >
              <BadgeCheck className="text-brand-200 size-16" />
            </div>
          </div>
        </li>
      </ul>
    </Section>
  );
}
