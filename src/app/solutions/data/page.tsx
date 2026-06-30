import type { Metadata } from "next";
import { DataHero } from "@/components/sections/solutions/data/data-hero";
import { DataCapabilities } from "@/components/sections/solutions/data/data-capabilities";
import { DataApproach } from "@/components/sections/solutions/data/data-approach";
import { DataStack } from "@/components/sections/solutions/data/data-stack";
import { DataInsight } from "@/components/sections/solutions/data/data-insight";
import { DataAssessments } from "@/components/sections/solutions/data/data-assessments";
import { DataCta } from "@/components/sections/solutions/data/data-cta";

export const metadata: Metadata = {
  title: "Data & Analytics",
  description:
    "Data & Analytics from Expervia — modern data platforms, data engineering, business intelligence, and predictive analytics built on Microsoft Fabric, Azure Synapse, Power BI, and Databricks.",
};

export default function DataSolutionsPage() {
  return (
    <>
      <DataHero />
      <DataCapabilities />
      <DataApproach />
      <DataStack />
      <DataInsight />
      <DataAssessments />
      <DataCta />
    </>
  );
}
