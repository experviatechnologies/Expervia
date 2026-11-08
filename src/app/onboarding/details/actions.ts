"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin, RESUMES_BUCKET } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";
import {
  CV_CONTENT_TYPE,
  CV_MAX_BYTES,
  cvKind,
  normalizeLinkedIn,
  normalizePhone,
} from "@/lib/eten/member-details";

type Result = { ok: true } | { error: string; field?: string };

/**
 * Save the "Your details" step. Re-verifies the caller (a Server Function is
 * reachable by a direct POST), validates every field and the CV's real file
 * type, then writes with service_role: profiles (name, location, job title,
 * experience, CV path), member_contact (phone, LinkedIn, consent; private to
 * the member) and, when the member is in the presales tracker, its phone.
 */
export async function saveMemberDetails(form: FormData): Promise<Result> {
  const member = await getCurrentMember();
  if (!member)
    return { error: "Your session has expired. Please sign in again." };
  if (member.status !== "active")
    return {
      error: "Your account isn't active. Please contact the ETEN team.",
    };

  const text = (k: string, max: number) =>
    String(form.get(k) ?? "")
      .trim()
      .slice(0, max);
  const fullName = text("fullName", 120);
  const location = text("location", 120);
  const jobTitle = text("jobTitle", 120);
  const yearsRaw = text("yearsExperience", 3);
  const phone = normalizePhone(text("phone", 40));
  const linkedin = normalizeLinkedIn(text("linkedin", 300));
  const consent = form.get("consent") === "on";
  const cv = form.get("cv");

  if (fullName.length < 2)
    return { error: "Enter your full name.", field: "fullName" };
  if (!phone)
    return {
      error: "Enter a valid phone number, for example +234 803 123 4567.",
      field: "phone",
    };
  if (location.length < 2)
    return { error: "Enter your city and country.", field: "location" };
  if (jobTitle.length < 2)
    return { error: "Enter your job title.", field: "jobTitle" };
  const years = Number(yearsRaw);
  if (yearsRaw === "" || !Number.isInteger(years) || years < 0 || years > 60)
    return {
      error: "Enter your years of experience as a number from 0 to 60.",
      field: "yearsExperience",
    };
  if (linkedin === null)
    return {
      error: "That doesn't look like a LinkedIn profile link.",
      field: "linkedin",
    };
  if (!consent)
    return {
      error: "Please confirm you agree to share these details.",
      field: "consent",
    };

  const admin = getSupabaseAdmin();
  const { data: current } = await admin
    .from("profiles")
    .select("resume_path")
    .eq("member_id", member.id)
    .maybeSingle();
  const oldPath = (current?.resume_path as string | null) ?? null;

  // CV: required when none is on file; replacing one is optional.
  let newPath: string | null = null;
  const hasFile = cv instanceof File && cv.size > 0;
  if (!hasFile && !oldPath) return { error: "Upload your CV.", field: "cv" };
  if (hasFile) {
    if (cv.size > CV_MAX_BYTES)
      return { error: "Your CV must be 5 MB or smaller.", field: "cv" };
    const bytes = Buffer.from(await cv.arrayBuffer());
    const kind = cvKind(bytes);
    if (!kind)
      return {
        error: "Upload your CV as a PDF or Word document.",
        field: "cv",
      };
    newPath = `members/${member.id}/${crypto.randomUUID()}.${kind}`;
    const { error: upError } = await admin.storage
      .from(RESUMES_BUCKET)
      .upload(newPath, bytes, {
        contentType: CV_CONTENT_TYPE[kind],
        upsert: false,
      });
    if (upError)
      return {
        error: "Couldn't upload your CV. Please try again.",
        field: "cv",
      };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      location,
      job_title: jobTitle,
      years_experience: years,
      ...(newPath ? { resume_path: newPath } : {}),
    })
    .eq("member_id", member.id);
  if (profileError) {
    if (newPath) await admin.storage.from(RESUMES_BUCKET).remove([newPath]);
    return { error: "Couldn't save your details. Please try again." };
  }

  const { error: contactError } = await admin.from("member_contact").upsert(
    {
      member_id: member.id,
      phone,
      linkedin_url: linkedin || null,
      consent_at: new Date().toISOString(),
    },
    { onConflict: "member_id" },
  );
  if (contactError) {
    return {
      error:
        contactError.code === "42P01"
          ? "This step isn't switched on yet. Please contact the ETEN team."
          : "Couldn't save your phone number. Please try again.",
    };
  }

  // Presales tracker: keep its contact number in step (no row = not an engineer).
  await admin
    .from("presales_profiles")
    .update({ phone })
    .eq("member_id", member.id);

  // A replaced CV the member uploaded here is removed. Files from the original
  // community application are kept (that record still points at them).
  if (newPath && oldPath?.startsWith(`members/${member.id}/`)) {
    await admin.storage.from(RESUMES_BUCKET).remove([oldPath]);
  }

  await writeAudit({
    actorId: member.id,
    action: "member.details_updated",
    targetType: "member",
    targetId: member.id,
    metadata: {
      cv_replaced: Boolean(newPath && oldPath),
      cv_added: Boolean(newPath && !oldPath),
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
