import { getJwtPayload } from "./jwt";

const DEFAULT_CLINIC_ID = "11111111-1111-1111-1111-111111111111";

/**
 * Get clinic ID from JWT token. Falls back to default test clinic for SuperAdmin.
 */
export function getClinicId() {
  const payload = getJwtPayload();
  const id =
    payload?.clinicId ||
    payload?.ClinicId ||
    payload?.clinic_id ||
    payload?.Clinic_ID;
  return id || DEFAULT_CLINIC_ID;
}
