import { Mic, Handshake } from "lucide-react";
import {
  ButtonLink,
  IconBadge,
  Section,
  SectionIntro,
} from "@/components/site/ui";

export function GetInvolved() {
  return (
    <Section
      id="get-involved"
      labelledBy="get-involved-heading"
      tone="lavender"
    >
      <SectionIntro
        id="get-involved-heading"
        eyebrow="Get Involved"
        title="Shape the Conversation"
        center
      />
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <article className="bg-brand-900 relative flex flex-col overflow-hidden rounded-3xl p-8 text-white shadow-[0_24px_50px_-28px_rgba(33,0,93,0.8)] md:p-10">
          <div
            aria-hidden
            className="bg-brand-600/40 absolute -right-24 -bottom-24 size-72 rounded-full blur-3xl"
          />
          <div className="relative flex grow flex-col">
            <IconBadge icon={Mic} dark />
            <h3 className="font-jakarta mt-6 text-2xl font-bold">
              Are You a Technology Expert?
            </h3>
            <p className="text-brand-100/90 mt-3 mb-8 leading-relaxed">
              Share your expertise with the community. Speak on a panel, run a
              hands-on workshop, or lead a masterclass, and get featured across
              the ETEN network.
            </p>
            <ButtonLink
              href="#register"
              variant="light"
              arrow
              className="mt-auto self-start"
            >
              Apply to Speak
            </ButtonLink>
          </div>
        </article>

        <article className="border-brand-100 flex flex-col rounded-3xl border bg-white p-8 md:p-10">
          <IconBadge icon={Handshake} />
          <h3 className="font-jakarta text-brand-950 mt-6 text-2xl font-bold">
            Bring Your Challenges to the Conversation
          </h3>
          <p className="text-ink/75 mt-3 mb-8 leading-relaxed">
            Partner with us to host sessions, sponsor events, and engage with
            top technology talent and experts across Africa.
          </p>
          <ButtonLink
            href="/contact"
            variant="outline"
            arrow
            className="mt-auto self-start"
          >
            Partner With Us
          </ButtonLink>
        </article>
      </div>
    </Section>
  );
}
