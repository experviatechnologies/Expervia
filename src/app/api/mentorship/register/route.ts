import { createClient } from "@supabase/supabase-js";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import {
  isDisposableEmail,
  clientIp,
  checkRateLimit,
} from "@/lib/eten/spam-guard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  fullName?: string;
  email?: string;
  password?: string;
  intent?: string;
  capabilityArea?: string;
} & Record<string, unknown>;

/**
 * Creates a mentorship Prospect account. The register form posts here (rather
 * than calling signUp directly) so the anti-spam guards run server-side before
 * an account is created. On success Supabase sends the confirmation email; the
 * auth trigger (migration 23) writes signup_source / intent / capability area
 * onto the members row with validated_at null (Prospect).
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: a filled hidden field is a bot. Pretend success, create nothing.
  const honeypot = body[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return Response.json({ ok: true });
  }

  const ip = clientIp(request.headers);
  if (
    !checkRateLimit(`mnt-register:${ip}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })
  ) {
    return Response.json(
      { error: "Too many attempts. Please try again in a little while." },
      { status: 429 },
    );
  }

  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const intent = body.intent === "mentor" ? "mentor" : "mentee";
  const capabilityArea = body.capabilityArea?.trim() ?? "";

  if (fullName.length < 2) {
    return Response.json(
      { error: "Please enter your full name." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (isDisposableEmail(email)) {
    return Response.json(
      { error: "Please register with a permanent email address." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return Response.json({ error: "Server not configured." }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const next =
    intent === "mentor" ? "/mentorship/mentor" : "/mentorship/dashboard";

  // Anon client, no session — we only want to create the account and trigger
  // the confirmation email. The prospect confirms, then signs in.
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.auth.signUp({
    email: email.toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName,
        signup_source: "mentorship",
        mentorship_intent: intent,
        mentorship_capability_area: capabilityArea,
      },
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("registered") || msg.includes("already")) {
      return Response.json(
        { error: "That email is already registered. Try signing in instead." },
        { status: 409 },
      );
    }
    return Response.json(
      { error: "Couldn't create your account. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
