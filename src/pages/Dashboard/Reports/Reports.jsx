import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiFileText,
  FiClock,
  FiDownload,
  FiPrinter,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";
import {
  getPatientCases,
  enrichPatientCasesWithService,
  deletePatientCaseReport,
} from "../../../api/patientCase";
import { getDoctorProfile } from "../../../api/doctorProfile";
import { useAuth } from "../../../context/AuthContext";
import { pickCaseServiceFields, formatCaseServicePriceEUR } from "../../../utils/caseServiceFields";
import {
  downloadCaseReportPdfFromBackend,
  printCaseReportPdfFromBackend,
} from "../../../utils/caseReportPdf";
import Notification from "../../../components/ui/Notification";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import ListFiltersBar from "../../../components/ui/ListFiltersBar";
import {
  isSameDay,
  isYesterday,
  isInThisWeek,
  isSameCalendarDay,
  normalizeStatusKey,
  caseMatchesNameQuery,
} from "../../../utils/caseListFilters";
import { isClinicAdminRole } from "../../../utils/dashboardMenu";

const DATE_FILTERS = [
  { value: "today", label: "Sot" },
  { value: "yesterday", label: "Dje" },
  { value: "week", label: "Këtë javë" },
  { value: "all", label: "Të gjitha" },
];

const STATUS_TABS = [
  { value: "all", label: "Të gjitha" },
  { value: "Finished", label: "Përfunduar" },
];

const STATUS_LABELS = {
  Waiting: "Në pritje",
  InProgress: "Në progres",
  InConsultation: "Në konsultim",
  Completed: "Përfunduar",
  Finished: "Përfunduar",
};

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "—";
}

function statusBadgeClass(status) {
  const map = {
    Waiting: "bg-amber-100 text-amber-800",
    InProgress: "bg-blue-100 text-blue-800",
    InConsultation: "bg-sky-100 text-sky-800",
    Completed: "bg-indigo-100 text-indigo-800",
    Finished: "bg-emerald-100 text-emerald-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
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

function looksLikeEmail(v) {
  return typeof v === "string" && v.includes("@");
}

function resolveDoctorNameFromCase(c, fallbackDisplayName) {
  const raw =
    c?.doctorDisplayName ??
    c?.DoctorDisplayName ??
    c?.doctorName ??
    c?.DoctorName ??
    c?.doctorEmail ??
    c?.DoctorEmail ??
    "";
  if (!raw) return fallbackDisplayName || "Mjek";
  if (looksLikeEmail(raw) && fallbackDisplayName) return fallbackDisplayName;
  return raw;
}

export default function Reports() {
  const { role } = useAuth();
  const roleLower = String(role || "").toLowerCase();
  const canDeleteReports =
    isClinicAdminRole(roleLower) || roleLower === "doctor" || roleLower === "superadmin";
  const isDoctor = String(role || "").toLowerCase() === "doctor";
  const [doctorDisplayName, setDoctorDisplayName] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  /** all | Completed | Finished — completed-visit type */
  const [reportStatusTab, setReportStatusTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [nameSearch, setNameSearch] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [printingId, setPrintingId] = useState(null);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [deletedReportCaseIds, setDeletedReportCaseIds] = useState(() => {
    try {
      const raw = sessionStorage.getItem("deleted_report_case_ids");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });

  const handleDatePreset = (value) => {
    setDateFilter(value);
    setCustomDate("");
  };

  const handleCustomDate = (value) => {
    setCustomDate(value);
    if (value) setDateFilter("");
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      // Simplified flow: a completed visit is "Finished".
      const finished = await getPatientCases("Finished");
      const combined = [...(Array.isArray(finished) ? finished : [])];
      const byId = new Map();
      combined.forEach((c) => {
        const id = c.id ?? c.Id;
        if (id && !byId.has(id)) byId.set(id, c);
      });
      const merged = await enrichPatientCasesWithService(Array.from(byId.values()));
      setReports(merged);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    sessionStorage.setItem("deleted_report_case_ids", JSON.stringify(deletedReportCaseIds));
  }, [deletedReportCaseIds]);

  useEffect(() => {
    if (!isDoctor) return;
    getDoctorProfile()
      .then((p) => setDoctorDisplayName(p?.displayName ?? p?.DisplayName ?? ""))
      .catch(() => setDoctorDisplayName(""));
  }, [isDoctor]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const caseId = r.id ?? r.Id;
      if (deletedReportCaseIds.includes(caseId)) return false;
      const status = r.status ?? r.Status;
      const sk = normalizeStatusKey(status);
      if (reportStatusTab === "Completed" && sk !== "completed") return false;
      if (reportStatusTab === "Finished" && sk !== "finished") return false;
      if (!caseMatchesNameQuery(r, nameSearch)) return false;
      const updated = r.updatedAt ?? r.UpdatedAt ?? r.createdAt ?? r.CreatedAt;
      if (customDate) return isSameCalendarDay(updated, customDate);
      if (dateFilter === "today") return isSameDay(updated, new Date().toISOString());
      if (dateFilter === "yesterday") return isYesterday(updated);
      if (dateFilter === "week") return isInThisWeek(updated);
      return true;
    });
  }, [reports, deletedReportCaseIds, reportStatusTab, nameSearch, customDate, dateFilter]);

  const pdfErrorMessage = (e, fallback) =>
    e.response?.status === 404
      ? "Rasti nuk u gjet ose nuk është në klinikën tuaj."
      : e.response?.data?.message ||
        e.response?.data ||
        e.message ||
        fallback;

  const handleDownloadPdf = async (caseId) => {
    setDownloadingId(caseId);
    try {
      await downloadCaseReportPdfFromBackend(caseId);
    } catch (e) {
      setNotif({ visible: true, type: "error", message: pdfErrorMessage(e, "Dështoi shkarkimi i raportit.") });
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintPdf = async (caseId) => {
    setPrintingId(caseId);
    try {
      await printCaseReportPdfFromBackend(caseId);
    } catch (e) {
      setNotif({ visible: true, type: "error", message: pdfErrorMessage(e, "Dështoi printimi i raportit.") });
    } finally {
      setPrintingId(null);
    }
  };

  const handleDeleteReport = async (caseId) => {
    const ok = window.confirm("Fshij raportin mjekësor (EMR) për këtë rast?");
    if (!ok) return;
    setDeletingReportId(caseId);
    try {
      await deletePatientCaseReport(caseId);
      setDeletedReportCaseIds((prev) => (prev.includes(caseId) ? prev : [...prev, caseId]));
      setNotif({ visible: true, type: "success", message: "Raporti u fshi." });
      fetchReports();
    } catch (err) {
      if (err?.response?.status === 404) {
        setDeletedReportCaseIds((prev) => (prev.includes(caseId) ? prev : [...prev, caseId]));
        setNotif({
          visible: true,
          type: "info",
          message: "Raporti nuk u gjet; u fshi nga lista.",
        });
        return;
      }
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? "Fshirja e raportit dështoi.",
      });
    } finally {
      setDeletingReportId(null);
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
        title="Raportet"
        subtitle="Vizitat e përfunduara. Printoni ose shkarkoni raportet mjekësore."
        icon={FiFileText}
        actions={
          <button type="button" onClick={fetchReports} disabled={loading} className="btn-secondary btn-md">
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            Rifresko
          </button>
        }
      />

      <div className="table-shell">
        <ListFiltersBar
          searchValue={nameSearch}
          onSearchChange={setNameSearch}
          searchPlaceholder="Kërko sipas emrit të pacientit…"
          statusTabs={STATUS_TABS}
          activeStatusTab={reportStatusTab}
          onStatusTabChange={setReportStatusTab}
          datePresets={DATE_FILTERS}
          activeDatePreset={dateFilter}
          onDatePresetChange={handleDatePreset}
          customDate={customDate}
          onCustomDateChange={handleCustomDate}
          resultCount={filteredReports.length}
          resultLabel="raport"
        />

        {loading ? (
          <LoadingSpinner className="py-16" label="Duke ngarkuar raportet…" />
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16">
            <FiFileText className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-600">
              {nameSearch.trim() && "Nuk u gjet asnjë raport për këtë kërkim."}
              {!nameSearch.trim() && customDate && "Nuk ka raporte të përfunduara për këtë datë."}
              {!nameSearch.trim() &&
                !customDate &&
                dateFilter === "today" &&
                "Nuk ka raporte të përfunduara sot."}
              {!nameSearch.trim() &&
                !customDate &&
                dateFilter === "yesterday" &&
                "Nuk ka raporte të përfunduara dje."}
              {!nameSearch.trim() &&
                !customDate &&
                dateFilter === "week" &&
                "Nuk ka raporte këtë javë."}
              {!nameSearch.trim() &&
                !customDate &&
                dateFilter === "all" &&
                (reportStatusTab === "all"
                  ? "Ende nuk ka vizita të përfunduara."
                  : "Nuk ka raporte për këtë status.")}
            </p>
            <Link
              to="/dashboard/cases"
              className="inline-block mt-4 text-clinic-400 font-medium hover:underline"
            >
              Shko te Rastet
            </Link>
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
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Mjeku
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Shërbimi
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Çmimi
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Veprime
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => {
                  const caseId = r.id ?? r.Id;
                  const firstName = r.patientFirstName ?? r.PatientFirstName ?? "";
                  const lastName = r.patientLastName ?? r.PatientLastName ?? "";
                  const status = r.status ?? r.Status;
                  const updated =
                    r.updatedAt ??
                    r.UpdatedAt ??
                    r.completedAt ??
                    r.CompletedAt ??
                    r.createdAt ??
                    r.CreatedAt;
                  const doctorName = resolveDoctorNameFromCase(r, doctorDisplayName);
                  const { serviceName, servicePrice } = pickCaseServiceFields(r);
                  const servicePriceLabel = formatCaseServicePriceEUR(servicePrice);
                  const serviceDisplay = serviceName || "—";
                  return (
                    <tr key={caseId} className="border-b border-slate-100/90 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/dashboard/cases/${caseId}`}
                          className="font-medium text-slate-900 hover:text-clinic-400"
                        >
                          {firstName} {lastName}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <FiClock size={13} className="flex-shrink-0 text-slate-400" />
                          {formatDate(updated)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border border-current/10 ${statusBadgeClass(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 whitespace-nowrap">
                        {doctorName || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 max-w-[200px] sm:max-w-xs">
                        <span className="line-clamp-2" title={serviceDisplay !== "—" ? serviceDisplay : undefined}>
                          {serviceDisplay}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 whitespace-nowrap tabular-nums">
                        {servicePriceLabel ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handlePrintPdf(caseId)}
                            disabled={printingId === caseId || downloadingId === caseId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-clinic-400 bg-clinic-400/10 rounded-lg hover:bg-clinic-400/20 transition-colors border border-clinic-400/20 disabled:opacity-50"
                          >
                            {printingId === caseId ? (
                              <span className="animate-pulse px-1">…</span>
                            ) : (
                              <>
                                <FiPrinter size={16} />
                                Printo
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(caseId)}
                            disabled={downloadingId === caseId || printingId === caseId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
                          >
                            {downloadingId === caseId ? (
                              <span className="animate-pulse px-1">…</span>
                            ) : (
                              <>
                                <FiDownload size={16} />
                                PDF
                              </>
                            )}
                          </button>
                          {canDeleteReports && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(caseId)}
                              disabled={deletingReportId === caseId}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-60"
                            >
                              <FiTrash2 size={16} />
                              {deletingReportId === caseId ? "Duke fshirë..." : "Fshij raportin"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
