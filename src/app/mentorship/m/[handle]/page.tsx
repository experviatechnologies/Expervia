import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { BookingView } from "@/app/mentorship/book/[mentorId]/page";

export const metadata = { title: "Book a session" };

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
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("mentor_profiles")
    .select("member_id")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();
  if (!data) notFound();
  return <BookingView mentorId={data.member_id} />;
}
