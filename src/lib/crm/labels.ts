/** Display wording for CRM values. Client-safe. */

export const VIEW_LABEL = {
  all: "All contacts",
  eten: "ETEN",
  customer: "Customers",
  "women-in-tech": "Women in Tech",
  review: "Needs review",
} as const;

export const ACCOUNT_LABEL = {
  any: "Any account status",
  active: "Active account",
  pending: "Not activated yet",
  none: "No account",
} as const;

export const SORT_LABEL = {
  newest: "Newest first",
  oldest: "Oldest first",
  name: "Name A to Z",
  activity: "Recent activity",
} as const;

export const AUDIENCE_LABEL = { eten: "ETEN", customer: "Customer" } as const;

export const REVIEW_LABEL: Record<string, string> = {
  phone_match: "Phone matches another account",
};

export const COMMUNITY_LABEL: Record<string, string> = {
  "women-in-tech": "Women in Tech",
};

export function fullName(first: string, last: string): string {
  return `${first} ${last}`.trim() || "No name";
}

export function initialsOf(first: string, last: string): string {
  return (
    [first, last]
      .map((p) => p.trim().charAt(0))
      .join("")
      .toUpperCase() || "?"
  );
}

export function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}
