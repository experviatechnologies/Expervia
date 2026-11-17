import {
  HeartHandshake,
  Mic,
  Flag,
  Wrench,
  Handshake,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";
import { ContributorForm } from "./contributor-form";

const roles: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: HeartHandshake,
    title: "Mentor",
    description: "Guide women as they grow their skills and careers.",
  },
  {
    icon: Mic,
    title: "Speaker",
    description: "Share insight at conversations, webinars and workshops.",
  },
  {
    icon: Flag,
    title: "Community Leader",
    description: "Help shape and run community activities.",
  },
  {
    icon: Wrench,
    title: "Technical Contributor",
    description: "Lead hands-on sessions and practical projects.",
  },
  {
    icon: Handshake,
    title: "Partnership Contributor",
    description: "Explore how your organisation can support the community.",
  },
  {
    icon: Megaphone,
    title: "Ambassador",
    description: "Represent the community in your school, city or network.",
  },
];

export function WitContribute() {
  return (
    <Section id="contribute" labelledBy="wit-contrib-heading">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div>
          <SectionIntro
            id="wit-contrib-heading"
            eyebrow="Become a Contributor"
            title="Your Experience Can Create Opportunities for Someone Else."
            intro="Experienced women and industry professionals make this community stronger. Tell us how you would like to get involved and the ETEN team will follow up."
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {roles.map(({ icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <IconBadge icon={icon} className="size-11" />
                <div>
                  <h3 className="font-jakarta text-brand-950 font-bold">
                    {title}
                  </h3>
                  <p className="text-ink/75 mt-0.5 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-brand-100 bg-lavender rounded-3xl border p-6 shadow-[0_24px_50px_-34px_rgba(33,0,93,0.45)] sm:p-8 md:p-10">
          <h3 className="font-jakarta text-brand-950 text-2xl font-bold">
            Express your interest
          </h3>
          <p className="text-ink/70 mt-1 mb-8 text-sm">
            Fields marked <span className="text-brand-700">*</span> are
            required.
          </p>
          <ContributorForm />
        </div>
      </div>
    </Section>
  );
}
