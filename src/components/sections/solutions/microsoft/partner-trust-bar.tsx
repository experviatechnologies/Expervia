import { CloudCheck, PackageCheck, type LucideIcon } from "lucide-react";
import { IconBadge } from "@/components/site/ui";

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

/** Partner credentials strip under the Microsoft hero. */
export function PartnerTrustBar() {
  return (
    <div className="border-brand-100 border-b bg-white">
      <ul
        aria-label="Microsoft partnerships"
        className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:px-8"
      >
        {credentials.map(({ icon, title, subtitle }) => (
          <li
            key={title}
            className="bg-lavender flex items-center gap-4 rounded-2xl px-5 py-4"
          >
            <IconBadge icon={icon} className="bg-white bg-none" />
            <div>
              <p className="font-jakarta text-brand-950 font-bold">{title}</p>
              <p className="text-brand-600 text-xs font-bold tracking-[0.16em] uppercase">
                {subtitle}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
