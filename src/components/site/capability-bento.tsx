import type { LucideIcon } from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  type Tone,
} from "@/components/site/ui";
import { cn } from "@/lib/utils";

export type Capability = {
  name: string;
  icon: LucideIcon;
  description: string;
  /** Column span on large screens, e.g. "lg:col-span-2". */
  span: string;
  eyebrow?: string;
  /** Shown as the large indigo card. */
  featured?: boolean;
  tags?: string[];
};

/**
 * "What We Build" capability grid used by the Solutions pages: one featured
 * indigo card plus white cards, in a 3-column bento on large screens.
 */
export function CapabilityBento({
  id,
  eyebrow = "What We Build",
  title,
  items,
  tone = "lavender",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  items: readonly Capability[];
  tone?: Tone;
}) {
  return (
    <Section id={id} labelledBy={`${id}-heading`} tone={tone}>
      <SectionIntro
        id={`${id}-heading`}
        eyebrow={eyebrow}
        title={title}
        center
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map(
          ({
            name,
            icon,
            description,
            span,
            eyebrow: kicker,
            featured,
            tags,
          }) => (
            <li
              key={name}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl p-7 sm:p-9",
                span,
                featured
                  ? "bg-brand-900 text-white shadow-[0_24px_50px_-28px_rgba(33,0,93,0.8)] md:col-span-2"
                  : "border-brand-100 hover:border-brand-200 border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(33,0,93,0.35)]",
              )}
            >
              {featured && (
                <div
                  aria-hidden
                  className="bg-brand-600/40 absolute -right-24 -bottom-24 size-72 rounded-full blur-3xl"
                />
              )}
              <div className="relative flex grow flex-col">
                <IconBadge icon={icon} dark={featured} />
                {kicker && (
                  <p
                    className={cn(
                      "mt-6 text-xs font-bold tracking-[0.2em] uppercase",
                      featured ? "text-brand-200" : "text-brand-600",
                    )}
                  >
                    {kicker}
                  </p>
                )}
                <h3
                  className={cn(
                    "font-jakarta font-bold",
                    kicker ? "mt-2" : "mt-5",
                    featured
                      ? "text-2xl text-white sm:text-3xl"
                      : "text-brand-950 text-xl",
                  )}
                >
                  {name}
                </h3>
                <p
                  className={cn(
                    "mt-3 max-w-xl leading-relaxed",
                    featured ? "text-brand-100/90 text-lg" : "text-ink/75",
                  )}
                >
                  {description}
                </p>
                {tags && (
                  <ul className="mt-auto flex flex-wrap gap-2 pt-7">
                    {tags.map((t) => (
                      <li
                        key={t}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          featured
                            ? "text-brand-50 border border-white/15 bg-white/10"
                            : "bg-lavender text-brand-800",
                        )}
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ),
        )}
      </ul>
    </Section>
  );
}
