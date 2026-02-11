import api from "./axios";

/**
 * List clinic applications (SuperAdmin) – GET /api/ClinicApplication
 * Query: status (optional) – Pending | Approved | Rejected
 */
export async function listApplications(status) {
  const params = status ? { status } : {};
  const { data } = await api.get("/api/ClinicApplication", { params });
  return data || [];
}

/**
 * Approve application – POST /api/ClinicApplication/{id}/approve
 * Backend expects id as integer. Creates clinic and ClinicAdmin; clinic can then log in (active).
 * Body (optional): { ReviewNote } – PascalCase for .NET
 */
export async function approveApplication(id, reviewNote) {
  const numericId = typeof id === "number" ? id : parseInt(id, 10);
  if (Number.isNaN(numericId)) throw new Error("Invalid application id");
  const body = reviewNote ? { ReviewNote: String(reviewNote).trim() } : {};
  const { data } = await api.post(`/api/ClinicApplication/${numericId}/approve`, body);
  return data;
}

/**
 * Reject application – POST /api/ClinicApplication/{id}/reject
 * Backend expects id as integer. Body (optional): { ReviewNote }
 */
export async function rejectApplication(id, reviewNote) {
  const numericId = typeof id === "number" ? id : parseInt(id, 10);
  if (Number.isNaN(numericId)) throw new Error("Invalid application id");
  const body = reviewNote ? { ReviewNote: String(reviewNote).trim() } : {};
  const { data } = await api.post(`/api/ClinicApplication/${numericId}/reject`, body);
  return data;
}
