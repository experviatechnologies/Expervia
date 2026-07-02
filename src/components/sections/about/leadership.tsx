import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/shared/container";

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
    <section className="py-section">
      <Container>
        <div className="mb-16 text-center">
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            The Minds Behind the Intelligence
          </h2>
          <p className="text-body-lg text-on-surface-variant mx-auto max-w-2xl">
            A collective of visionary leaders and technical specialists.
          </p>
        </div>
        <div className="gap-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((leader) => (
            <div
              key={leader.name}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl"
            >
              <Image
                src={leader.photo}
                alt={`${leader.name}, ${leader.role} at Expervia`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
              />
              <div className="from-background via-background/20 absolute inset-0 bg-gradient-to-t to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 w-full p-6">
                <p className="text-label-sm mb-1 font-mono text-[#e1d6ff] uppercase">
                  {leader.role}
                </p>
                <h4 className="font-display text-on-surface text-headline-md font-semibold">
                  {leader.name}
                </h4>
                <div className="mt-2 h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:h-8 group-hover:opacity-100">
                  <Link
                    href="#"
                    className="text-primary-container hover:text-on-surface transition-colors"
                  >
                    LinkedIn Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
