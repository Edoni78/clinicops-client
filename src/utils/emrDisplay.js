export function fmtEmrDate(date, opts = {}) {
  if (!date) return "—";
  try {
    const { dateStyle = "medium", timeStyle = "short" } = opts;
    return new Date(date).toLocaleString("sq-AL", { dateStyle, timeStyle });
  } catch {
    return String(date);
  }
}

/** Date only as DD.MM.YYYY (e.g. 10.10.2000) */
export function fmtEmrDateOnly(date) {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return String(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return String(date);
  }
}

export function getGenderLabel(gender) {
  const g = String(gender || "").trim().toLowerCase();
  if (g === "male" || g === "mashkull") return "Mashkull";
  if (g === "female" || g === "femer" || g === "femër") return "Femër";
  return gender || "—";
}

export function looksLikeEmail(v) {
  return typeof v === "string" && v.includes("@");
}

export function resolveDoctorName(entry, fallbackDisplayName) {
  const raw =
    entry?.doctorDisplayName ??
    entry?.DoctorDisplayName ??
    entry?.doctorName ??
    entry?.DoctorName ??
    "";
  if (!raw) return fallbackDisplayName || "Mjek";
  if (looksLikeEmail(raw) && fallbackDisplayName) return fallbackDisplayName;
  return raw;
}

export function getPatientInitials(firstName, lastName) {
  const f = String(firstName || "").trim().charAt(0);
  const l = String(lastName || "").trim().charAt(0);
  const initials = `${f}${l}`.toUpperCase();
  return initials || "?";
}

export function getCaseStatusBadgeClass(status) {
  const s = String(status || "").trim().toLowerCase();
  if (
    s.includes("complete") ||
    s.includes("përfund") ||
    s.includes("perfund") ||
    s === "closed" ||
    s === "done"
  ) {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (s.includes("progress") || s.includes("proces") || s.includes("active") || s.includes("aktiv")) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  if (s.includes("cancel") || s.includes("anul")) {
    return "bg-red-50 text-red-800 border-red-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function normalizeVital(v) {
  if (!v) return null;
  return {
    weightKg: v.weightKg ?? v.WeightKg,
    systolicPressure: v.systolicPressure ?? v.SystolicPressure,
    diastolicPressure: v.diastolicPressure ?? v.DiastolicPressure,
    temperatureC: v.temperatureC ?? v.TemperatureC,
    heartRate: v.heartRate ?? v.HeartRate,
    recordedAt: v.recordedAt ?? v.RecordedAt,
  };
}
