import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import Notification from "../../../components/ui/Notification";
import {
  listApplications,
  approveApplication,
  rejectApplication,
} from "../../../api/clinicApplication";
import { useAuth } from "../../../context/AuthContext";

const STATUS_OPTIONS = [
  { value: "", label: "Të gjitha" },
  { value: "Pending", label: "Në pritje" },
  { value: "Approved", label: "Aprovuar" },
  { value: "Rejected", label: "Refuzuar" },
];

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(dateString);
  }
}

/** Backend sends Status as enum number: 0=Pending, 1=Approved, 2=Rejected */
function isPendingStatus(status, statusDisplay) {
  if (status === 0 || status === "0") return true;
  const s = String(status ?? "").toLowerCase();
  const d = String(statusDisplay ?? "").toLowerCase();
  return s === "pending" || d === "pending";
}

export default function Applies() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });
  const [actionId, setActionId] = useState(null);
  const [actionModal, setActionModal] = useState(null);

  const isSuperAdmin = role && role.toString().toLowerCase() === "superadmin";

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listApplications(statusFilter || undefined);
      setApplications(Array.isArray(list) ? list : []);
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? "Dështoi ngarkimi i aplikimeve.",
      });
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchApplications();
  }, [isSuperAdmin, fetchApplications, navigate]);

  const openApproveModal = (app) => {
    const id = app.id ?? app.Id;
    const name = app.clinicName ?? app.ClinicName ?? "this clinic";
    setActionModal({ action: "approve", id, clinicName: name, reviewNote: "" });
  };

  const openRejectModal = (app) => {
    const id = app.id ?? app.Id;
    const name = app.clinicName ?? app.ClinicName ?? "this clinic";
    setActionModal({ action: "reject", id, clinicName: name, reviewNote: "" });
  };

  const closeModal = () => setActionModal(null);

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { action, id, reviewNote } = actionModal;
    setActionId(id);
    try {
      if (action === "approve") {
        await approveApplication(id, reviewNote);
        setNotif({ visible: true, type: "success", message: "Aplikimi u aprova. Klinika është tani aktive dhe mund të identifikohet." });
      } else {
        await rejectApplication(id, reviewNote);
        setNotif({ visible: true, type: "success", message: "Aplikimi u refuzua." });
      }
      closeModal();
      fetchApplications();
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? (action === "approve" ? "Dështoi aprobimi." : "Dështoi refuzimi."),
      });
    } finally {
      setActionId(null);
    }
  };

  if (!isSuperAdmin) return null;

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      {/* Approve / Reject modal with optional review note */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {actionModal.action === "approve" ? "Aprovo dhe aktivizo klinikën" : "Refuzo aplikimin"}
            </h3>
            <p className="text-slate-600 mt-1">
              {actionModal.action === "approve"
                ? `Aprovo "${actionModal.clinicName}"? Kjo do të krijojë klinikën dhe do t'u lejojë të identifikohen.`
                : `Refuzo "${actionModal.clinicName}"?`}
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Shënim rishikimi (opsional)</label>
              <textarea
                value={actionModal.reviewNote}
                onChange={(e) => setActionModal((m) => ({ ...m, reviewNote: e.target.value }))}
                rows={3}
                placeholder="Shto një shënim për të dhënat..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent resize-none"
              />
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Anulo
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionId === actionModal.id}
                className={`px-4 py-2 text-white font-medium rounded-lg disabled:opacity-50 ${
                  actionModal.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionId === actionModal.id ? "Duke përpunuar…" : actionModal.action === "approve" ? "Aprovo dhe aktivizo" : "Refuzo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FiFileText className="text-[#81a2c5]" size={32} />
              Aplikimet e klinikave
            </h1>
            <p className="text-slate-600 mt-1">
              Rishiko dhe aprovo ose refuzo aplikimet e klinikave.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchApplications()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            Rifresko
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
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
              <svg className="animate-spin h-8 w-8 text-[#81a2c5]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <FiFileText className="mx-auto mb-4 text-slate-300" size={48} />
              <p>Nuk ka aplikime në këtë status.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {applications.map((app) => {
                const id = app.id ?? app.Id;
                const clinicName = app.clinicName ?? app.ClinicName ?? "—";
                const adminEmail = app.adminEmail ?? app.AdminEmail ?? "—";
                const status = app.status ?? app.Status ?? "—";
                const statusDisplay = app.statusDisplay ?? app.StatusDisplay ?? (typeof status === "number" ? ["Pending", "Approved", "Rejected"][status] : status);
                const createdAt = app.createdAtUtc ?? app.CreatedAtUtc ?? app.createdAt ?? app.CreatedAt;
                const reviewedAt = app.reviewedAtUtc ?? app.ReviewedAtUtc ?? app.reviewedAt ?? app.ReviewedAt;
                const reviewNote = app.reviewNote ?? app.ReviewNote;
                const isPending = isPendingStatus(status, statusDisplay);

                return (
                  <li key={id} className="p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">{clinicName}</h3>
                        <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                          <FiMail size={14} />
                          {adminEmail}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          Aplikuar: {formatDate(createdAt)}
                          {reviewedAt && ` · Rishikuar: ${formatDate(reviewedAt)}`}
                        </p>
                        {reviewNote && (
                          <p className="text-sm text-slate-600 mt-2 italic">Shënim: {reviewNote}</p>
                        )}
                        <span
                          className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${
                            isPending
                              ? "bg-amber-100 text-amber-800"
                              : status === 1 || status === "Approved" || String(statusDisplay).toLowerCase() === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {typeof statusDisplay === "string" ? statusDisplay : (["Pending", "Approved", "Rejected"][Number(status)] ?? "—")}
                        </span>
                      </div>
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openApproveModal(app)}
                            disabled={actionId === id}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <FiCheck size={18} />
                            Aprovo dhe aktivizo
                          </button>
                          <button
                            type="button"
                            onClick={() => openRejectModal(app)}
                            disabled={actionId === id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            <FiX size={18} />
                            Refuzo
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
