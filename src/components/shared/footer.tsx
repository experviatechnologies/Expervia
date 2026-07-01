import Link from "next/link";
import { Globe, AtSign, Share2 } from "lucide-react";
import { siteConfig } from "@/config/site";

const socials = [
  { icon: Globe, label: "Website", href: "#" },
  { icon: AtSign, label: "Email", href: "#" },
  { icon: Share2, label: "Share", href: "#" },
];

const partners = [
  "Microsoft AI Cloud Partner",
  "Microsoft Cloud Solutions Partner",
  "Huawei Partner",
];

const regions = ["Africa", "Europe", "Global"];

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-outline-variant border-t">
      <div className="px-margin-mobile py-section md:px-margin-desktop overflox-x-hidden mx-auto w-full">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="font-display text-headline-md text-on-surface mb-6 font-bold">
              {siteConfig.name}
            </div>
            <p className="text-on-surface-variant text-body-md mb-8 max-w-sm">
              Empowering Africa&apos;s digital future through strategic
              innovation, enterprise technology, and security-first managed
              services.
            </p>
            <div className="mb-8 flex gap-4">
              {socials.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="border-outline-variant hover:bg-primary hover:text-surface inline-flex size-10 items-center justify-center rounded-full border transition-all"
                >
                  <Icon className="size-4" />
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 opacity-60">
              {partners.map((p) => (
                <div
                  key={p}
                  className="border-outline-variant font-label-sm rounded border px-3 py-1 text-[10px] font-bold tracking-wider uppercase"
                >
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-on-surface mb-6 font-bold">Company</h4>
            <ul className="space-y-4">
              {siteConfig.footerNav.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-on-surface-variant hover:text-primary text-sm transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-on-surface mb-6 font-bold">Legal</h4>
            <ul className="space-y-4">
              {siteConfig.footerNav.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-on-surface-variant hover:text-primary text-sm transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-on-surface mb-6 font-bold">Newsletter</h4>
            <p className="text-on-surface-variant mb-4 text-sm">
              Stay ahead of Africa&apos;s digital transformation curve.
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder="Work email"
                aria-label="Work email"
                className="bg-surface border-outline-variant focus:border-brand flex-1 rounded-l-lg border p-2 text-xs outline-none"
              />
              <button
                type="submit"
                className="bg-primary text-on-primary rounded-r-lg px-2 font-semibold"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-outline-variant/30 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-on-surface-variant text-sm">
            © {new Date().getFullYear()} {siteConfig.name} Technologies. All
            rights reserved.
          </p>
          <div className="text-on-surface-variant flex gap-8 text-sm">
            {regions.map((r) => (
              <Link
                key={r}
                href="#"
                className="hover:text-primary transition-colors"
              >
                {r}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
