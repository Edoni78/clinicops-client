import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiFolder, FiRefreshCw, FiClock, FiUser } from "react-icons/fi";
import { getPatientCases } from "../../../api/patientCase";
import { useSignalR } from "../../../context/SignalRContext";

const STATUS_OPTIONS = [
  { value: "", label: "Të gjitha" },
  { value: "Waiting", label: "Në pritje" },
  { value: "InProgress", label: "Në progres" },
  { value: "InConsultation", label: "Në konsultim" },
  { value: "Completed", label: "Përfunduar" },
  { value: "Finished", label: "Mbyllur" },
];

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return dateString;
  }
}

function statusBadgeClass(status) {
  const map = {
    Waiting: "bg-amber-100 text-amber-800",
    InProgress: "bg-blue-100 text-blue-800",
    InConsultation: "bg-violet-100 text-violet-800",
    Completed: "bg-emerald-100 text-emerald-800",
    Finished: "bg-slate-100 text-slate-700",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Waiting");
  const { connection, connectionState, onVitalsUpdated, onReportUpdated, onCaseStatusChanged } = useSignalR();

  const fetchCases = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const list = await getPatientCases(statusFilter || undefined);
      setCases(Array.isArray(list) ? list : []);
    } catch {
      setCases([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Auto-update list via SignalR (no manual refresh needed)
  useEffect(() => {
    if (!connection) return;
    const unsubV = onVitalsUpdated(() => fetchCases(true));
    const unsubR = onReportUpdated(() => fetchCases(true));
    const unsubS = onCaseStatusChanged(() => fetchCases(true));
    return () => {
      unsubV();
      unsubR();
      unsubS();
    };
  }, [connection, fetchCases, onVitalsUpdated, onReportUpdated, onCaseStatusChanged]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FiFolder className="text-[#81a2c5]" size={32} />
            Rastet e pacientëve
          </h1>
          <p className="text-slate-600 mt-1">
            Radha dhe lista e rasteve. Hapni një rast për të shtuar shenja jetësore ose për të përfunduar vizitën.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {connectionState === "Connected" && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Direkt
            </span>
          )}
          <button
            type="button"
            onClick={fetchCases}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            Rifresko
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (opt.value || "") === (statusFilter || "")
                  ? "bg-[#81a2c5] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
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
        ) : cases.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FiFolder className="mx-auto mb-4 text-slate-300" size={48} />
            <p>Nuk ka raste në këtë status.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cases.map((c) => {
              const caseId = c.id ?? c.Id;
              const firstName = c.patientFirstName ?? c.PatientFirstName ?? "";
              const lastName = c.patientLastName ?? c.PatientLastName ?? "";
              const status = c.status ?? c.Status;
              const createdAt = c.createdAt ?? c.CreatedAt;
              return (
                <li key={caseId}>
                  <Link
                    to={`/dashboard/cases/${caseId}`}
                    className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#81a2c5]/10 flex items-center justify-center flex-shrink-0">
                        <FiUser className="text-[#81a2c5]" size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {firstName} {lastName}
                        </p>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <FiClock size={12} />
                          {formatDate(createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusBadgeClass(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
