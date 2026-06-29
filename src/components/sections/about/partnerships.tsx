import { Cloud, RadioTower, type LucideIcon } from "lucide-react";
import { Container } from "@/components/shared/container";

const partners: {
  icon: LucideIcon;
  accent: string;
  title: string;
  body: string;
  tags: string[];
}[] = [
  {
    icon: Cloud,
    accent: "border-l-blue-500 text-blue-500",
    title: "Microsoft Solutions",
    body: "Advanced deployment of Azure Cloud, M365 Modern Workplace, and enterprise Security solutions.",
    tags: ["Azure AI", "Dynamics 365", "Sentinel"],
  },
  {
    icon: RadioTower,
    accent: "border-l-red-500 text-red-500",
    title: "Huawei Technologies",
    body: "Cutting-edge Cloud Stack, high-performance Data Storage, and Intelligent Networking infrastructure.",
    tags: ["Cloud Stack 8.x", "OceanStor", "AirEngine"],
  },
];

export function Partnerships() {
  return (
    <section className="py-section">
      <Container>
        <div className="mb-16 text-center">
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            Strategic Ecosystem Partnerships
          </h2>
          <p className="text-body-lg text-on-surface-variant mx-auto max-w-2xl">
            We leverage world-class technology stacks to deliver local impact.
          </p>
        </div>
        <div className="gap-gutter grid grid-cols-1 md:grid-cols-2">
          {partners.map(({ icon: Icon, accent, title, body, tags }) => (
            <div
              key={title}
              className={`partnership-card rounded-2xl border-l-4 p-8 ${accent.split(" ")[0]}`}
            >
              <div className="mb-6 flex items-center gap-3">
                <Icon className={`size-9 ${accent.split(" ")[1]}`} />
                <h3 className="font-display text-on-surface text-headline-md font-semibold">
                  {title}
                </h3>
              </div>
              <p className="text-body-md text-on-surface-variant mb-6">
                {body}
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-surface-container border-outline-variant text-label-sm rounded border px-3 py-1 font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
