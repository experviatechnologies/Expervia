import { CloudCheck, PackageCheck, type LucideIcon } from "lucide-react";
import { Container } from "@/components/shared/container";

const credentials: { icon: LucideIcon; title: string; subtitle: string }[] = [
  {
    icon: CloudCheck,
    title: "Microsoft AI Cloud Partner",
    subtitle: "Certified Excellence",
  },
  {
    icon: PackageCheck,
    title: "Microsoft Cloud Solutions Partner",
    subtitle: "Direct Licensing & Support",
  },
];

export function PartnerTrustBar() {
  return (
    <section className="bg-surface-container-low border-y border-white/5 py-12">
      <Container>
        <div className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16 md:gap-24">
          {credentials.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="flex items-center gap-4">
              <Icon className="text-primary size-9 shrink-0" />
              <div>
                <div className="text-on-surface leading-tight font-bold">
                  {title}
                </div>
                <div className="text-on-surface-variant font-mono text-xs tracking-widest uppercase">
                  {subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
