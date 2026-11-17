import {
  HeartHandshake,
  Mic,
  Flag,
  Wrench,
  Handshake,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";
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
    <section id="contribute" className="py-section scroll-mt-36">
      <Container className="max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <SectionLabel className="mb-4">Become a Contributor</SectionLabel>
            <h2 className="font-display text-on-surface text-headline-lg mb-5 font-bold text-balance">
              Your Experience Can Create{" "}
              <span className="gradient-text">
                Opportunities for Someone Else.
              </span>
            </h2>
            <p className="text-on-surface-variant text-body-lg mb-10">
              Experienced women and industry professionals make this community
              stronger. Tell us how you would like to get involved and the ETEN
              team will follow up.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {roles.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-3">
                  <span className="bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-on-surface font-semibold">{title}</h3>
                    <p className="text-on-surface-variant text-sm">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface-container-high relative rounded-2xl border border-white/5 p-6 shadow-xl sm:p-8 md:p-10">
            <h3 className="font-display text-on-surface text-headline-md mb-2 font-bold">
              Express your interest
            </h3>
            <p className="text-on-surface-variant mb-8 text-sm">
              Fields marked <span className="text-primary">*</span> are
              required.
            </p>
            <ContributorForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
