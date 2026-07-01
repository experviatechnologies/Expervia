import { CloudCheck, BadgeCheck, Network } from "lucide-react";
import { Container } from "@/components/shared/container";

const partners = [
  { icon: CloudCheck, label: "Microsoft AI Cloud Partner" },
  { icon: BadgeCheck, label: "Microsoft Cloud Solutions Partner" },
  { icon: Network, label: "Huawei Enterprise Partner" },
];

export function TrustBar() {
  return (
    <div className="bg-surface-container-low border-y border-white/5 py-12">
      <Container>
        <div className="flex flex-wrap items-center justify-center gap-12 opacity-70 transition-all hover:opacity-100 md:justify-between">
          {partners.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="text-primary size-5" />
              <span className="text-label-sm font-mono font-bold tracking-widest uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
