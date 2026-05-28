import api from "./axios";
import { pickCaseServiceFields } from "../utils/caseServiceFields";

/**
 * @param {string} [status] - Waiting | InProgress | InConsultation | Completed | Finished
 * @returns {Promise<Array<{ id, patientId, patientFirstName, patientLastName, status, createdAt, serviceId?, serviceName?, servicePrice? }>>}
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
 * List API may omit service name/price; load from case detail when the list row has no service label.
 * @param {Array<object>} cases
 */
export async function enrichPatientCasesWithService(cases) {
  const list = Array.isArray(cases) ? [...cases] : [];
  const needsDetail = list.filter((c) => !pickCaseServiceFields(c).serviceName);
  if (needsDetail.length === 0) return list;

  const pairs = await Promise.all(
    needsDetail.map(async (c) => {
      const id = c.id ?? c.Id;
      try {
        const detail = await getPatientCase(id);
        return [id, detail];
      } catch {
        return [id, null];
      }
    })
  );

  const detailById = new Map(pairs);
  return list.map((c) => {
    const id = c.id ?? c.Id;
    const detail = detailById.get(id);
    if (!detail) return c;
    const fromList = pickCaseServiceFields(c);
    const fromDetail = pickCaseServiceFields(detail);
    if (fromList.serviceName) return c;
    if (!fromDetail.serviceName && fromDetail.servicePrice == null) return c;
    return {
      ...c,
      serviceId: fromList.serviceId ?? fromDetail.serviceId,
      serviceName: fromDetail.serviceName,
      servicePrice: fromList.servicePrice ?? fromDetail.servicePrice,
      ServiceId: fromList.serviceId ?? fromDetail.serviceId,
      ServiceName: fromDetail.serviceName,
      ServicePrice: fromList.servicePrice ?? fromDetail.servicePrice,
    };
  });
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
 * Doctor: submit anamneza, diagnosis and therapy. Backend expects PascalCase (Anamneza, Diagnosis, Therapy).
 * @param {string} id - case id (GUID)
 * @param {{ anamneza?: string, diagnosis: string, therapy: string }} body
 */
export async function submitReport(id, body) {
  const payload = {
    Anamneza: body.anamneza ?? "",
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

/**
 * Hard-delete patient case (+ cascade children on backend).
 * DELETE /api/PatientCase/{id}
 * Query: clinicId (for SuperAdmin)
 */
export async function deletePatientCase(id, clinicId) {
  const config = clinicId ? { params: { clinicId } } : {};
  await api.delete(`/api/PatientCase/${id}`, config);
}

/**
 * Delete medical report from case.
 * DELETE /api/PatientCase/{id}/report
 */
export async function deletePatientCaseReport(id) {
  await api.delete(`/api/PatientCase/${id}/report`);
}

/**
 * Attach a clinic service to a patient case.
 * Tries common backend shapes to stay compatible across API versions.
 * @param {string} id - case id
 * @param {string} serviceId - service id
 */
export async function attachServiceToCase(id, serviceId) {
  const attempts = [
    () => api.patch(`/api/PatientCase/${id}/service`, null, { params: { serviceId } }),
    () => api.patch(`/api/PatientCase/${id}/service`, { serviceId }),
    () => api.patch(`/api/PatientCase/${id}/service`, { ServiceId: serviceId }),
    () => api.post(`/api/PatientCase/${id}/service`, { serviceId }),
    () => api.post(`/api/PatientCase/${id}/service`, { ServiceId: serviceId }),
  ];

  let lastError;
  for (const call of attempts) {
    try {
      const { data } = await call();
      return data;
    } catch (err) {
      const status = err?.response?.status;
      // 400/404/405 likely indicate endpoint shape mismatch; try next.
      if (status === 400 || status === 404 || status === 405) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("Dështoi lidhja e shërbimit me rastin.");
}

/**
 * Get case report as PDF from backend.
 * GET /api/PatientCase/{id}/pdf
 * Auth: Bearer token (via axios interceptor).
 * @param {string} id - case id (GUID)
 * @returns {Promise<{ blob: Blob, filename: string }>}
 * @throws 404 if case not found or not in your clinic
 */
export async function getCaseReportPdf(id) {
  const { data, headers } = await api.get(`/api/PatientCase/${id}/pdf`, {
    responseType: "blob",
  });
  let filename = `CaseReport_${id}.pdf`;
  const disposition = headers["content-disposition"];
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i);
    if (match) filename = match[1].trim().replace(/^"/, "").replace(/"$/, "");
  }
  return { blob: data, filename };
}

/**
 * List lab results for a case.
 * GET /api/PatientCase/{id}/labresults
 * @param {string} caseId - patient case GUID
 * @returns {Promise<Array<{ id, patientCaseId, fileName, downloadUrl, contentType, uploadedAt, uploadedById }>>}
 */
export async function getLabResults(caseId) {
  const { data } = await api.get(`/api/PatientCase/${caseId}/labresults`);
  return Array.isArray(data) ? data : [];
}

/**
 * Upload a lab result PDF for a case.
 * POST /api/PatientCase/{id}/labresults (multipart/form-data, field "file")
 * @param {string} caseId - patient case GUID
 * @param {File} file - PDF file
 * @returns {Promise<LabResultDto>}
 */
export async function uploadLabResult(caseId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/api/PatientCase/${caseId}/labresults`, formData);
  return data;
}

/**
 * Download a single lab result PDF. Uses downloadUrl from list (relative path).
 * GET {baseUrl}{downloadUrl} with auth.
 * @param {string} downloadUrl - e.g. /api/PatientCase/{caseId}/labresults/{labId}/file
 * @param {string} [filename] - suggested filename for save
 */
export async function downloadLabResultFile(downloadUrl, filename) {
  if (!downloadUrl) return;
  const path = downloadUrl.startsWith("/") ? downloadUrl : "/" + downloadUrl;
  const { data, headers } = await api.get(path, { responseType: "blob" });
  let name = filename || "lab-result.pdf";
  const disposition = headers["content-disposition"];
  if (disposition) {
    const m = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i);
    if (m) name = m[1].trim().replace(/^"/, "").replace(/"$/, "");
  }
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
