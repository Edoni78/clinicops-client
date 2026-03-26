export const STATUS_FLOW = {
  Waiting: ["InProgress"],
  InProgress: ["InConsultation"],
  InConsultation: ["Completed"],
  Completed: ["Finished"],
  Finished: [],
};

/** Normalize status string to match STATUS_FLOW keys (backend may return enum string). */
export function normalizeCaseStatus(s) {
  const t = String(s ?? "").trim();
  const key = t.toLowerCase().replace(/\s+/g, "");
  const map = {
    waiting: "Waiting",
    inprogress: "InProgress",
    in_progress: "InProgress",
    inconsultation: "InConsultation",
    in_consultation: "InConsultation",
    completed: "Completed",
    finished: "Finished",
  };
  return map[key] ?? (STATUS_FLOW[t] ? t : "Waiting");
}
