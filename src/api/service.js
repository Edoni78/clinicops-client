import api from "./axios";

/**
 * List active services for the clinic.
 * GET /api/Service
 * @param {string} [clinicId] - Required for SuperAdmin; omit for clinic users (JWT).
 * @returns {Promise<Array<{ id, clinicId, name, price, createdAt, isActive }>>}
 */
export async function listServices(clinicId) {
  const params = clinicId ? { clinicId } : {};
  const { data } = await api.get("/api/Service", { params });
  return Array.isArray(data) ? data : [];
}

/**
 * Get one service by id.
 * GET /api/Service/{id}
 * @param {string} id - Service GUID
 * @param {string} [clinicId] - For SuperAdmin
 */
export async function getService(id, clinicId) {
  const params = clinicId ? { clinicId } : {};
  const { data } = await api.get(`/api/Service/${id}`, { params });
  return data;
}

/**
 * Create a service.
 * POST /api/Service
 * Body: { name: string, price: number } (name max 300, price >= 0)
 * @param {{ name: string, price: number }} body
 * @param {string} [clinicId] - For SuperAdmin
 */
export async function createService(body, clinicId) {
  const config = clinicId ? { params: { clinicId } } : {};
  const { data } = await api.post("/api/Service", body, config);
  return data;
}

/**
 * Update a service.
 * PUT /api/Service/{id}
 * Body: { name?: string, price?: number } (only fields to change)
 * @param {string} id - Service GUID
 * @param {{ name?: string, price?: number }} body
 * @param {string} [clinicId] - For SuperAdmin
 */
export async function updateService(id, body, clinicId) {
  const config = clinicId ? { params: { clinicId } } : {};
  const { data } = await api.put(`/api/Service/${id}`, body, config);
  return data;
}

/**
 * Soft-delete a service. It will no longer appear in the list.
 * DELETE /api/Service/{id}
 * @param {string} id - Service GUID
 * @param {string} [clinicId] - For SuperAdmin
 */
export async function deleteService(id, clinicId) {
  const config = clinicId ? { params: { clinicId } } : {};
  await api.delete(`/api/Service/${id}`, config);
}
