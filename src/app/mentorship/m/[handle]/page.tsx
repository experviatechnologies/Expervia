import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import {
  BookingView,
  mentorBookingMeta,
} from "@/app/mentorship/book/[mentorId]/page";

async function mentorIdFor(handle: string): Promise<string | null> {
  const { data } = await getSupabaseAdmin()
    .from("mentor_profiles")
    .select("member_id")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();
  return data?.member_id ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const id = await mentorIdFor((await params).handle);
  return id ? mentorBookingMeta(id) : { title: "Book a session" };
}

/**
 * A mentor's short, shareable booking link: /mentorship/m/<handle> (and, on the
 * mentorship subdomain, /m/<handle>, which the config rewrites here). Resolves
 * the handle to the mentor's id and renders the same public booking page as
 * /mentorship/book/<id>.
 */
export default async function HandleBookingPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const mentorId = await mentorIdFor(handle);
  if (!mentorId) notFound();
  return <BookingView mentorId={mentorId} />;
}
