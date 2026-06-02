import { isClinicAdminRole } from "./dashboardMenu";

export const DEFAULT_PROTOCOL_PREFERENCES = {
  useProtocolNumber: false,
  allowNurseToSet: true,
  allowDoctorToSet: true,
};

export function parseProtocolPreferences(source) {
  const p =
    source?.protocolPreferences ??
    source?.ProtocolPreferences ??
    source ??
    {};
  return {
    useProtocolNumber: !!(p.useProtocolNumber ?? p.UseProtocolNumber),
    allowNurseToSet: p.allowNurseToSet ?? p.AllowNurseToSet ?? true,
    allowDoctorToSet: p.allowDoctorToSet ?? p.AllowDoctorToSet ?? true,
  };
}

export function buildProtocolPreferencesPayload(prefs) {
  if (!prefs) return undefined;
  return {
    UseProtocolNumber: !!prefs.useProtocolNumber,
    AllowNurseToSet: !!prefs.allowNurseToSet,
    AllowDoctorToSet: !!prefs.allowDoctorToSet,
  };
}

export function isProtocolRequired(prefs) {
  return !!parseProtocolPreferences(prefs).useProtocolNumber;
}

export function getCaseProtocolNumber(caseData) {
  const v = caseData?.protocolNumber ?? caseData?.ProtocolNumber;
  return v != null ? String(v).trim() : "";
}

export function hasCaseProtocolNumber(caseData) {
  return getCaseProtocolNumber(caseData).length > 0;
}

export function canEditProtocolOnCase(prefs, role) {
  const p = parseProtocolPreferences(prefs);
  if (!p.useProtocolNumber) return false;
  const r = String(role || "").toLowerCase();
  if (isClinicAdminRole(r) || r === "superadmin") return true;
  if (r === "nurse" && p.allowNurseToSet) return true;
  if (r === "doctor" && p.allowDoctorToSet) return true;
  return false;
}

export function protocolMissingMessage() {
  return "Numri i protokollit është i detyrueshëm për të mbyllur rastin. Vendoseni para përfundimit.";
}
