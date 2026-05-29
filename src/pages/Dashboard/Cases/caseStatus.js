export const STATUS_LABELS = {
  Waiting: "Në pritje",
  InConsultation: "Në konsultim",
  Finished: "Përfunduar",
  // Legacy statuses kept only so older records still render a readable label.
  InProgress: "Në progres",
  Completed: "Përfunduar",
};

export function getCaseStatusLabel(status) {
  const key = normalizeCaseStatus(status);
  return STATUS_LABELS[key] || status || "—";
}

/**
 * Simplified 3-step flow: Waiting → InConsultation → Finished.
 * (InProgress / Completed are no longer used.)
 */
export const STATUS_FLOW = {
  Waiting: ["InConsultation"],
  InConsultation: ["Finished"],
  Finished: [],
};

/** Normalize status string to canonical casing (backend may return enum string). */
export function normalizeCaseStatus(s) {
  const t = String(s ?? "").trim();
  const key = t.toLowerCase().replace(/\s+/g, "");
  const map = {
    waiting: "Waiting",
    inconsultation: "InConsultation",
    in_consultation: "InConsultation",
    finished: "Finished",
    // Legacy mappings for backward compatibility with old records.
    inprogress: "InProgress",
    in_progress: "InProgress",
    completed: "Completed",
  };
  return map[key] ?? (STATUS_FLOW[t] ? t : "Waiting");
}

export const SINGLE_CONSULTATION_MESSAGE =
  "Mjeku ka tashmë një pacient në konsultim. Përfundoni vizitën aktuale para se të hapni një tjetër.";

/** Pick the active in-consultation case (newest first if multiple exist). */
export function findActiveInConsultationCase(cases) {
  const list = Array.isArray(cases) ? cases : [];
  const matches = list.filter(
    (c) => normalizeCaseStatus(c?.status ?? c?.Status) === "InConsultation"
  );
  if (matches.length === 0) return null;
  return matches.sort((a, b) => {
    const ta = new Date(a?.createdAt ?? a?.CreatedAt ?? 0).getTime();
    const tb = new Date(b?.createdAt ?? b?.CreatedAt ?? 0).getTime();
    return tb - ta;
  })[0];
}
