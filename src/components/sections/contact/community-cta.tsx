import { Check } from "lucide-react";
import { ButtonLink, Section } from "@/components/site/ui";

const benefits = [
  "Technical Webinars",
  "Industry Insights",
  "Microsoft AI & Azure Updates",
  "Career Development",
  "Networking Opportunities",
  "Technology Events",
  "Learning Resources",
  "Collaboration Opportunities",
];

export function CommunityCta() {
  return (
    <Section
      id="community"
      labelledBy="contact-community-heading"
      tone="indigo"
    >
      <div className="flex flex-col items-start justify-between gap-12 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <p className="text-brand-200 text-xs font-bold tracking-[0.2em] uppercase">
            For technology professionals
          </p>
          <h2
            id="contact-community-heading"
            className="font-jakarta mt-4 text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]"
          >
            Join the Expervia AI &amp; Cloud Community
          </h2>
          <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {benefits.map((b) => (
              <li
                key={b}
                className="flex items-center gap-3 font-medium text-white"
              >
                <Check aria-hidden className="text-brand-200 size-5 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <ButtonLink
          href="/join-eten"
          variant="light"
          arrow
          className="shrink-0"
        >
          Join the Community
        </ButtonLink>
      </div>
    </Section>
  );
}
