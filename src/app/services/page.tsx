import { ServicesHero } from "@/components/sections/services/services-hero";
import { ServicesOutcomes } from "@/components/sections/services/services-outcomes";
import { ServicesPortfolio } from "@/components/sections/services/services-portfolio";
import { ServicesPartners } from "@/components/sections/services/services-partners";
import { ServicesIndustries } from "@/components/sections/services/services-industries";
import { ServicesCta } from "@/components/sections/services/services-cta";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/services");

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <ServicesOutcomes />
      <ServicesPortfolio />
      <ServicesPartners />
      <ServicesIndustries />
      <ServicesCta />
    </>
  );
}
