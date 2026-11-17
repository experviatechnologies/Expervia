import { ButtonLink } from "@/components/site/ui";
import { HeroChips, PageHero } from "@/components/site/page-hero";

const capabilities = [
  "Generative AI",
  "Azure OpenAI",
  "Predictive ML",
  "Computer Vision",
  "NLP",
  "MLOps",
];

export function AiHero() {
  return (
    <PageHero
      id="ai-hero-heading"
      eyebrow="Artificial Intelligence"
      title={
        <>
          Operationalize <span className="text-brand-200">AI</span> that Drives
          Real Business Outcomes
        </>
      }
      intro="Generative AI, predictive analytics, and intelligent automation, designed, governed, and deployed securely. Expervia turns AI ambition into production-grade systems that move the metrics that matter."
      actions={
        <>
          <ButtonLink href="/contact" variant="light" arrow>
            Speak with an AI Specialist
          </ButtonLink>
          <ButtonLink href="/contact" variant="outlineLight">
            Book a Consultation
          </ButtonLink>
        </>
      }
    >
      <HeroChips items={capabilities} label="AI capabilities" />
    </PageHero>
  );
}
