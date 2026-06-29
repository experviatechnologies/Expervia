import Link from "next/link";
import { UserRound } from "lucide-react";
import { Container } from "@/components/shared/container";

const leaders = [
  { name: "David Chen", role: "Chief Executive Officer" },
  { name: "Sarah Al-Fayed", role: "Chief Technology Officer" },
  { name: "Marcus Thorne", role: "Head of Cybersecurity" },
  { name: "Elena Rodriguez", role: "VP, Customer Success" },
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
              {/* Headshot placeholder — TODO: swap to next/image with real photo */}
              <div className="bg-surface-container-high flex size-full items-center justify-center">
                <UserRound className="text-on-surface-variant/20 size-24" />
              </div>
              <div className="from-background via-background/20 absolute inset-0 bg-gradient-to-t to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 w-full p-6">
                <p className="text-label-sm text-primary mb-1 font-mono uppercase">
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
