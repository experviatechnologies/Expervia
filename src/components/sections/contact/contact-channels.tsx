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
import {
  ButtonLink,
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";
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
    <Section id="channels" labelledBy="channels-heading">
      <SectionIntro
        id="channels-heading"
        eyebrow="Contact channels"
        title="Reach the Right Team"
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {channels.map(({ icon, title, description, email }) => (
          <li key={title} className={`${cardClass} flex min-w-0 flex-col`}>
            <IconBadge icon={icon} />
            <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
              {title}
            </h3>
            <p className="text-ink/75 mt-2.5 mb-6 grow leading-relaxed">
              {description}
            </p>
            <a
              href={`mailto:${email}`}
              className="text-brand-700 mt-auto inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
            >
              <Mail aria-hidden className="size-4 shrink-0" />
              <span className="min-w-0 break-words">
                {email.split("@")[0]}@
                <wbr />
                {email.split("@")[1]}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* Head office */}
      <div className="bg-brand-950 mt-5 grid overflow-hidden rounded-[2rem] text-white md:grid-cols-2">
        <div className="relative p-8 sm:p-10">
          <div
            aria-hidden
            className="bg-brand-600/40 absolute -top-24 -left-24 size-72 rounded-full blur-3xl"
          />
          <div className="relative">
            <h3 className="font-jakarta text-2xl font-bold">
              Global Head Office
            </h3>
            <ul className="mt-7 space-y-5">
              <li className="flex items-start gap-4">
                <MapPin
                  aria-hidden
                  className="text-brand-200 mt-0.5 size-5 shrink-0"
                />
                <span className="text-brand-100/90">{address}</span>
              </li>
              <li className="flex items-start gap-4">
                <Phone
                  aria-hidden
                  className="text-brand-200 mt-0.5 size-5 shrink-0"
                />
                <span className="flex flex-col gap-1">
                  {phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                      className="text-brand-100/90 transition-colors hover:text-white"
                    >
                      {phone}
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex items-start gap-4">
                <Globe
                  aria-hidden
                  className="text-brand-200 mt-0.5 size-5 shrink-0"
                />
                <a
                  href={`https://${website}`}
                  className="text-brand-100/90 transition-colors hover:text-white"
                >
                  {website}
                </a>
              </li>
            </ul>
            <ButtonLink
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              arrow
              className="mt-8"
            >
              Get directions
            </ButtonLink>
          </div>
        </div>
        {/* Embedded map. Center it precisely by setting an exact
            "lat,lng" in siteConfig.contact.mapQuery. */}
        <div className="bg-brand-900 h-72 md:h-full md:min-h-96">
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
    </Section>
  );
}
