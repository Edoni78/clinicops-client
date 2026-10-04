import { pickCaseServiceFields } from "../utils/caseServiceFields";
import { getPatientCase as loadPatientCase } from "../services/caseService";

export {
  getPatientCases,
  getPatientCase,
  submitVitals,
  submitReport,
  updateCaseProtocol,
  updateCaseStatus,
  deletePatientCase,
  deletePatientCaseReport,
  attachServiceToCase,
  getCaseReportPdf,
  getLabResults,
  uploadLabResult,
  downloadLabResultFile,
} from "../services/caseService";

/**
 * List rows may omit a service label. Load the case detail only when needed.
 */
export async function enrichPatientCasesWithService(cases) {
  const list = Array.isArray(cases) ? [...cases] : [];
  const needsDetail = list.filter((item) => !pickCaseServiceFields(item).serviceName);
  if (needsDetail.length === 0) return list;

  const pairs = await Promise.all(
    needsDetail.map(async (item) => {
      const id = item.id ?? item.Id;
      try {
        const detail = await loadPatientCase(id);
        return [id, detail];
      } catch {
        return [id, null];
      }
    })
  );

  const detailById = new Map(pairs);
  return list.map((item) => {
    const id = item.id ?? item.Id;
    const detail = detailById.get(id);
    if (!detail) return item;
    const fromList = pickCaseServiceFields(item);
    const fromDetail = pickCaseServiceFields(detail);
    if (fromList.serviceName) return item;
    if (!fromDetail.serviceName && fromDetail.servicePrice == null) return item;
    return {
      ...item,
      serviceId: fromList.serviceId ?? fromDetail.serviceId,
      serviceName: fromDetail.serviceName,
      servicePrice: fromList.servicePrice ?? fromDetail.servicePrice,
      ServiceId: fromList.serviceId ?? fromDetail.serviceId,
      ServiceName: fromDetail.serviceName,
      ServicePrice: fromList.servicePrice ?? fromDetail.servicePrice,
    };
  });
}
