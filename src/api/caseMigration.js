import api from "./axios";

const LONG_TIMEOUT_MS = 120000;

function apiErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  return fallback;
}

export async function uploadCaseMigration(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/api/PatientCaseMigration/upload", formData, {
    timeout: LONG_TIMEOUT_MS,
  });
  return data;
}

export async function previewCaseMigration(migrationId, mappings) {
  const { data } = await api.post(
    `/api/PatientCaseMigration/${migrationId}/preview`,
    { mappings },
    { timeout: LONG_TIMEOUT_MS }
  );
  return data;
}

export async function listCaseMigrationRows(migrationId, { status, page = 1, pageSize = 25 } = {}) {
  const params = { page, pageSize };
  if (status && status !== "All") params.status = status;
  const { data } = await api.get(`/api/PatientCaseMigration/${migrationId}/rows`, { params });
  return data;
}

export async function confirmCaseMigration(migrationId) {
  const { data } = await api.post(
    `/api/PatientCaseMigration/${migrationId}/confirm`,
    {},
    { timeout: LONG_TIMEOUT_MS }
  );
  return data;
}

export { apiErrorMessage };
