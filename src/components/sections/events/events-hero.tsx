import { ButtonLink } from "@/components/site/ui";
import { PageHero } from "@/components/site/page-hero";

export function EventsHero() {
  return (
    <PageHero
      id="events-hero-heading"
      eyebrow="Expervia Technology Experts Network"
      title={
        <>
          Connect. Learn. <span className="text-brand-200">Build.</span> Lead.
        </>
      }
      intro="Technology events for Africa's Microsoft & digital technology community."
      actions={
        <>
          <ButtonLink href="#register" variant="light" arrow>
            Register for an Event
          </ButtonLink>
          <ButtonLink href="#get-involved" variant="outlineLight">
            Become a Speaker
          </ButtonLink>
        </>
      }
    >
      <p className="text-brand-100/80 mt-4 max-w-2xl text-base leading-relaxed">
        Join the Expervia Technology Experts Network (ETEN). Engage in
        high-impact discussions, hands-on workshops, and strategic masterclasses
        designed to accelerate your expertise and career in the modern
        enterprise landscape.
      </p>
    </PageHero>
  );
}
