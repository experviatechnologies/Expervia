import type { Metadata } from "next";
import { ServicesHero } from "@/components/sections/services/services-hero";
import { ServicesOutcomes } from "@/components/sections/services/services-outcomes";
import { ServicesPortfolio } from "@/components/sections/services/services-portfolio";
import { ServicesPartners } from "@/components/sections/services/services-partners";
import { ServicesIndustries } from "@/components/sections/services/services-industries";
import { ServicesCta } from "@/components/sections/services/services-cta";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Expervia's full enterprise portfolio — AI, Cloud, Cybersecurity, Data & Analytics, Microsoft Solutions, Digital Transformation, Enterprise Infrastructure, and Managed Services for Africa's intelligent enterprise.",
};

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
