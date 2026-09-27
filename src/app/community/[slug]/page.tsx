import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
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
    title: `${pod.name} — ETEN Community`,
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
      {/* HERO */}
      <section className="relative overflow-hidden pt-20">
        <div
          aria-hidden
          className="bg-primary/20 pointer-events-none absolute -top-40 left-1/4 size-[600px] rounded-full blur-[160px]"
        />
        <Container className="relative max-w-5xl py-20 text-center md:py-28">
          <span className="text-label-sm text-primary border-primary/30 mb-6 inline-block rounded-full border px-3 py-1 font-mono tracking-widest uppercase">
            {pod.eyebrow}
          </span>
          <h1 className="font-display text-on-surface md:text-display-lg mb-6 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl">
            {pod.tagline}
          </h1>
          <p className="text-body-lg text-on-surface-variant mx-auto mb-10 max-w-2xl">
            {pod.intro}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="brand" size="pill" className="font-bold">
              <Link href="/join">
                Join ETEN
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              variant="brandOutline"
              size="pill"
              className="font-bold"
            >
              <Link href="/mentorship">Explore mentorship</Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* WHAT THIS POD COVERS */}
      <section className="py-16 md:py-20">
        <Container className="max-w-6xl">
          <h2 className="font-display text-on-surface text-headline-lg mb-10 text-center font-bold">
            What this pod covers
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pod.covers.map((c) => (
              <div
                key={c}
                className="bg-surface-container flex items-start gap-3 rounded-2xl border border-white/10 p-5"
              >
                <Check className="text-primary mt-0.5 size-5 shrink-0" />
                <span className="text-body-md text-on-surface">{c}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CERTIFICATION PATHWAY */}
      <section className="py-16 md:py-20">
        <Container className="max-w-6xl">
          <div className="mb-10 text-center">
            <span className="text-label-sm text-primary font-mono tracking-widest uppercase">
              {pod.pathwayLabel}
            </span>
            <h2 className="font-display text-on-surface text-headline-lg mt-3 font-bold">
              A clear path to grow
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pod.pathway.map((step, i) => (
              <li
                key={step.name}
                className="bg-surface-container relative rounded-2xl border border-white/10 p-6"
              >
                <span className="font-display text-primary/30 text-4xl font-extrabold tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="text-label-sm text-primary mt-2 font-mono tracking-widest uppercase">
                  {step.level}
                </div>
                <div className="text-body-md text-on-surface mt-1 font-semibold">
                  {step.name}
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-16 md:py-20">
        <Container className="max-w-4xl text-center">
          <h2 className="font-display text-on-surface text-headline-lg mb-8 font-bold">
            Who this pod is for
          </h2>
          <div className="flex flex-wrap justify-center gap-2.5">
            {pod.audience.map((a) => (
              <span
                key={a}
                className="bg-surface-container text-body-md text-on-surface-variant rounded-full border border-white/10 px-4 py-2"
              >
                {a}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20">
        <Container className="max-w-3xl text-center">
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            Ready to grow with the {pod.name} pod?
          </h2>
          <p className="text-body-lg text-on-surface-variant mx-auto mt-4 max-w-xl">
            Join ETEN to connect with verified specialists, follow the
            certification pathway, and build proof of your capability.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild variant="brand" size="pill" className="font-bold">
              <Link href="/join">
                Join ETEN
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              variant="brandOutline"
              size="pill"
              className="font-bold"
            >
              <Link href="/contact">Talk to Expervia</Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
