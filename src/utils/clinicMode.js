import { getJwtPayload } from "./jwt";

export const CLINIC_MODE_SOLO_DOCTOR = "SoloDoctor";
export const CLINIC_MODE_FULL_TEAM = "FullTeam";

function normalizeClinicMode(value) {
  const v = String(value ?? "").trim().toLowerCase().replace(/[_\s-]/g, "");
  if (v === "solodoctor" || v === "solo") return CLINIC_MODE_SOLO_DOCTOR;
  return CLINIC_MODE_FULL_TEAM;
}

export function getClinicModeFromUser(user) {
  const fromUser =
    user?.clinicMode ??
    user?.ClinicMode ??
    user?.mode ??
    user?.Mode;
  if (fromUser != null && fromUser !== "") return normalizeClinicMode(fromUser);

  const payload = getJwtPayload();
  const fromJwt =
    payload?.clinicMode ??
    payload?.ClinicMode ??
    payload?.clinic_mode ??
    payload?.Clinic_Mode;
  return normalizeClinicMode(fromJwt);
}

