import type { Metadata } from "next";
import { AboutHero } from "@/components/sections/about/about-hero";
import { Beliefs } from "@/components/sections/about/beliefs";
import { Expertise } from "@/components/sections/about/expertise";
import { Partnerships } from "@/components/sections/about/partnerships";
import { IndustriesWhy } from "@/components/sections/about/industries-why";
import { Leadership } from "@/components/sections/about/leadership";
import { AboutCta } from "@/components/sections/about/about-cta";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Expervia Technologies — Africa's architect of the intelligent future, combining deep technical rigor with strategic foresight across AI, Cloud, and Cybersecurity.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <Beliefs />
      <Expertise />
      <Partnerships />
      <IndustriesWhy />
      <Leadership />
      <AboutCta />
    </>
  );
}
