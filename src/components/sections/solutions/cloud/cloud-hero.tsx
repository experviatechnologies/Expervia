import { ButtonLink } from "@/components/site/ui";
import { HeroChips, PageHero } from "@/components/site/page-hero";

const chips = [
  "Azure",
  "Huawei Cloud",
  "Hybrid & Multi-Cloud",
  "Migration",
  "Kubernetes",
  "FinOps",
];

export function CloudHero() {
  return (
    <PageHero
      id="cloud-hero-heading"
      eyebrow="Cloud Transformation"
      title={
        <>
          Migrate and Modernize on a Secure, Scalable{" "}
          <span className="text-brand-200">Cloud</span>
        </>
      }
      intro="Hybrid and multi-cloud strategies powered by Microsoft Azure and Huawei Cloud: migrated securely, optimized for cost, and engineered for resilience from day one."
      actions={
        <>
          <ButtonLink href="/contact" variant="light" arrow>
            Speak with a Cloud Architect
          </ButtonLink>
          <ButtonLink href="/contact" variant="outlineLight">
            Book a Consultation
          </ButtonLink>
        </>
      }
    >
      <HeroChips items={chips} label="Cloud capabilities" />
    </PageHero>
  );
}
