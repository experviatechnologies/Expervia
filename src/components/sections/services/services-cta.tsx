import { ButtonLink } from "@/components/site/ui";
import { CtaPanel } from "@/components/site/cta-panel";

export function ServicesCta() {
  return (
    <CtaPanel
      id="services-cta-heading"
      title="Ready to Accelerate Your Transformation?"
      intro="Schedule a strategy session with our specialists to map your technical roadmap and pinpoint immediate, high-ROI opportunities."
    >
      <ButtonLink href="/contact" variant="light" arrow>
        Speak with an Expert
      </ButtonLink>
      <ButtonLink href="/contact" variant="outlineLight">
        Book a Consultation
      </ButtonLink>
    </CtaPanel>
  );
}
