import { supabase } from "../lib/supabaseClient";
import { apiError, throwIfError } from "../lib/apiError";
import { requireProfile } from "../lib/sessionUser";
import { assertImageFile, fetchAsDataUrl, fileExtension, publicObjectUrl } from "./storageService";

function mapDoctor(profile, assets) {
  return {
    userId: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    signatureUrl: publicObjectUrl("doctor-assets", assets?.signature_path),
    stampUrl: publicObjectUrl("doctor-assets", assets?.stamp_path),
  };
}

async function requireDoctor() {
  const profile = await requireProfile();
  if (profile.role !== "Doctor") {
    throw apiError("Vetëm mjeku mund të hapë këtë profil.", 403);
  }
  return profile;
}

export async function getDoctorProfile() {
  const profile = await requireDoctor();
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select("user_id, signature_path, stamp_path")
    .eq("user_id", profile.id)
    .maybeSingle();
  throwIfError(error, "Dështoi ngarkimi i profilit të mjekut.");
  return mapDoctor(profile, data);
}

export async function updateDoctorProfile(body) {
  const profile = await requireDoctor();
  const displayName = body.displayName != null ? String(body.displayName).trim() : null;
  if (displayName != null) {
    if (displayName.length > 200) throw apiError("Emri nuk mund të kalojë 200 karaktere.");
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", profile.id);
    throwIfError(error, "Përditësimi i profilit dështoi.");
    profile.display_name = displayName;
  }
  const { data } = await supabase
    .from("doctor_profiles")
    .select("user_id, signature_path, stamp_path")
    .eq("user_id", profile.id)
    .maybeSingle();
  return mapDoctor(profile, data);
}

async function uploadDoctorImage(file, kind) {
  assertImageFile(file);
  const profile = await requireDoctor();
  const path = `${profile.id}/${kind}.${fileExtension(file)}`;
  const { error: uploadError } = await supabase.storage.from("doctor-assets").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/png",
    cacheControl: "3600",
  });
  throwIfError(uploadError, "Ngarkimi i imazhit dështoi.");
  const column = kind === "stamp" ? "stamp_path" : "signature_path";
  const { error } = await supabase.from("doctor_profiles").upsert(
    { user_id: profile.id, [column]: path, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  throwIfError(error, "Ngarkimi i imazhit dështoi.");
  return getDoctorProfile();
}

export function uploadDoctorSignature(file) {
  return uploadDoctorImage(file, "signature");
}

export function uploadDoctorStamp(file) {
  return uploadDoctorImage(file, "stamp");
}

export function getDoctorImageFullUrl(url) {
  return publicObjectUrl("doctor-assets", url);
}

export function getDoctorImageAsBase64(imagePath) {
  return fetchAsDataUrl(imagePath, "doctor-assets");
}

const DOCTOR_IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "gif"];

/** Same public-file fetch the clinic logo uses. The upload path is {userId}/{kind}.{ext}. */
async function loadDoctorAsset(userId, kind, storedPath) {
  const candidates = [];
  if (storedPath) candidates.push(String(storedPath).replace(/^\/+/, ""));
  if (userId) {
    for (const ext of DOCTOR_IMAGE_EXTS) candidates.push(`${userId}/${kind}.${ext}`);
  }
  const seen = new Set();
  for (const path of candidates) {
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const publicUrl = publicObjectUrl("doctor-assets", path);
    const fromPublicUrl = publicUrl ? await fetchAsDataUrl(publicUrl, "doctor-assets") : null;
    if (fromPublicUrl) return fromPublicUrl;
    const fromStorage = await fetchAsDataUrl(path, "doctor-assets");
    if (fromStorage) return fromStorage;
  }
  return null;
}

/** Signature and stamp for the doctor assigned to a case. */
export async function getDoctorSignoff(userId) {
  if (!userId) return null;
  let signaturePath = null;
  let stampPath = null;
  const { data } = await supabase
    .from("doctor_profiles")
    .select("signature_path, stamp_path")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) {
    signaturePath = data.signature_path;
    stampPath = data.stamp_path;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  const [signatureBase64, stampBase64] = await Promise.all([
    loadDoctorAsset(userId, "signature", signaturePath),
    loadDoctorAsset(userId, "stamp", stampPath),
  ]);

  return {
    name: profile?.display_name || "",
    signatureBase64,
    stampBase64,
  };
}
