import api from "./axios";

const LONG_TIMEOUT_MS = 120000;

function apiErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  return fallback;
}

/**
 * Upload an Excel workbook and read detected headers.
 * POST /api/PatientMigration/upload
 */
export async function uploadPatientMigration(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/api/PatientMigration/upload", formData, {
    timeout: LONG_TIMEOUT_MS,
  });
  return data;
}

/**
 * Validate rows and return a preview summary. Does not insert patients.
 * POST /api/PatientMigration/{id}/preview
 */
export async function previewPatientMigration(migrationId, mappings) {
  const { data } = await api.post(
    `/api/PatientMigration/${migrationId}/preview`,
    { mappings },
    { timeout: LONG_TIMEOUT_MS }
  );
  return data;
}

/**
 * Page through preview rows.
 * GET /api/PatientMigration/{id}/rows
 */
export async function listPatientMigrationRows(migrationId, { status, page = 1, pageSize = 25 } = {}) {
  const params = { page, pageSize };
  if (status && status !== "All") params.status = status;
  const { data } = await api.get(`/api/PatientMigration/${migrationId}/rows`, { params });
  return data;
}

/**
 * Import previously validated rows for the current clinic.
 * POST /api/PatientMigration/{id}/confirm
 */
export async function confirmPatientMigration(migrationId) {
  const { data } = await api.post(
    `/api/PatientMigration/${migrationId}/confirm`,
    {},
    { timeout: LONG_TIMEOUT_MS }
  );
  return data;
}

/**
 * GET /api/PatientMigration/{id}
 */
export async function getPatientMigration(migrationId) {
  const { data } = await api.get(`/api/PatientMigration/${migrationId}`);
  return data;
}

export { apiErrorMessage };
