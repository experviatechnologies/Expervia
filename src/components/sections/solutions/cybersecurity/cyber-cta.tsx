import { ButtonLink } from "@/components/site/ui";
import { CtaPanel } from "@/components/site/cta-panel";

export function CyberCta() {
  return (
    <CtaPanel
      id="cyber-cta-heading"
      title="Ready to Strengthen Your Defenses?"
      intro="Let's pressure-test your security posture and build a roadmap to resilience, starting with a free assessment."
    >
      <ButtonLink href="/contact" variant="light" arrow>
        Book a Consultation
      </ButtonLink>
      <ButtonLink href="/contact" variant="outlineLight">
        Request an Assessment
      </ButtonLink>
    </CtaPanel>
  );
}
