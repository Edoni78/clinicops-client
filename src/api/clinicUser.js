import api from "./axios";

/**
 * List clinic users (ClinicAdmin / SuperAdmin) – GET /api/ClinicUser
 * Query: clinicId (SuperAdmin only), role (Doctor | Nurse | LabTechnician)
 */
export async function listClinicUsers(params = {}) {
  const { data } = await api.get("/api/ClinicUser", { params });
  return data || [];
}

/**
 * Create clinic user – POST /api/ClinicUser
 * Body: { email, password, role: "Doctor" | "Nurse" | "LabTechnician" }
 * Query (SuperAdmin only): clinicId
 */
export async function createClinicUser(body, clinicId) {
  const config = clinicId ? { params: { clinicId } } : {};
  const { data } = await api.post("/api/ClinicUser", body, config);
  return data;
}
