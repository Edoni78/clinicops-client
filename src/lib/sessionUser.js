import { supabase } from "./supabaseClient";
import { apiError, throwIfError } from "./apiError";

export const DEFAULT_CLINIC_ID = "11111111-1111-1111-1111-111111111111";

let cachedProfile = null;
let cachedAt = 0;

export function clearProfileCache() {
  cachedProfile = null;
  cachedAt = 0;
}

export function persistAccessToken(session) {
  if (!session?.access_token) return;
  localStorage.setItem("accessToken", session.access_token);
  if (session.expires_at) {
    localStorage.setItem(
      "token_expires",
      new Date(session.expires_at * 1000).toISOString()
    );
  }
}

export function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function mapProfileToUser(profile) {
  if (!profile) return null;
  const clinic = profile.clinics || null;
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    role: profile.role,
    clinicId: profile.clinic_id,
    clinicName: clinic?.name ?? null,
    clinicMode: clinic?.clinic_mode ?? "FullTeam",
    isActive: profile.is_active,
  };
}

export async function fetchCurrentProfile(force = false) {
  if (!force && cachedProfile && Date.now() - cachedAt < 15000) {
    return cachedProfile;
  }
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throwIfError(userError, "Sesioni ka skaduar. Hyni përsëri.");
  if (!userData?.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, clinic_id, is_active, clinics(id, name, clinic_mode)")
    .eq("id", userData.user.id)
    .maybeSingle();
  throwIfError(error, "Nuk u ngarkua profili i përdoruesit.");
  cachedProfile = data;
  cachedAt = Date.now();
  return data;
}

export async function requireProfile() {
  const profile = await fetchCurrentProfile();
  if (!profile?.id || !profile.is_active || !profile.role) {
    throw apiError("Sesioni ka skaduar ose llogaria nuk është aktive.", 401);
  }
  return profile;
}

/**
 * Clinic scope for queries. SuperAdmin may target a clinic explicitly
 * (the UI passes the demo clinic id). Other roles are locked to their clinic.
 */
export async function resolveClinicId(explicitClinicId) {
  const profile = await requireProfile();
  if (profile.role === "SuperAdmin") {
    return explicitClinicId || profile.clinic_id || DEFAULT_CLINIC_ID;
  }
  if (!profile.clinic_id) {
    throw apiError("Nuk jeni të lidhur me një klinikë.", 403);
  }
  return profile.clinic_id;
}

export function asOne(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function num(value) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? null : n;
}
