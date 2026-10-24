"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

/**
 * Light/dark switch for the app surfaces. The theme is stored as a
 * `data-theme` attribute on <html> (set before paint by an inline script in
 * the root layout) and persisted to localStorage under "eten-theme". Marketing
 * pages keep their own fixed styling and ignore this.
 *
 * `className` lets each surface (admin / member / mentorship) style the button
 * with its own tokens; the default is a neutral bordered icon button.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Sync the control to whatever the no-flash inline script already set on
    // <html> (deferred a tick to avoid a synchronous setState in the effect).
    const id = setTimeout(() => {
      const current =
        (document.documentElement.getAttribute("data-theme") as Theme | null) ??
        "light";
      setTheme(current === "dark" ? "dark" : "light");
    }, 0);
    return () => clearTimeout(id);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("eten-theme", next);
    } catch {
      /* storage blocked — the switch still applies for this session */
    }
    setTheme(next);
  }

  const next = theme === "light" ? "dark" : "light";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={
        className ??
        "border-border text-muted-foreground hover:text-foreground inline-flex size-10 items-center justify-center rounded-xl border transition-colors"
      }
    >
      {theme === "light" ? (
        <Moon className="size-[18px]" />
      ) : (
        <Sun className="size-[18px]" />
      )}
      <span className="sr-only">Toggle light/dark theme</span>
    </button>
  );
}
