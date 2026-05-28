import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiFileText,
  FiClock,
  FiCalendar,
  FiDownload,
  FiPrinter,
  FiRefreshCw,
  FiX,
  FiSearch,
} from "react-icons/fi";
import { getPatientCases, enrichPatientCasesWithService } from "../../../api/patientCase";
import { pickCaseServiceFields, formatCaseServicePriceEUR } from "../../../utils/caseServiceFields";
import {
  downloadCaseReportPdfFromBackend,
  printCaseReportPdfFromBackend,
} from "../../../utils/caseReportPdf";
import Notification from "../../../components/ui/Notification";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import {
  isSameDay,
  isYesterday,
  isInThisWeek,
  isSameCalendarDay,
  pad2,
  toYmdFromParts,
  normalizeStatusKey,
  caseMatchesNameQuery,
} from "../../../utils/caseListFilters";

const DATE_FILTERS = [
  { value: "today", label: "Sot" },
  { value: "yesterday", label: "Dje" },
  { value: "week", label: "Këtë javë" },
  { value: "all", label: "Të gjitha" },
];

const STATUS_TABS = [
  { value: "all", label: "Të gjitha" },
  { value: "Completed", label: "Përfunduar" },
  { value: "Finished", label: "Mbyllur" },
];

const STATUS_LABELS = {
  Waiting: "Në pritje",
  InProgress: "Në progres",
  InConsultation: "Në konsultim",
  Completed: "Përfunduar",
  Finished: "Mbyllur",
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
    Finished: "bg-slate-100 text-slate-700",
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

const selectDateClassName =
  "px-2.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-clinic-400/40 focus:border-clinic-400 outline-none min-w-[4.5rem]";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  /** all | Completed | Finished — completed-visit type */
  const [reportStatusTab, setReportStatusTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [nameSearch, setNameSearch] = useState("");
  /** Day / month / year chosen in en-GB order (DD → MM → YYYY). */
  const [dateParts, setDateParts] = useState({ day: "", month: "", year: "" });
  const searchDate = useMemo(
    () => toYmdFromParts(dateParts.day, dateParts.month, dateParts.year),
    [dateParts.day, dateParts.month, dateParts.year]
  );
  const [downloadingId, setDownloadingId] = useState(null);
  const [printingId, setPrintingId] = useState(null);
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });

  const setDatePart = (key, raw) => {
    setDateParts((prev) => {
      const next = { ...prev, [key]: raw };
      if ((key === "month" || key === "year") && next.day && next.month) {
        const mi = parseInt(next.month, 10);
        if (mi >= 1 && mi <= 12) {
          const yi = next.year ? parseInt(next.year, 10) : 2004; // leap year until real year chosen
          const maxD = new Date(yi, mi, 0).getDate();
          const d0 = parseInt(next.day, 10);
          if (d0 > maxD) next.day = String(maxD);
        }
      }
      return next;
    });
  };

  const clearDateSearch = () => setDateParts({ day: "", month: "", year: "" });
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

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [finished, completed] = await Promise.all([
        getPatientCases("Finished"),
        getPatientCases("Completed"),
      ]);
      const combined = [
        ...(Array.isArray(finished) ? finished : []),
        ...(Array.isArray(completed) ? completed : []),
      ];
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

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const status = r.status ?? r.Status;
      const sk = normalizeStatusKey(status);
      if (reportStatusTab === "Completed" && sk !== "completed") return false;
      if (reportStatusTab === "Finished" && sk !== "finished") return false;
      if (!caseMatchesNameQuery(r, nameSearch)) return false;
      const updated = r.updatedAt ?? r.UpdatedAt ?? r.createdAt ?? r.CreatedAt;
      if (searchDate) return isSameCalendarDay(updated, searchDate);
      if (dateFilter === "today") return isSameDay(updated, new Date().toISOString());
      if (dateFilter === "yesterday") return isYesterday(updated);
      if (dateFilter === "week") return isInThisWeek(updated);
      return true;
    });
  }, [reports, reportStatusTab, nameSearch, searchDate, dateFilter]);

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
        <div className="px-4 pt-4 pb-2 border-b border-slate-100 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-slate-600 self-center mr-1">Raporti:</span>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setReportStatusTab(tab.value)}
              className={reportStatusTab === tab.value ? "tab-active" : "tab-inactive"}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3 gap-y-3">
          <span className="text-sm font-medium text-slate-600">Koha:</span>
          {DATE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setDateFilter(opt.value);
                clearDateSearch();
              }}
              className={!searchDate && dateFilter === opt.value ? "tab-active" : "tab-inactive"}
            >
              {opt.label}
            </button>
          ))}
          <span className="hidden sm:inline h-6 w-px bg-slate-200 mx-1 self-center" aria-hidden />
          <div className="flex flex-wrap items-center gap-2 min-w-[200px] flex-1 sm:flex-initial">
            <FiSearch className="text-slate-400 shrink-0" size={18} aria-hidden />
            <input
              type="search"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Kërko sipas emrit të pacientit…"
              className="flex-1 min-w-[12rem] px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-clinic-400/40 focus:border-clinic-400 outline-none"
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
            {filteredReports.length} raport{filteredReports.length !== 1 ? "e" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg
              className="animate-spin h-8 w-8 text-clinic-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16">
            <FiFileText className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-600">
              {nameSearch.trim() && "Nuk u gjet asnjë raport për këtë kërkim."}
              {!nameSearch.trim() && searchDate && "Nuk ka raporte të përfunduara për këtë datë."}
              {!nameSearch.trim() &&
                !searchDate &&
                dateFilter === "today" &&
                "Nuk ka raporte të përfunduara sot."}
              {!nameSearch.trim() &&
                !searchDate &&
                dateFilter === "yesterday" &&
                "Nuk ka raporte të përfunduara dje."}
              {!nameSearch.trim() &&
                !searchDate &&
                dateFilter === "week" &&
                "Nuk ka raporte këtë javë."}
              {!nameSearch.trim() &&
                !searchDate &&
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
