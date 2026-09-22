/**
 * Name of the hidden "honeypot" field shared between the public forms and their
 * API routes. It's rendered off-screen and invisible to real users, so a real
 * submission always leaves it empty; automated bots that fill every field give
 * themselves away by populating it. Client-safe (no server-only imports) so the
 * form component and the route can both reference the same name.
 */
export const HONEYPOT_FIELD = "company_url";
