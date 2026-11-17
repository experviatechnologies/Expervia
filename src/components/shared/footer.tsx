import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";

// Link to the mentorship subdomain when it's configured, else the path.
const MENTORSHIP_HREF = process.env.NEXT_PUBLIC_MENTORSHIP_HOST
  ? `https://${process.env.NEXT_PUBLIC_MENTORSHIP_HOST}`
  : "/mentorship";

const partners = [
  "Microsoft AI Cloud Partner",
  "Microsoft Cloud Solutions Partner",
  "Huawei Enterprise Partner",
];

const communityLinks = [
  { title: "ETEN Expert Network", href: "/join-eten" },
  { title: "Women in Tech", href: "/women-in-tech" },
  { title: "Mentorship", href: MENTORSHIP_HREF },
  { title: "Member sign in", href: "/signin" },
];

const linkClass =
  "text-brand-100/85 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded";

function Column({
  title,
  links,
}: {
  title: string;
  links: readonly { title: string; href: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-brand-200 text-xs font-bold tracking-[0.2em] uppercase">
        {title}
      </h2>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.title}>
            <Link href={link.href} className={linkClass}>
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const { emails, phones } = siteConfig.contact;
  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr] lg:px-8">
        <div>
          <span className="flex flex-col leading-none">
            <span className="text-[1.05rem] font-bold tracking-tight text-white">
              Expervia Technologies
            </span>
            <span className="text-brand-200 mt-1 text-[0.62rem] font-semibold tracking-[0.22em] uppercase">
              Expert Network · ETEN
            </span>
          </span>
          <p className="text-brand-100/80 mt-6 max-w-sm leading-relaxed">
            Empowering Africa&apos;s digital future through strategic
            innovation, enterprise technology and security-first managed
            services.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {partners.map((p) => (
              <li
                key={p}
                className="text-brand-100/80 rounded-full border border-white/15 px-3 py-1 text-[0.65rem] font-semibold tracking-wider uppercase"
              >
                {p}
              </li>
            ))}
          </ul>
        </div>

        <Column title="Company" links={siteConfig.footerNav.company} />
        <Column title="Community" links={communityLinks} />
        <Column title="Legal" links={siteConfig.footerNav.legal} />

        <div>
          <h2 className="text-brand-200 text-xs font-bold tracking-[0.2em] uppercase">
            Become a member
          </h2>
          <p className="text-brand-100/85 mt-5 text-sm">
            Apply through the official ETEN registration page.
          </p>
          <Link
            href="/join"
            className="text-brand-950 hover:bg-brand-50 mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold tracking-[0.08em] uppercase transition"
          >
            Join ETEN
            <ArrowRight aria-hidden className="size-4" />
          </Link>
          <ul className="mt-8 space-y-2 text-sm">
            <li>
              <a
                href={`mailto:${emails.general}`}
                className={`${linkClass} inline-flex items-center gap-2`}
              >
                <Mail aria-hidden className="size-4" />
                {emails.general}
              </a>
            </li>
            {phones.map((p) => (
              <li key={p}>
                <a
                  href={`tel:${p.replace(/\s+/g, "")}`}
                  className={`${linkClass} inline-flex items-center gap-2`}
                >
                  <Phone aria-hidden className="size-4" />
                  {p}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="text-brand-100/70 mx-auto max-w-7xl px-4 py-6 text-sm sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Expervia Technologies. ETEN is an
          initiative of Expervia Technologies.
        </p>
      </div>
    </footer>
  );
}
