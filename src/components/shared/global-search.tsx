"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";

export type SearchResult = {
  label: string;
  sub: string;
  href: string;
  kind: string;
};

/**
 * Shared top-bar global search. Styled with the neutral shadcn tokens (which
 * resolve inside every [data-app-surface] shell, light and dark), so the same
 * component drops into admin, member and mentorship chromes. The actual search
 * is a server action passed in via `search`, so each surface scopes its own
 * results.
 */
export function GlobalSearch({
  search,
  placeholder = "Search",
  className = "",
}: {
  search: (q: string) => Promise<SearchResult[]>;
  placeholder?: string;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [pending, start] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function run(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => {
      start(async () => {
        const r = await search(value);
        setResults(r);
        setSearched(true);
        setOpen(true);
      });
    }, 250);
  }

  return (
    <div ref={boxRef} className={"relative " + className}>
      <div className="border-border bg-background focus-within:border-ring flex h-10 items-center gap-2 rounded-xl border px-3 transition-colors">
        <Search
          className="text-muted-foreground size-4 shrink-0"
          strokeWidth={1.8}
        />
        <input
          type="search"
          value={q}
          onChange={(e) => run(e.target.value)}
          onFocus={() => {
            if (searched && results.length >= 0 && q.trim().length >= 2) {
              setOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
        />
        {pending && (
          <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
        )}
      </div>

      {open && (
        <div className="border-border bg-popover absolute top-[calc(100%+6px)] right-0 z-50 max-h-[min(70vh,420px)] w-[min(92vw,360px)] overflow-auto rounded-xl border p-1.5 shadow-lg">
          {results.length === 0 ? (
            <div className="text-muted-foreground px-3 py-6 text-center text-[13px]">
              {pending ? "Searching…" : `No matches for “${q.trim()}”`}
            </div>
          ) : (
            results.map((r, i) => (
              <Link
                key={`${r.href}-${i}`}
                href={r.href}
                onClick={() => setOpen(false)}
                className="hover:bg-accent flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-foreground truncate text-[13.5px] font-semibold">
                    {r.label}
                  </div>
                  {r.sub && (
                    <div className="text-muted-foreground truncate text-[12px]">
                      {r.sub}
                    </div>
                  )}
                </div>
                <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                  {r.kind}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
