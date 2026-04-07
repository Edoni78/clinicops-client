import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiFolder, FiRefreshCw, FiClock, FiCalendar, FiX, FiSearch } from "react-icons/fi";
import { getPatientCases } from "../../../api/patientCase";
import { useSignalR } from "../../../context/SignalRContext";
import Notification from "../../../components/ui/Notification";
import {
  isSameDay,
  isYesterday,
  isSameCalendarDay,
  pad2,
  toYmdFromParts,
  isTerminalCaseStatus,
  caseMatchesNameQuery,
} from "../../../utils/caseListFilters";

const STATUS_LABELS = {
  Waiting: "Në pritje",
  InProgress: "Në progres",
  InConsultation: "Në konsultim",
  Completed: "Përfunduar",
  Finished: "Mbyllur",
};

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

const selectDateClassName =
  "px-2.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[#81a2c5]/40 focus:border-[#81a2c5] outline-none min-w-[4.5rem]";

const CASE_TABS = [
  { value: "active", label: "Në vazhdim" },
  { value: "completed", label: "Përfunduar" },
];

function statusBadgeClass(status) {
  const map = {
    Waiting: "bg-amber-100 text-amber-800",
    InProgress: "bg-blue-100 text-blue-800",
    InConsultation: "bg-sky-100 text-sky-800",
    Completed: "bg-indigo-100 text-indigo-800",
    Finished: "bg-slate-100 text-slate-700",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });
  /** Në vazhdim | përfunduar / mbyllur */
  const [casesTab, setCasesTab] = useState("active");
  /** Preset date filter when no custom D/M/Y is set */
  const [casesQuickDate, setCasesQuickDate] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [dateParts, setDateParts] = useState({ day: "", month: "", year: "" });
  const searchDateYmd = useMemo(
    () => toYmdFromParts(dateParts.day, dateParts.month, dateParts.year),
    [dateParts.day, dateParts.month, dateParts.year]
  );
  const { connection, connectionState, onVitalsUpdated, onReportUpdated, onCaseStatusChanged } = useSignalR();

  const clearDateSearch = () => setDateParts({ day: "", month: "", year: "" });

  const setDatePart = (key, raw) => {
    setCasesQuickDate("");
    setDateParts((prev) => {
      const next = { ...prev, [key]: raw };
      if ((key === "month" || key === "year") && next.day && next.month) {
        const mi = parseInt(next.month, 10);
        if (mi >= 1 && mi <= 12) {
          const yi = next.year ? parseInt(next.year, 10) : 2004;
          const maxD = new Date(yi, mi, 0).getDate();
          const d0 = parseInt(next.day, 10);
          if (d0 > maxD) next.day = String(maxD);
        }
      }
      return next;
    });
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 14 }, (_, i) => currentYear + 1 - i),
    [currentYear]
  );
  const maxDayInMonth = (() => {
    if (!dateParts.month) return 31;
    const mi = parseInt(dateParts.month, 10);
    if (mi < 1 || mi > 12) return 31;
    const yi = dateParts.year ? parseInt(dateParts.year, 10) : 2004;
    return new Date(yi, mi, 0).getDate();
  })();
  const dayOptions = useMemo(() => Array.from({ length: maxDayInMonth }, (_, i) => i + 1), [maxDayInMonth]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const status = c.status ?? c.Status;
      const terminal = isTerminalCaseStatus(status);
      if (casesTab === "active" && terminal) return false;
      if (casesTab === "completed" && !terminal) return false;
      if (!caseMatchesNameQuery(c, nameSearch)) return false;
      const created = c.createdAt ?? c.CreatedAt;
      if (searchDateYmd) return isSameCalendarDay(created, searchDateYmd);
      if (casesQuickDate === "today") return isSameDay(created, new Date().toISOString());
      if (casesQuickDate === "yesterday") return isYesterday(created);
      return true;
    });
  }, [cases, casesTab, nameSearch, searchDateYmd, casesQuickDate]);

  const fetchCases = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const list = await getPatientCases();
      setCases(Array.isArray(list) ? list : []);
    } catch {
      setCases([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Auto-update list via SignalR and show notification when status changes (e.g. nurse sends case to doctor)
  useEffect(() => {
    if (!connection) return;
    const unsubV = onVitalsUpdated(() => fetchCases(true));
    const unsubR = onReportUpdated(() => fetchCases(true));
    const unsubS = onCaseStatusChanged((patientCaseId, newStatus) => {
      fetchCases(true);
      const statusStr = String(newStatus || "").toLowerCase();
      if (statusStr === "inconsultation") {
        setNotif({ visible: true, type: "success", message: "Një rast u bë gati për konsultim. Lista u përditësua." });
      } else {
        setNotif({ visible: true, type: "info", message: "Statusi i rastit u përditësua. Lista u rifreskua." });
      }
    });
    return () => {
      unsubV();
      unsubR();
      unsubS();
    };
  }, [connection, fetchCases, onVitalsUpdated, onReportUpdated, onCaseStatusChanged]);

  return (
    <div className="max-w-6xl mx-auto">
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-slate-900 text-white shadow-lg">
              <FiFolder size={28} />
            </span>
            Rastet e pacientëve
          </h1>
          <p className="text-slate-600 mt-2 text-sm max-w-xl">
            Të gjitha rastet. Ndryshimet e statusit (në pritje → në progres → në konsultim → përfunduar → mbyllur) përditësohen në kohë reale.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {connectionState === "Connected" && (
            <span className="flex items-center gap-1.5 text-sm text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg font-medium">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              Direkt
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchCases()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all shadow-sm"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            Rifresko
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="animate-spin h-10 w-10 text-[#81a2c5] mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-500 text-sm">Duke ngarkuar…</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FiFolder className="text-slate-400" size={32} />
            </div>
            <p className="text-slate-600 font-medium">Nuk ka raste</p>
            <p className="text-slate-500 text-sm mt-1">Nuk ka raste të regjistruara.</p>
          </div>
        ) : (
          <>
            <div className="px-4 pt-4 pb-2 border-b border-slate-100 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-slate-600 self-center mr-1">Rasti:</span>
              {CASE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setCasesTab(tab.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    casesTab === tab.value
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3 gap-y-3">
              <span className="text-sm font-medium text-slate-600">Koha:</span>
              <button
                type="button"
                onClick={() => {
                  setCasesQuickDate("today");
                  clearDateSearch();
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !searchDateYmd && casesQuickDate === "today"
                    ? "bg-[#81a2c5] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Sot
              </button>
              <button
                type="button"
                onClick={() => {
                  setCasesQuickDate("yesterday");
                  clearDateSearch();
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !searchDateYmd && casesQuickDate === "yesterday"
                    ? "bg-[#81a2c5] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Dje
              </button>
              <button
                type="button"
                onClick={() => {
                  setCasesQuickDate("");
                  clearDateSearch();
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !searchDateYmd && casesQuickDate === ""
                    ? "bg-[#81a2c5] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Të gjitha datat
              </button>
              <span className="hidden sm:inline h-6 w-px bg-slate-200 mx-1 self-center" aria-hidden />
              <div className="flex flex-wrap items-center gap-2 min-w-[200px] flex-1 sm:flex-initial">
                <FiSearch className="text-slate-400 shrink-0" size={18} aria-hidden />
                <input
                  type="search"
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  placeholder="Kërko sipas emrit të pacientit…"
                  className="flex-1 min-w-[12rem] px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#81a2c5]/40 focus:border-[#81a2c5] outline-none"
                />
              </div>
              <span className="hidden sm:inline h-6 w-px bg-slate-200 mx-1 self-center" aria-hidden />
              <div lang="en-GB" className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-600 inline-flex items-center gap-1.5">
                  <FiCalendar size={16} className="text-[#81a2c5]" aria-hidden />
                  Sipas datës
                </span>
                <select
                  aria-label="Dita"
                  value={dateParts.day}
                  onChange={(e) => setDatePart("day", e.target.value)}
                  className={selectDateClassName}
                >
                  <option value="">Ditë</option>
                  {dayOptions.map((d) => (
                    <option key={d} value={String(d)}>
                      {pad2(d)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Muaji"
                  value={dateParts.month}
                  onChange={(e) => setDatePart("month", e.target.value)}
                  className={selectDateClassName}
                >
                  <option value="">Muaj</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={String(m)}>
                      {pad2(m)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Viti"
                  value={dateParts.year}
                  onChange={(e) => setDatePart("year", e.target.value)}
                  className={`${selectDateClassName} min-w-[5.5rem]`}
                >
                  <option value="">Viti</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
                {(dateParts.day || dateParts.month || dateParts.year) && (
                  <button
                    type="button"
                    onClick={clearDateSearch}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="Hiq filtrin e datës"
                  >
                    <FiX size={16} aria-hidden />
                    Hiq
                  </button>
                )}
              </div>
              <span className="text-sm text-slate-500 sm:ml-auto basis-full sm:basis-auto">
                {filteredCases.length} rast{filteredCases.length !== 1 ? "e" : ""}
              </span>
            </div>

            {filteredCases.length === 0 ? (
              <div className="text-center py-16 px-6">
                <FiFolder className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-600">
                  {nameSearch.trim()
                    ? "Nuk u gjet asnjë rast për këtë kërkim."
                    : searchDateYmd
                      ? "Nuk ka raste për këtë datë."
                      : casesQuickDate === "today"
                        ? "Nuk ka raste për sot."
                        : casesQuickDate === "yesterday"
                          ? "Nuk ka raste për dje."
                          : casesTab === "completed"
                            ? "Nuk ka raste të përfunduar ose të mbyllur që përputhen me filtrat."
                            : "Nuk ka raste në vazhdim që përputhen me filtrat."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Pacienti
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Data
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Statusi
                      </th>
                      <th className="w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((c) => {
                      const caseId = c.id ?? c.Id;
                      const firstName = c.patientFirstName ?? c.PatientFirstName ?? "";
                      const lastName = c.patientLastName ?? c.PatientLastName ?? "";
                      const status = c.status ?? c.Status;
                      const createdAt = c.createdAt ?? c.CreatedAt;
                      return (
                        <tr key={caseId} className="border-b border-slate-100/90 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <Link
                              to={`/dashboard/cases/${caseId}`}
                              className="font-medium text-slate-900 hover:text-[#81a2c5]"
                            >
                              {firstName} {lastName}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                              <FiClock size={13} className="flex-shrink-0" />
                              {formatDate(createdAt)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border border-current/10 ${statusBadgeClass(status)}`}
                            >
                              {getStatusLabel(status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/dashboard/cases/${caseId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#81a2c5] bg-[#81a2c5]/10 rounded-lg hover:bg-[#81a2c5]/20 transition-colors border border-[#81a2c5]/20"
                            >
                              Hap
                              <span aria-hidden>→</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
