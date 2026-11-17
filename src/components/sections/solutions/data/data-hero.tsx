import { ButtonLink } from "@/components/site/ui";
import { HeroChips, PageHero } from "@/components/site/page-hero";

const chips = [
  "Data Strategy",
  "Modern Data Platform",
  "BI & Dashboards",
  "Data Engineering",
  "Governance",
  "Predictive Analytics",
];

export function DataHero() {
  return (
    <PageHero
      id="data-hero-heading"
      eyebrow="Data & Analytics"
      title={
        <>
          Turn Raw Data Into Decisive{" "}
          <span className="text-brand-200">Intelligence</span>
        </>
      }
      intro="We unify your data, modernize the platform beneath it, and surface the insight that drives faster, smarter decisions, from real-time dashboards to predictive models."
      actions={
        <>
          <ButtonLink href="/contact" variant="light" arrow>
            Talk to a Data Expert
          </ButtonLink>
          <ButtonLink href="/contact" variant="outlineLight">
            Book a Consultation
          </ButtonLink>
        </>
      }
    >
      <HeroChips items={chips} label="Data capabilities" />
    </PageHero>
  );
}
