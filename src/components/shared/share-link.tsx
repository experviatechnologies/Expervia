"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

/**
 * A shareable link: a copy-to-clipboard pill plus WhatsApp / LinkedIn / X /
 * email share buttons. Two looks: "hero" (light-on-dark, for the gradient hero)
 * and "panel" (mnt tokens, for cards). The URL is shown and shared verbatim.
 */
export function ShareLink({
  url,
  variant = "panel",
  message,
}: {
  url: string;
  variant?: "hero" | "panel";
  message?: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    try {
      navigator.clipboard.writeText(url).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        },
        () => {},
      );
    } catch {
      /* clipboard unavailable */
    }
  }

  const encUrl = encodeURIComponent(url);
  const encMsg = encodeURIComponent(message ? `${message} ${url}` : url);
  const shares = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encMsg}`, node: "W" },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`,
      node: "in",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encUrl}`,
      node: "X",
    },
    {
      label: "Email",
      href: `mailto:?body=${encMsg}`,
      node: <Mail className="size-4" />,
    },
  ];

  const hero = variant === "hero";
  const shown = url.replace(/^https?:\/\//, "");

  return (
    <div className="flex flex-col items-end gap-2">
      <div
        className={
          "flex items-center gap-2 rounded-full py-1 pr-1 pl-3.5 " +
          (hero
            ? "border border-white/25 bg-white/12"
            : "border-mnt-line bg-mnt-panel-2 border")
        }
      >
        <span
          className={
            "truncate font-mono text-[12.5px] " +
            (hero ? "text-white/90" : "text-mnt-ink-muted")
          }
          title={url}
        >
          {shown}
        </span>
        <button
          type="button"
          onClick={copy}
          className={
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold transition " +
            (hero
              ? "bg-white text-[#110263] hover:brightness-95"
              : "bg-mnt-brand text-mnt-on-brand hover:brightness-110")
          }
        >
          {copied ? (
            <>
              <Check className="size-3.5" strokeWidth={2.6} /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" strokeWidth={2.2} /> Copy link
            </>
          )}
        </button>
      </div>
      <div
        className={
          "flex items-center gap-1.5 text-[12px] " +
          (hero ? "text-white/80" : "text-mnt-ink-muted")
        }
      >
        Share
        {shares.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${s.label}`}
            className={
              "grid size-8 place-items-center rounded-full text-[13px] font-extrabold transition " +
              (hero
                ? "bg-white/14 text-white hover:bg-white/24"
                : "bg-mnt-panel-2 text-mnt-ink-muted hover:text-mnt-ink")
            }
          >
            {s.node}
          </a>
        ))}
      </div>
    </div>
  );
}
