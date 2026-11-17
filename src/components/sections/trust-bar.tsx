import { BadgeCheck } from "lucide-react";

const partners = [
  "Microsoft AI Cloud Partner",
  "Microsoft Cloud Solutions Partner",
  "Huawei Enterprise Partner",
];

/** Partner strip directly under the home hero. */
export function TrustBar() {
  return (
    <div className="border-brand-100 border-b bg-white">
      <ul
        aria-label="Partnerships"
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-8 sm:px-6 md:justify-between lg:px-8"
      >
        {partners.map((p) => (
          <li
            key={p}
            className="bg-lavender text-brand-950 flex items-center gap-3 rounded-2xl px-4 py-3 text-[0.95rem] font-semibold"
          >
            <BadgeCheck
              aria-hidden
              className="text-brand-600 size-5 shrink-0"
            />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
