import api from "./axios";

export async function getAuditLogs(params = {}) {
  const { data } = await api.get("/api/audit-logs", { params });
  return data || {};
}
