/**
 * Normalize service fields from PatientCase list/detail DTOs (camelCase or PascalCase).
 */
export function pickCaseServiceFields(caseRow) {
  if (!caseRow) {
    return { serviceId: null, serviceName: "", servicePrice: null };
  }
  const serviceId = caseRow.serviceId ?? caseRow.ServiceId ?? null;
  const serviceName = String(caseRow.serviceName ?? caseRow.ServiceName ?? "").trim();
  const rawPrice = caseRow.servicePrice ?? caseRow.ServicePrice;
  let servicePrice = null;
  if (rawPrice != null && rawPrice !== "") {
    const n = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
    if (!Number.isNaN(n)) servicePrice = n;
  }
  return { serviceId, serviceName, servicePrice };
}

export function formatCaseServicePriceEUR(rawPrice) {
  if (rawPrice == null || rawPrice === "") return null;
  const n = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
  if (Number.isNaN(n)) return null;
  return `${n.toFixed(2)} EUR`;
}
