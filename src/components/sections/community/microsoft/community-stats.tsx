const stats = [
  { value: "500+", label: "Azure & M365 Experts across 12 countries" },
  { value: "12+", label: "African Nations" },
  { value: "1k+", label: "Certifications" },
];

/** Figures strip under the EMPC hero. */
export function CommunityStats() {
  return (
    <div className="border-brand-100 border-b bg-white">
      <dl className="divide-brand-100 mx-auto grid max-w-7xl gap-6 divide-y px-4 py-10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center pt-6 text-center first:pt-0 sm:px-8 sm:pt-0"
          >
            <dt className="text-ink/70 order-2 mt-1 text-sm">{s.label}</dt>
            <dd className="font-jakarta text-brand-700 order-1 text-4xl font-extrabold">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
