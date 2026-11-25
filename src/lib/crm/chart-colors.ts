/**
 * CRM chart colours. Kept out of the "use client" chart file on purpose: a
 * server component that imports a plain value from a client module gets a
 * reference, not the value, so the colours would arrive empty.
 *
 * Validated with the dataviz palette checker on white: brand #6426dc and
 * second #e0861a (CVD ΔE 37). The orange is under 3:1 on white, so charts
 * using it need a legend and table view.
 */
export const CRM_SERIES = {
  brand: "#6426dc",
  second: "#e0861a",
} as const;
