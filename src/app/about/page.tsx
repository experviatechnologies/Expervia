import { AboutHero } from "@/components/sections/about/about-hero";
import { Beliefs } from "@/components/sections/about/beliefs";
import { Expertise } from "@/components/sections/about/expertise";
import { Partnerships } from "@/components/sections/about/partnerships";
import { IndustriesWhy } from "@/components/sections/about/industries-why";
import { Leadership } from "@/components/sections/about/leadership";
import { AboutCta } from "@/components/sections/about/about-cta";
import { pageMeta } from "@/lib/seo";
import { ServingAfrica } from "@/components/site/internal-links";

export const metadata = pageMeta("/about");

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <Beliefs />
      <Expertise />
      <Partnerships />
      <IndustriesWhy />
      <Leadership />
      <ServingAfrica />
      <AboutCta />
    </>
  );
}
