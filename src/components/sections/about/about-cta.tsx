import { ButtonLink } from "@/components/site/ui";
import { CtaPanel } from "@/components/site/cta-panel";

export function AboutCta() {
  return (
    <CtaPanel
      id="about-cta-heading"
      title="Building Africa's Intelligent Future"
      intro="Join the forward-thinking organizations building the future on Expervia's intelligence framework. Let's architect your success story together."
    >
      <ButtonLink href="/contact" variant="light" arrow>
        Schedule an Architecture Review
      </ButtonLink>
    </CtaPanel>
  );
}
