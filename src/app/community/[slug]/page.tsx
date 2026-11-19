import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import {
  ButtonLink,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";
import { PageHero } from "@/components/site/page-hero";
import { CtaPanel } from "@/components/site/cta-panel";
import { cn } from "@/lib/utils";
import { getPodLanding, POD_LANDING_SLUGS } from "@/lib/eten/pod-landings";

export function generateStaticParams() {
  return POD_LANDING_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pod = getPodLanding(slug);
  if (!pod) return { title: "Community" };
  return {
    title: `${pod.name} | ETEN Community`,
    description: pod.intro,
  };
}

export default async function PodLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pod = getPodLanding(slug);
  if (!pod) notFound();

  return (
    <>
      <PageHero
        id="pod-hero-heading"
        eyebrow={pod.eyebrow}
        title={pod.tagline}
        intro={pod.intro}
        actions={
          <>
            <ButtonLink href="/join" variant="light" arrow>
              Join ETEN
            </ButtonLink>
            <ButtonLink href="/mentorship" variant="outlineLight">
              Explore mentorship
            </ButtonLink>
          </>
        }
      />

      {/* WHAT THIS POD COVERS */}
      <Section id="covers" labelledBy="covers-heading">
        <SectionIntro
          id="covers-heading"
          eyebrow={pod.name}
          title="What this pod covers"
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {pod.covers.map((c) => (
            <li
              key={c}
              className="border-brand-100 flex items-start gap-4 rounded-2xl border bg-white p-5"
            >
              <span className="bg-lavender text-brand-700 flex size-8 shrink-0 items-center justify-center rounded-full">
                <Check aria-hidden className="size-4" />
              </span>
              <span className="text-ink/85 pt-1 font-medium">{c}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* CERTIFICATION PATHWAY */}
      <Section id="pathway" labelledBy="pathway-heading" tone="lavender">
        <SectionIntro
          id="pathway-heading"
          eyebrow={pod.pathwayLabel}
          title="A clear path to grow"
          center
        />
        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {pod.pathway.map((step, i) => (
            <li key={step.name} className={cn(cardClass, "relative")}>
              <span className="font-jakarta bg-brand-700 inline-flex size-11 items-center justify-center rounded-full text-base font-extrabold text-white shadow-[0_10px_25px_-8px_rgba(100,38,220,0.7)]">
                <span className="sr-only">Step </span>
                {i + 1}
              </span>
              <p className="text-brand-600 mt-5 text-xs font-bold tracking-[0.18em] uppercase">
                {step.level}
              </p>
              <p className="font-jakarta text-brand-950 mt-1.5 text-lg leading-snug font-bold">
                {step.name}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* WHO IT'S FOR */}
      <Section id="audience" labelledBy="audience-heading">
        <SectionIntro
          id="audience-heading"
          eyebrow="Who should join"
          title="Who this pod is for"
          center
        />
        <ul className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2.5">
          {pod.audience.map((a) => (
            <li
              key={a}
              className="bg-lavender text-brand-900 rounded-full px-5 py-2.5 font-semibold"
            >
              {a}
            </li>
          ))}
        </ul>
      </Section>

      <CtaPanel
        id="pod-cta-heading"
        title={`Ready to grow with the ${pod.name} pod?`}
        intro="Join ETEN to connect with verified specialists, follow the certification pathway, and build proof of your capability."
      >
        <ButtonLink href="/join" variant="light" arrow>
          Join ETEN
        </ButtonLink>
        <ButtonLink href="/contact" variant="outlineLight">
          Talk to Expervia
        </ButtonLink>
      </CtaPanel>
    </>
  );
}
