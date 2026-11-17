import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  type Tone,
} from "@/components/site/ui";

export type Assessment = { icon: LucideIcon; title: string; body: string };

/**
 * "Get Started" grid of complimentary assessments, shared by the Solutions
 * pages. Each card links to the contact page.
 */
export function AssessmentGrid({
  id,
  title,
  intro,
  items,
  tone = "white",
}: {
  id: string;
  title: string;
  intro: string;
  items: readonly Assessment[];
  tone?: Tone;
}) {
  return (
    <Section id={id} labelledBy={`${id}-heading`} tone={tone}>
      <SectionIntro
        id={`${id}-heading`}
        eyebrow="Get Started"
        title={title}
        intro={intro}
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon, title: name, body }) => (
          <li key={name}>
            <Link
              href="/contact"
              className="group border-brand-100 hover:border-brand-300 focus-visible:ring-brand-400 flex h-full flex-col rounded-3xl border bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(33,0,93,0.35)] focus-visible:ring-2 focus-visible:outline-none"
            >
              <IconBadge icon={icon} />
              <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                {name}
              </h3>
              <p className="text-ink/75 mt-2.5 flex-1 leading-relaxed">
                {body}
              </p>
              <span className="text-brand-700 mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                Request
                <span className="sr-only"> {name} assessment</span>
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
