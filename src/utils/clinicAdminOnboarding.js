const STORAGE_PREFIX = "clinicops_clinic_admin_onboarding_v1";

export function getOnboardingStorageKey(userId, clinicId) {
  const uid = userId ? String(userId) : "unknown";
  const cid = clinicId ? String(clinicId) : "no-clinic";
  return `${STORAGE_PREFIX}_${uid}_${cid}`;
}

export function isClinicAdminOnboardingDone(userId, clinicId) {
  try {
    return localStorage.getItem(getOnboardingStorageKey(userId, clinicId)) === "done";
  } catch {
    return false;
  }
}

export function markClinicAdminOnboardingDone(userId, clinicId) {
  try {
    localStorage.setItem(getOnboardingStorageKey(userId, clinicId), "done");
  } catch {
    /* ignore */
  }
}
