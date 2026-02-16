import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiFolder, FiRefreshCw, FiClock } from "react-icons/fi";
import { getPatientCases } from "../../../api/patientCase";
import { useSignalR } from "../../../context/SignalRContext";
import Notification from "../../../components/ui/Notification";

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
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });
  const { connection, connectionState, onVitalsUpdated, onReportUpdated, onCaseStatusChanged } = useSignalR();

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
            <span className="p-2 rounded-xl bg-gradient-to-br from-[#81a2c5] to-[#6b8fa8] text-white shadow-lg">
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
            <span className="flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
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
                {cases.map((c) => {
                  const caseId = c.id ?? c.Id;
                  const firstName = c.patientFirstName ?? c.PatientFirstName ?? "";
                  const lastName = c.patientLastName ?? c.PatientLastName ?? "";
                  const status = c.status ?? c.Status;
                  const createdAt = c.createdAt ?? c.CreatedAt;
                  return (
                    <tr key={caseId} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <Link to={`/dashboard/cases/${caseId}`} className="font-medium text-slate-900 hover:text-[#81a2c5]">
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
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClass(status)}`}>
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
      </div>
    </div>
  );
}
