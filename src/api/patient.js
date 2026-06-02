import api from "./axios";
import { getJwtPayload } from "../utils/jwt";

function resolveClinicIdForRequest(explicitClinicId) {
  if (explicitClinicId) return explicitClinicId;
  const payload = getJwtPayload();
  return (
    payload?.clinicId ||
    payload?.ClinicId ||
    payload?.clinic_id ||
    payload?.Clinic_ID ||
    "11111111-1111-1111-1111-111111111111"
  );
}

/**
 * List patients for the clinic.
 * GET /api/Patient
 */
export async function listPatients(clinicId) {
  const config = clinicId ? { params: { clinicId } } : {};
  const { data } = await api.get("/api/Patient", config);
  return data;
}

/**
 * Register a new patient and open a waiting case.
 * POST /api/Patient/register
 */
export async function registerPatient(body) {
  const payload = {
    firstName: body.firstName,
    lastName: body.lastName,
    dateOfBirth: body.dateOfBirth,
    gender: body.gender,
    phone: body.phone,
    notes: body.notes || "",
    assignedDoctorUserId: body.assignedDoctorUserId,
    clinicId: resolveClinicIdForRequest(body.clinicId),
  };
  const { data } = await api.post("/api/Patient/register", payload);
  return data;
}

/**
 * Open a new waiting case for an existing patient.
 * POST /api/Patient/{id}/open-case
 */
export async function openPatientCase(patientId, body) {
  const payload = {
    assignedDoctorUserId: body.assignedDoctorUserId,
    notes: body.notes || "",
    clinicId: resolveClinicIdForRequest(body.clinicId),
  };
  const { data } = await api.post(`/api/Patient/${patientId}/open-case`, payload);
  return data;
}

/**
 * Soft-delete patient.
 * DELETE /api/Patient/{id}
 * Query: clinicId (for SuperAdmin)
 */
export async function deletePatient(id, clinicId) {
  const config = clinicId ? { params: { clinicId } } : {};
  await api.delete(`/api/Patient/${id}`, config);
}
