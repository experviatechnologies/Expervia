import { IndustriesHero } from "@/components/sections/industries/industries-hero";
import { IndustryGrid } from "@/components/sections/industries/industry-grid";
import { TransformationPriorities } from "@/components/sections/industries/transformation-priorities";
import { WhyChoose } from "@/components/sections/industries/why-choose";
import { IndustriesCta } from "@/components/sections/industries/industries-cta";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/industries");

export default function IndustriesPage() {
  return (
    <>
      <IndustriesHero />
      <IndustryGrid />
      <TransformationPriorities />
      <WhyChoose />
      <IndustriesCta />
    </>
  );
}
