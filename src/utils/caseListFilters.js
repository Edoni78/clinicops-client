/** Shared filters for Cases / Reports lists (client-side). */

export function isSameDay(a, b) {
  if (!a || !b) return false;
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export function isYesterday(dateString) {
  if (!dateString) return false;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return isSameDay(dateString, y.toISOString());
}

export function isInThisWeek(dateString) {
  if (!dateString) return false;
  const d = new Date(dateString);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

/** Compare API timestamp to a calendar day (ymd = yyyy-MM-dd). */
export function isSameCalendarDay(value, ymd) {
  if (!value || !ymd) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const parts = ymd.split("-");
  if (parts.length !== 3) return false;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (!y || !m || !day) return false;
  return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === day;
}

export function pad2(n) {
  const i = typeof n === "number" ? n : parseInt(String(n), 10);
  return Number.isNaN(i) ? "" : String(i).padStart(2, "0");
}

/** Build yyyy-MM-dd from day / month / year (DD → MM → YYYY in UI). */
export function toYmdFromParts(day, month, year) {
  if (!day || !month || !year) return "";
  const di = parseInt(String(day), 10);
  const mi = parseInt(String(month), 10);
  const yi = parseInt(String(year), 10);
  if (!yi || mi < 1 || mi > 12 || di < 1) return "";
  const maxD = new Date(yi, mi, 0).getDate();
  if (di > maxD) return "";
  const dt = new Date(yi, mi - 1, di);
  if (dt.getFullYear() !== yi || dt.getMonth() !== mi - 1 || dt.getDate() !== di) return "";
  return `${yi}-${pad2(mi)}-${pad2(di)}`;
}

export function normalizeStatusKey(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/** Doctor finished or nurse closed (not active queue). */
export function isTerminalCaseStatus(s) {
  const n = normalizeStatusKey(s);
  return n === "completed" || n === "finished" || n === "mbyllur";
}

/** Awaiting nurse «Mbyll» in Reports after doctor finished. */
export function isAwaitingNurseCloseStatus(s) {
  return normalizeStatusKey(s) === "finished";
}

/** Fully closed by nurse. */
export function isClosedCaseStatus(s) {
  return normalizeStatusKey(s) === "mbyllur";
}

/** Match patient name search (handles first/last API shapes). */
export function caseMatchesNameQuery(c, rawQuery) {
  const q = String(rawQuery ?? "").trim().toLowerCase();
  if (!q) return true;
  const fn = String(c.patientFirstName ?? c.PatientFirstName ?? "").toLowerCase();
  const ln = String(c.patientLastName ?? c.PatientLastName ?? "").toLowerCase();
  const full = `${fn} ${ln}`.trim();
  return full.includes(q) || fn.includes(q) || ln.includes(q);
}
