import Image from "next/image";
import { Section, SectionIntro } from "@/components/site/ui";

const leaders = [
  {
    name: "Adeleke Adeyemi",
    role: "Chief Executive Officer",
    photo: "/Adeleke_Adeyemi_CEO.png",
  },
  {
    name: "Mobolaji Soyebo",
    role: "Chief Technology Officer",
    photo: "/Mobolaji_Soyebo_Chief_Technology_Officer.png",
  },
  {
    name: "Michael Ezeadichie",
    role: "Chief Marketing Officer",
    photo: "/Michael_Ezeadichie_Chief_Marketing_Officer.png",
  },
  {
    name: "Samuel Ladokun",
    role: "Chief Legal Officer",
    photo: "/Samuel_Ladokun_Chief_Legal_Officer.png",
  },
];

export function Leadership() {
  return (
    <Section id="leadership" labelledBy="leadership-heading" tone="lavender">
      <SectionIntro
        id="leadership-heading"
        eyebrow="Leadership"
        title="The Minds Behind the Intelligence"
        intro="A collective of visionary leaders and technical specialists."
        center
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {leaders.map((leader) => (
          <li
            key={leader.name}
            className="group border-brand-100 overflow-hidden rounded-3xl border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(33,0,93,0.45)]"
          >
            <div className="bg-brand-50 relative aspect-[4/5] overflow-hidden">
              <Image
                src={leader.photo}
                alt={`${leader.name}, ${leader.role} at Expervia`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h3 className="font-jakarta text-brand-950 text-lg font-bold">
                {leader.name}
              </h3>
              <p className="text-brand-600 mt-1 text-sm font-semibold">
                {leader.role}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
