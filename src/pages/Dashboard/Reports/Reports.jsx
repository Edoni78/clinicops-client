import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiFileText,
  FiCalendar,
  FiUser,
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";
import { getPatientCases, getPatientCase } from "../../../api/patientCase";
import { downloadCaseReportPdf } from "../../../utils/caseReportPdf";

const DATE_FILTERS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "all", label: "All time" },
];

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dateString;
  }
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isInThisWeek(dateString) {
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

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("today");
  const [downloadingId, setDownloadingId] = useState(null);

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
      setReports(Array.from(byId.values()));
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = reports.filter((r) => {
    const updated = r.updatedAt ?? r.UpdatedAt ?? r.createdAt ?? r.CreatedAt;
    if (dateFilter === "today") return isSameDay(updated, new Date().toISOString());
    if (dateFilter === "week") return isInThisWeek(updated);
    return true;
  });

  const handleDownloadPdf = async (caseId) => {
    setDownloadingId(caseId);
    try {
      const data = await getPatientCase(caseId);
      downloadCaseReportPdf(data);
    } catch {
      // optional: toast error
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FiFileText className="text-[#81a2c5]" size={32} />
            Reports
          </h1>
          <p className="text-slate-600 mt-1">
            Ended visits. View or download medical reports.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Show:</span>
          {DATE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDateFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === opt.value
                  ? "bg-[#81a2c5] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <span className="text-sm text-slate-500 ml-auto">
            {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg
              className="animate-spin h-8 w-8 text-[#81a2c5]"
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
              {dateFilter === "today" && "No reports ended today."}
              {dateFilter === "week" && "No reports this week."}
              {dateFilter === "all" && "No ended visits yet."}
            </p>
            <Link
              to="/dashboard/cases"
              className="inline-block mt-4 text-[#81a2c5] font-medium hover:underline"
            >
              Go to Cases
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredReports.map((r) => {
              const caseId = r.id ?? r.Id;
              const firstName = r.patientFirstName ?? r.PatientFirstName ?? "";
              const lastName = r.patientLastName ?? r.PatientLastName ?? "";
              const status = r.status ?? r.Status;
              const updated = r.updatedAt ?? r.UpdatedAt ?? r.createdAt ?? r.CreatedAt;
              return (
                <li
                  key={caseId}
                  className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#81a2c5]/10 flex items-center justify-center flex-shrink-0">
                    <FiUser className="text-[#81a2c5]" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {firstName} {lastName}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <FiCalendar size={12} />
                      {formatDate(updated)}
                      <span className="ml-2 text-slate-400">·</span>
                      <span className="capitalize">{status}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/dashboard/cases/${caseId}`}
                      className="px-4 py-2 text-sm font-medium text-[#81a2c5] hover:bg-[#81a2c5]/10 rounded-lg transition-colors"
                    >
                      View report
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(caseId)}
                      disabled={downloadingId === caseId}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
                    >
                      {downloadingId === caseId ? (
                        <span className="animate-pulse">…</span>
                      ) : (
                        <>
                          <FiDownload size={16} />
                          PDF
                        </>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
