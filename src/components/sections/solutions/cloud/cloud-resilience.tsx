import Image from "next/image";
import {
  ShieldCheck,
  HeartPulse,
  ScrollText,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const pillars: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: "Zero-Trust Security",
    body: "Identity-first access, encryption, and least-privilege by default.",
  },
  {
    icon: HeartPulse,
    title: "High Availability & DR",
    body: "Multi-zone resilience and tested disaster-recovery runbooks.",
  },
  {
    icon: ScrollText,
    title: "Compliance & Sovereignty",
    body: "Regional data residency aligned to ISO, SOC 2, and local regulation.",
  },
  {
    icon: Activity,
    title: "Full Observability",
    body: "End-to-end monitoring, tracing, and alerting across every workload.",
  },
];

export function CloudResilience() {
  return (
    <section className="bg-surface py-section">
      <Container>
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Image slot — swap /public/images/cloud-resilience.jpg and update src */}
          <div className="relative order-last aspect-square overflow-hidden rounded-3xl lg:order-first">
            <Image
              src="/images/cloud-resilience.svg"
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="from-surface/40 absolute inset-0 bg-gradient-to-t to-transparent" />
          </div>

          <div>
            <SectionLabel className="mb-4">Secure & Resilient</SectionLabel>
            <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
              Built to Stay Secure and Always-On
            </h2>
            <p className="text-on-surface-variant text-body-lg mb-8">
              Resilience and security aren&apos;t add-ons — we engineer them
              into every landing zone, so your platform is trusted from day one.
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {pillars.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <span className="bg-primary/20 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-on-surface font-bold">{title}</h3>
                    <p className="text-on-surface-variant text-sm">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
