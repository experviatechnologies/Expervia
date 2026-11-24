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

export const LEAD_STATUS_LABEL = {
  new: "New",
  open: "Open",
  in_progress: "In progress",
  connected: "Connected",
  unqualified: "Unqualified",
} as const;

export const LIFECYCLE_LABEL = {
  subscriber: "Subscriber",
  lead: "Lead",
  mql: "Marketing qualified lead",
  sql: "Sales qualified lead",
  opportunity: "Opportunity",
  customer: "Customer",
  evangelist: "Evangelist",
} as const;

export const ACTIVITY_LABEL: Record<string, string> = {
  note: "Note",
  call: "Call",
  meeting: "Meeting",
  email: "Email",
  form: "Form",
  stage: "Update",
  campaign: "Campaign",
  task: "Task",
  system: "System",
};

export const PRODUCT_LABEL: Record<string, string> = {
  expervia: "Expervia",
  mentorship: "Mentorship",
  academy: "Academy",
  women_in_tech: "Women in Tech",
  crm: "CRM",
};

export const POD_ROLE_LABEL = {
  member: "Member",
  lead: "Lead",
  co_lead: "Co-lead",
} as const;

export function dateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

/** Amount in minor units (kobo, cents) as money. */
export function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toFixed(0)}`;
  }
}
