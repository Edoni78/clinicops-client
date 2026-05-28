import api from "./axios";

/**
 * Soft-delete patient.
 * DELETE /api/Patient/{id}
 * Query: clinicId (for SuperAdmin)
 */
export async function deletePatient(id, clinicId) {
  const config = clinicId ? { params: { clinicId } } : {};
  await api.delete(`/api/Patient/${id}`, config);
}
