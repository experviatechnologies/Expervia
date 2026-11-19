import { ButtonLink } from "@/components/site/ui";
import { PageHero } from "@/components/site/page-hero";

export function HuaweiHero() {
  return (
    <PageHero
      id="huawei-hero-heading"
      eyebrow="Huawei Enterprise Partner"
      title={
        <>
          Join the Expervia{" "}
          <span className="text-brand-200">Huawei Professionals</span> Community
        </>
      }
      intro="Building Africa's premier network of Huawei-certified professionals. Scale your impact with the region's elite cloud and infrastructure ecosystem."
      actions={
        <>
          <ButtonLink href="#apply" variant="light" arrow>
            Apply to Join
          </ButtonLink>
          <ButtonLink href="#foundation" variant="outlineLight">
            View Our Vision
          </ButtonLink>
        </>
      }
    />
  );
}
