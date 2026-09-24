import Link from "next/link";

/**
 * Public top navigation for the standalone ETEN Mentorship product. Shared by
 * the landing and the other public pages (register, sign in). Uses the mnt-*
 * theme tokens (lighter purple brand) so it reads as its own product, distinct
 * from both the marketing site and the member app.
 */
export function MntNav() {
  return (
    <header className="border-mnt-line bg-mnt-bg/85 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-[74px] max-w-[1140px] items-center justify-between px-6">
        <Link href="/mentorship" className="flex items-center gap-2.5">
          <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-[30px] place-items-center rounded-[9px] bg-gradient-to-br text-sm font-extrabold">
            E
          </span>
          <span className="leading-none">
            <span className="text-mnt-ink font-display block text-[15px] font-extrabold">
              ETEN Mentorship
            </span>
            <span className="text-mnt-faint block font-mono text-[9.5px] tracking-[0.16em] uppercase">
              Capability Circles
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/mentorship#how"
            className="text-mnt-muted hover:text-mnt-ink hidden transition-colors sm:inline"
          >
            How it works
          </Link>
          <Link
            href="/mentorship#ladder"
            className="text-mnt-muted hover:text-mnt-ink hidden transition-colors md:inline"
          >
            Capability ladder
          </Link>
          <Link
            href="/mentorship#faq"
            className="text-mnt-muted hover:text-mnt-ink hidden transition-colors sm:inline"
          >
            FAQ
          </Link>
          <Link
            href="/mentorship/dashboard"
            className="text-mnt-muted hover:text-mnt-ink hidden transition-colors sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/mentorship/register"
            className="bg-mnt-brand text-mnt-on-brand rounded-[10px] px-4 py-2.5 font-bold transition hover:brightness-110"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
