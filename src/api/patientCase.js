import api from "./axios";

/**
 * @param {string} [status] - Waiting | InProgress | InConsultation | Completed | Finished
 * @returns {Promise<Array<{ id, patientId, patientFirstName, patientLastName, status, createdAt }>>}
 */
export async function getPatientCases(status) {
  const params = status ? { status } : {};
  const { data } = await api.get("/api/PatientCase", { params });
  return data || [];
}

/**
 * @param {string} id - case id
 * @returns {Promise<PatientCaseDetailDto>}
 */
export async function getPatientCase(id) {
  const { data } = await api.get(`/api/PatientCase/${id}`);
  return data;
}

/**
 * Nurse: submit vitals. Backend expects PascalCase (WeightKg, SystolicPressure, etc.).
 * @param {string} id - case id (GUID)
 * @param {{ weightKg?: number, systolicPressure?: number, diastolicPressure?: number, temperatureC?: number, heartRate?: number }} body
 */
export async function submitVitals(id, body) {
  const payload = {};
  if (body.weightKg != null) payload.WeightKg = body.weightKg;
  if (body.systolicPressure != null) payload.SystolicPressure = body.systolicPressure;
  if (body.diastolicPressure != null) payload.DiastolicPressure = body.diastolicPressure;
  if (body.temperatureC != null) payload.TemperatureC = body.temperatureC;
  if (body.heartRate != null) payload.HeartRate = body.heartRate;
  const { data } = await api.post(`/api/PatientCase/${id}/vitals`, payload);
  return data;
}

/**
 * Doctor: submit diagnosis and therapy. Backend expects PascalCase (Diagnosis, Therapy).
 * @param {string} id - case id (GUID)
 * @param {{ diagnosis: string, therapy: string }} body
 */
export async function submitReport(id, body) {
  const payload = {
    Diagnosis: body.diagnosis,
    Therapy: body.therapy,
  };
  const { data } = await api.post(`/api/PatientCase/${id}/report`, payload);
  return data;
}

/**
 * Update case status
 * @param {string} id - case id
 * @param {string} status - InConsultation | InProgress | Completed | Finished | Waiting
 */
export async function updateCaseStatus(id, status) {
  await api.patch(`/api/PatientCase/${id}/status`, null, {
    params: { status },
  });
}
