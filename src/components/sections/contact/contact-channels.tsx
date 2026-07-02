import {
  Mail,
  CircleDollarSign,
  Handshake,
  Headset,
  MapPin,
  Phone,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { siteConfig } from "@/config/site";

const channels: {
  icon: LucideIcon;
  title: string;
  description: string;
  email: string;
}[] = [
  {
    icon: Mail,
    title: "General Enquiries",
    description:
      "For information about our services, partnerships, solutions, events, or community initiatives.",
    email: siteConfig.contact.emails.general,
  },
  {
    icon: CircleDollarSign,
    title: "Sales Enquiries",
    description:
      "Speak with our consultants about AI, Cloud, Cybersecurity, Microsoft & Huawei Solutions, Managed Services, and Digital Transformation projects.",
    email: siteConfig.contact.emails.general,
  },
  {
    icon: Handshake,
    title: "Partnerships",
    description:
      "Interested in strategic partnerships, technology alliances, channel relationships, or ecosystem collaborations? We'd love to hear from you.",
    email: siteConfig.contact.emails.general,
  },
  {
    icon: Headset,
    title: "Support",
    description:
      "For existing customers needing technical assistance, service requests, or help with an active engagement.",
    email: siteConfig.contact.emails.general,
  },
];

export function ContactChannels() {
  const { address, phones, website, mapQuery } = siteConfig.contact;
  const encodedQuery = encodeURIComponent(mapQuery);
  const mapEmbedSrc = `https://maps.google.com/maps?q=${encodedQuery}&z=16&output=embed`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`;

  return (
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="gap-gutter grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {channels.map(({ icon: Icon, title, description, email }) => (
            <div
              key={title}
              className="glass-card border-t-primary group hover:bg-surface-container flex h-full min-w-0 flex-col rounded-xl border-t-2 p-8 transition-all"
            >
              <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
                <Icon className="size-6" />
              </div>
              <h3 className="font-display text-on-surface text-headline-md mb-4 font-semibold">
                {title}
              </h3>
              <p className="text-on-surface-variant mb-6 grow text-sm">
                {description}
              </p>
              <a
                href={`mailto:${email}`}
                className="text-primary mt-auto inline-flex items-center gap-2 text-sm font-bold hover:underline"
              >
                <Mail className="size-4 shrink-0" />
                <span className="min-w-0 break-all">{email}</span>
              </a>
            </div>
          ))}
        </div>

        {/* Head office */}
        <div className="glass-card mt-gutter gap-gutter grid grid-cols-1 items-center rounded-xl p-10 md:grid-cols-2">
          <div>
            <h3 className="font-display text-on-surface text-headline-md mb-6 font-semibold">
              Global Head Office
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="text-primary mt-1 size-5 shrink-0" />
                <p className="text-on-surface-variant">{address}</p>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="text-primary mt-1 size-5 shrink-0" />
                <div className="flex flex-col gap-1">
                  {phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                      className="text-on-surface-variant hover:text-primary transition-colors"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Globe className="text-primary mt-1 size-5 shrink-0" />
                <a
                  href={`https://${website}`}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  {website}
                </a>
              </div>
            </div>
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary mt-8 inline-flex items-center gap-2 font-bold hover:underline"
            >
              <MapPin className="size-4" />
              Get directions
            </a>
          </div>
          {/* Embedded map. Center it precisely by setting an exact
              "lat,lng" in siteConfig.contact.mapQuery. */}
          <div className="bg-surface-container-high h-64 overflow-hidden rounded-xl md:h-full md:min-h-80">
            <iframe
              title="Expervia Global Head Office location"
              src={mapEmbedSrc}
              className="size-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
