import { supabase } from "../lib/supabaseClient";
import { throwIfError } from "../lib/apiError";
import { requireProfile, resolveClinicId } from "../lib/sessionUser";
import { assertImageFile, fetchAsDataUrl, fileExtension, publicObjectUrl } from "./storageService";

const CLINIC_COLUMNS =
  "id, name, address, phone, email, logo_path, description, clinic_mode, is_active, created_at, enable_weight, enable_blood_pressure, enable_temperature, enable_heart_rate, use_protocol_number, allow_nurse_protocol, allow_doctor_protocol, theme_id";

export function mapClinic(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    email: row.email,
    logoUrl: publicObjectUrl("clinic-assets", row.logo_path),
    description: row.description,
    clinicMode: row.clinic_mode,
    isActive: row.is_active,
    createdAt: row.created_at,
    vitalPreferences: {
      enableWeight: row.enable_weight,
      enableBloodPressure: row.enable_blood_pressure,
      enableTemperature: row.enable_temperature,
      enableHeartRate: row.enable_heart_rate,
    },
    protocolPreferences: {
      useProtocolNumber: row.use_protocol_number,
      allowNurseToSet: row.allow_nurse_protocol,
      allowDoctorToSet: row.allow_doctor_protocol,
    },
    colorThemePreferences: {
      themeId: row.theme_id || "default",
    },
  };
}

export async function getClinicProfile() {
  const clinicId = await resolveClinicId();
  const profile = await requireProfile();
  if (profile.role === "SuperAdmin" && !profile.clinic_id && clinicId) {
    // SuperAdmin reads the clinic they are operating on.
  }
  const { data, error } = await supabase.from("clinics").select(CLINIC_COLUMNS).eq("id", clinicId).maybeSingle();
  throwIfError(error, "Dështoi ngarkimi i profilit të klinikës.");
  if (!data) {
    const err = new Error("Profili i klinikës nuk u gjet.");
    err.response = { data: { message: err.message }, status: 404 };
    throw err;
  }
  return mapClinic(data);
}

export async function updateClinicProfile(body) {
  const clinicId = await resolveClinicId();
  const payload = {};
  if (body.name != null) payload.name = body.name;
  if (body.address != null) payload.address = body.address;
  if (body.phone != null) payload.phone = body.phone;
  if (body.logoUrl != null) payload.logo_path = body.logoUrl;
  if (body.description != null) payload.description = body.description;
  if (body.vitalPreferences != null) {
    const v = body.vitalPreferences;
    payload.enable_weight = !!(v.enableWeight ?? v.EnableWeight);
    payload.enable_blood_pressure = !!(v.enableBloodPressure ?? v.EnableBloodPressure);
    payload.enable_temperature = !!(v.enableTemperature ?? v.EnableTemperature);
    payload.enable_heart_rate = !!(v.enableHeartRate ?? v.EnableHeartRate);
  }
  if (body.protocolPreferences != null) {
    const p = body.protocolPreferences;
    payload.use_protocol_number = !!(p.useProtocolNumber ?? p.UseProtocolNumber);
    payload.allow_nurse_protocol = p.allowNurseToSet ?? p.AllowNurseToSet ?? true;
    payload.allow_doctor_protocol = p.allowDoctorToSet ?? p.AllowDoctorToSet ?? true;
  }
  if (body.colorThemePreferences != null) {
    const theme = body.colorThemePreferences.themeId ?? body.colorThemePreferences.ThemeId;
    if (theme != null) payload.theme_id = theme;
  }

  const { data, error } = await supabase
    .from("clinics")
    .update(payload)
    .eq("id", clinicId)
    .select(CLINIC_COLUMNS)
    .single();
  throwIfError(error, "Dështoi përditësimi i profilit të klinikës.");
  return mapClinic(data);
}

export async function uploadClinicLogo(file) {
  assertImageFile(file);
  const clinicId = await resolveClinicId();
  const path = `${clinicId}/logo.${fileExtension(file)}`;
  const { error: uploadError } = await supabase.storage.from("clinic-assets").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/png",
    cacheControl: "3600",
  });
  throwIfError(uploadError, "Ngarkimi i logos dështoi.");
  const { data, error } = await supabase
    .from("clinics")
    .update({ logo_path: path })
    .eq("id", clinicId)
    .select(CLINIC_COLUMNS)
    .single();
  throwIfError(error, "Ngarkimi i logos dështoi.");
  return mapClinic(data);
}

export function getLogoFullUrl(logoUrl) {
  return publicObjectUrl("clinic-assets", logoUrl);
}

export async function getLogoAsBase64(logoUrl) {
  return fetchAsDataUrl(logoUrl, "clinic-assets");
}
