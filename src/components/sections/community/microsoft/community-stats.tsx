import { Container } from "@/components/shared/container";

const stats = [
  { value: "500+", label: "Azure & M365 Experts across 12 countries" },
  { value: "12+", label: "African Nations" },
  { value: "1k+", label: "Certifications" },
];

export function CommunityStats() {
  return (
    <section className="bg-surface-container-low border-outline-variant/20 border-y py-12">
      <Container>
        <div className="grid grid-cols-1 gap-8 divide-y divide-white/5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((s) => (
            <div
              key={s.label}
              className="pt-8 text-center first:pt-0 sm:px-8 sm:pt-0"
            >
              <div className="text-primary font-display text-headline-lg mb-1 font-bold">
                {s.value}
              </div>
              <p className="text-on-surface-variant text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
