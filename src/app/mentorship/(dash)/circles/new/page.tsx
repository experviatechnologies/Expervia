import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CreateCircleForm } from "./create-circle-form";

export const metadata = { title: "Create a Circle" };

export default async function NewCirclePage() {
  const me = await getCurrentMember();
  if (!me) redirect("/mentorship/signin");

  const admin = getSupabaseAdmin();
  const { data: mp } = await admin
    .from("mentor_profiles")
    .select("mentor_status, capability_area_id")
    .eq("member_id", me.id)
    .maybeSingle();

  const verified = Boolean(mp && mp.mentor_status === "verified");

  let areaLabel = "your capability area";
  if (verified && mp?.capability_area_id) {
    const { data: area } = await admin
      .from("capability_areas")
      .select("label")
      .eq("id", mp.capability_area_id)
      .maybeSingle();
    areaLabel = area?.label ?? areaLabel;
  }

  if (!verified) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-12">
        <h1 className="font-display text-mnt-ink text-2xl font-extrabold">
          Create a Circle
        </h1>
        <p className="text-mnt-ink-muted mt-2 text-[14px] leading-relaxed">
          Only verified mentors with a capability area can create Circles. Once
          the ETEN Readiness Panel verifies you, you&apos;ll be able to start a
          Circle here.
        </p>
      </div>
    );
  }

  return <CreateCircleForm areaLabel={areaLabel} />;
}
