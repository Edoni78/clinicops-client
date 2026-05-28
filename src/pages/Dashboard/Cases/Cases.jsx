import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiFolder, FiRefreshCw, FiClock, FiCalendar, FiX, FiSearch, FiTrash2 } from "react-icons/fi";
import { getPatientCases, deletePatientCase } from "../../../api/patientCase";
import { useSignalR } from "../../../context/SignalRContext";
import { useAuth } from "../../../context/AuthContext";
import Notification from "../../../components/ui/Notification";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import EmptyState from "../../../components/ui/EmptyState";
import {
  isSameDay,
  isYesterday,
  isSameCalendarDay,
  pad2,
  toYmdFromParts,
  isTerminalCaseStatus,
  caseMatchesNameQuery,
} from "../../../utils/caseListFilters";
import { findActiveInConsultationCase } from "./caseStatus";
import { getClinicId } from "../../../utils/clinicId";
import { isClinicAdminRole } from "../../../utils/dashboardMenu";

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
  "px-2.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-clinic-400/35 focus:border-clinic-400 outline-none min-w-[4.5rem]";

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
  const navigate = useNavigate();
  const { role } = useAuth();
  const currentRole = String(role || "").toLowerCase();
  const isDoctor = currentRole === "doctor";
  const isNurse = currentRole === "nurse";
  const canDeleteCases =
    isClinicAdminRole(currentRole) || currentRole === "doctor" || currentRole === "superadmin";
  const [cases, setCases] = useState([]);
  const [deletingCaseId, setDeletingCaseId] = useState(null);
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

  const getCaseOpenPath = useCallback(
    (c) => {
      const caseId = c?.id ?? c?.Id;
      if (!caseId) return "/dashboard/cases";
      if (isDoctor) return `/dashboard/cases/${caseId}/doctor`;
      if (isNurse) return `/dashboard/cases/${caseId}/nurse`;
      const status = String(c?.status ?? c?.Status ?? "").trim().toLowerCase();
      if (["inconsultation", "completed", "finished"].includes(status)) {
        return `/dashboard/cases/${caseId}/doctor`;
      }
      return `/dashboard/cases/${caseId}/nurse`;
    },
    [isDoctor, isNurse]
  );

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

  // Doctor: open the active in-consultation case automatically (one visit at a time).
  useEffect(() => {
    if (!isDoctor || loading) return;
    const active = findActiveInConsultationCase(cases);
    const caseId = active?.id ?? active?.Id;
    if (!caseId) return;
    navigate(`/dashboard/cases/${caseId}/doctor`, { replace: true });
  }, [isDoctor, loading, cases, navigate]);

  // Fallback real-time sync for newly created cases.
  // Some backends don't emit a dedicated "case created" SignalR event,
  // so we silently refresh while this page is open.
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") fetchCases(true);
    };
    const intervalId = window.setInterval(refreshIfVisible, 8000);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
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

  const handleDeleteCase = async (c) => {
    const caseId = c?.id ?? c?.Id;
    if (!caseId) return;
    const name = `${c?.patientFirstName ?? c?.PatientFirstName ?? ""} ${c?.patientLastName ?? c?.PatientLastName ?? ""}`.trim();
    const ok = window.confirm(`Fshij rastin ${name ? `të ${name}` : ""}?`);
    if (!ok) return;
    setDeletingCaseId(caseId);
    try {
      await deletePatientCase(caseId, currentRole === "superadmin" ? getClinicId() : undefined);
      setNotif({ visible: true, type: "success", message: "Rasti u fshi." });
      fetchCases(true);
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? "Fshirja e rastit dështoi.",
      });
    } finally {
      setDeletingCaseId(null);
    }
  };

  return (
    <div className="page-shell max-w-6xl">
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <PageHeader
        title="Rastet e pacientëve"
        subtitle="Të gjitha rastet. Ndryshimet e statusit përditësohen në kohë reale."
        icon={FiFolder}
        actions={
          <>
            {connectionState === "Connected" && (
              <span className="flex items-center gap-1.5 text-sm text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                Direkt
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchCases()}
              disabled={loading}
              className="btn-secondary btn-md"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
              Rifresko
            </button>
          </>
        }
      />

      <div className="mb-5 card px-4 py-3 text-sm text-slate-600 flex flex-wrap gap-2 items-center">
        <span className="font-semibold text-slate-700">Rrjedha e punës:</span>
        <span className="px-2.5 py-1 rounded-full bg-slate-100">1) Infermieri: shenjat jetësore</span>
        <span className="px-2.5 py-1 rounded-full bg-slate-100">2) Dërgo te mjeku</span>
        <span className="px-2.5 py-1 rounded-full bg-slate-100">3) Mjeku: raport + përfundim</span>
      </div>

      <div className="table-shell">
        {loading ? (
          <LoadingSpinner className="py-20" label="Duke ngarkuar rastet…" />
        ) : cases.length === 0 ? (
          <EmptyState
            icon={FiFolder}
            title="Nuk ka raste"
            description="Nuk ka raste të regjistruara ende."
          />
        ) : (
          <>
            <div className="px-4 pt-4 pb-2 border-b border-slate-100 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-slate-600 self-center mr-1">Rasti:</span>
              {CASE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setCasesTab(tab.value)}
                  className={casesTab === tab.value ? "tab-active" : "tab-inactive"}
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
                className={!searchDateYmd && casesQuickDate === "today" ? "tab-active" : "tab-inactive"}
              >
                Sot
              </button>
              <button
                type="button"
                onClick={() => {
                  setCasesQuickDate("yesterday");
                  clearDateSearch();
                }}
                className={!searchDateYmd && casesQuickDate === "yesterday" ? "tab-active" : "tab-inactive"}
              >
                Dje
              </button>
              <button
                type="button"
                onClick={() => {
                  setCasesQuickDate("");
                  clearDateSearch();
                }}
                className={!searchDateYmd && casesQuickDate === "" ? "tab-active" : "tab-inactive"}
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
                  className="search-input flex-1"
                />
              </div>
              <span className="hidden sm:inline h-6 w-px bg-slate-200 mx-1 self-center" aria-hidden />
              <div lang="en-GB" className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-600 inline-flex items-center gap-1.5">
                  <FiCalendar size={16} className="text-clinic-400" aria-hidden />
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
                    <tr className="table-head-row">
                      <th className="table-th">
                        Pacienti
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Data
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Statusi
                      </th>
                      <th className="w-16" />
                      {canDeleteCases && <th className="w-20" />}
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
                        <tr key={caseId} className="table-row">
                          <td className="py-3 px-4">
                            <Link
                              to={getCaseOpenPath(c)}
                              className="font-medium text-slate-900 hover:text-clinic-400"
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
                              to={getCaseOpenPath(c)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-clinic-400 bg-clinic-400/10 rounded-lg hover:bg-clinic-400/20 transition-colors border border-clinic-400/20"
                            >
                              Hap
                              <span aria-hidden>→</span>
                            </Link>
                          </td>
                          {canDeleteCases && (
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteCase(c)}
                                disabled={deletingCaseId === caseId}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-60"
                              >
                                <FiTrash2 size={14} />
                                {deletingCaseId === caseId ? "..." : "Fshij"}
                              </button>
                            </td>
                          )}
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
