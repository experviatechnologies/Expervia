import { ButtonLink } from "@/components/site/ui";
import { PageHero } from "@/components/site/page-hero";

export function MicrosoftHero() {
  return (
    <PageHero
      id="empc-hero-heading"
      eyebrow="Microsoft AI Cloud Partner"
      title={
        <>
          Building a Pan-African Network of{" "}
          <span className="text-brand-200">Microsoft Professionals</span>
        </>
      }
      intro="Expervia bridges the gap between certification and commercial success. We've created a trusted ecosystem where certified experts increase their professional visibility, access enterprise opportunities, and participate in revenue-generating engagements."
      actions={
        <>
          <ButtonLink href="#apply" variant="light" arrow>
            Join the Community
          </ButtonLink>
          <ButtonLink href="/contact" variant="outlineLight">
            Schedule a Discovery Call
          </ButtonLink>
        </>
      }
    />
  );
}
