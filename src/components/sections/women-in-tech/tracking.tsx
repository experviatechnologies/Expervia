"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

/** Fires `women_in_tech_page_view` once when the landing page mounts. */
export function WitPageView() {
  useEffect(() => {
    trackEvent("women_in_tech_page_view");
  }, []);
  return null;
}

/**
 * A Next Link that records a CTA click. `location` says which section the
 * click came from (hero, nav, final, ...) so CTA placements can be compared.
 */
export function TrackedLink({
  event,
  location,
  ...props
}: React.ComponentProps<typeof Link> & {
  event: "women_in_tech_join_click" | "women_in_tech_contributor_click";
  location: string;
}) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(event, { location });
        props.onClick?.(e);
      }}
    />
  );
}
