import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiFolder, FiRefreshCw, FiClock, FiTrash2 } from "react-icons/fi";
import { getPatientCases, deletePatientCase, updateCaseStatus } from "../../../api/patientCase";
import { useSignalR } from "../../../context/SignalRContext";
import { useAuth } from "../../../context/AuthContext";
import Notification from "../../../components/ui/Notification";
import { useConfirmModal } from "../../../components/ui/ConfirmModal";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import EmptyState from "../../../components/ui/EmptyState";
import ListFiltersBar from "../../../components/ui/ListFiltersBar";
import {
  isSameDay,
  isYesterday,
  isSameCalendarDay,
  isTerminalCaseStatus,
  caseMatchesNameQuery,
} from "../../../utils/caseListFilters";
import { normalizeCaseStatus } from "./caseStatus";
import { getClinicId } from "../../../utils/clinicId";
import { isClinicAdminRole } from "../../../utils/dashboardMenu";

const STATUS_LABELS = {
  Waiting: "Në pritje",
  InProgress: "Në progres",
  InConsultation: "Në konsultim",
  Completed: "Përfunduar",
  Finished: "Përfunduar",
  Mbyllur: "Mbyllur",
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

const CASE_TABS = [
  { value: "active", label: "Në vazhdim" },
  { value: "completed", label: "Përfunduar" },
];

const CASE_DATE_PRESETS = [
  { value: "today", label: "Sot" },
  { value: "yesterday", label: "Dje" },
  { value: "", label: "Të gjitha" },
];

function statusBadgeClass(status) {
  const map = {
    Waiting: "bg-amber-100 text-amber-800",
    InProgress: "bg-blue-100 text-blue-800",
    InConsultation: "bg-sky-100 text-sky-800",
    Completed: "bg-indigo-100 text-indigo-800",
    Finished: "bg-emerald-100 text-emerald-800",
    Mbyllur: "bg-slate-200 text-slate-800",
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
  const [continuingCaseId, setContinuingCaseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });
  const { confirm, ConfirmDialog } = useConfirmModal();
  /** Në vazhdim | përfunduar / mbyllur */
  const [casesTab, setCasesTab] = useState("active");
  /** Preset date filter when no custom D/M/Y is set */
  const [casesQuickDate, setCasesQuickDate] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [customDate, setCustomDate] = useState("");
  const { connection, connectionState, onVitalsUpdated, onReportUpdated, onCaseStatusChanged } = useSignalR();

  const handleDatePreset = (value) => {
    setCasesQuickDate(value);
    setCustomDate("");
  };

  const handleCustomDate = (value) => {
    setCustomDate(value);
    if (value) setCasesQuickDate("");
  };

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const status = normalizeCaseStatus(c.status ?? c.Status);
      if (isDoctor && status === "Waiting") return false;
      const terminal = isTerminalCaseStatus(status);
      if (casesTab === "active" && terminal) return false;
      if (casesTab === "completed" && !terminal) return false;
      if (!caseMatchesNameQuery(c, nameSearch)) return false;
      const created = c.createdAt ?? c.CreatedAt;
      if (customDate) return isSameCalendarDay(created, customDate);
      if (casesQuickDate === "today") return isSameDay(created, new Date().toISOString());
      if (casesQuickDate === "yesterday") return isYesterday(created);
      return true;
    });
  }, [cases, casesTab, nameSearch, customDate, casesQuickDate, isDoctor]);

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
    const unsubV = isDoctor ? () => {} : onVitalsUpdated(() => fetchCases(true));
    const unsubR = onReportUpdated(() => fetchCases(true));
    const unsubS = onCaseStatusChanged((patientCaseId, newStatus) => {
      fetchCases(true);
      const statusKey = normalizeCaseStatus(newStatus);
      if (isDoctor && statusKey === "InConsultation") {
        setNotif({
          visible: true,
          type: "success",
          message: "Infermieri dërgoi një pacient për konsultim. Lista u përditësua.",
        });
      } else if (!isDoctor && statusKey === "InConsultation") {
        setNotif({ visible: true, type: "info", message: "Rasti u dërgua te mjeku." });
      } else {
        setNotif({ visible: true, type: "info", message: "Statusi i rastit u përditësua. Lista u rifreskua." });
      }
    });
    return () => {
      unsubV();
      unsubR();
      unsubS();
    };
  }, [connection, fetchCases, onVitalsUpdated, onReportUpdated, onCaseStatusChanged, isDoctor]);

  const handleContinueCase = async (c) => {
    const caseId = c?.id ?? c?.Id;
    if (!caseId) return;
    setContinuingCaseId(caseId);
    try {
      const status = normalizeCaseStatus(c?.status ?? c?.Status);
      if (status !== "InConsultation") {
        await updateCaseStatus(caseId, "InConsultation");
      }
      navigate(`/dashboard/cases/${caseId}/doctor`);
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? "Dështoi hapja e rastit.",
      });
    } finally {
      setContinuingCaseId(null);
    }
  };

  const requestDeleteCase = async (c) => {
    const caseId = c?.id ?? c?.Id;
    if (!caseId) return;
    const name = `${c?.patientFirstName ?? c?.PatientFirstName ?? ""} ${c?.patientLastName ?? c?.PatientLastName ?? ""}`.trim();
    const ok = await confirm({
      title: "Fshij rastin",
      message: name
        ? `Fshij rastin e pacientit ${name}? Të gjitha të dhënat e lidhura do të hiqen.`
        : "Fshij këtë rast? Të gjitha të dhënat e lidhura do të hiqen.",
      confirmLabel: "Fshij",
      cancelLabel: "Anulo",
      variant: "danger",
    });
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
    <div className="page-shell">
      <ConfirmDialog />
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
        <span className="px-2.5 py-1 rounded-full bg-slate-100">1) Infermieri: shenjat + «Vazhdo te mjeku»</span>
        <span className="px-2.5 py-1 rounded-full bg-slate-100">2) Mjeku: hap rastin dhe konsulto</span>
        <span className="px-2.5 py-1 rounded-full bg-slate-100">3) Mjeku: raport + përfundo vizitën</span>
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
            <ListFiltersBar
              searchValue={nameSearch}
              onSearchChange={setNameSearch}
              searchPlaceholder="Kërko sipas emrit të pacientit…"
              statusTabs={CASE_TABS}
              activeStatusTab={casesTab}
              onStatusTabChange={setCasesTab}
              datePresets={CASE_DATE_PRESETS}
              activeDatePreset={casesQuickDate}
              onDatePresetChange={handleDatePreset}
              customDate={customDate}
              onCustomDateChange={handleCustomDate}
              resultCount={filteredCases.length}
              resultLabel="rast"
            />

            {filteredCases.length === 0 ? (
              <div className="text-center py-16 px-6">
                <FiFolder className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-600">
                  {nameSearch.trim()
                    ? "Nuk u gjet asnjë rast për këtë kërkim."
                    : customDate
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
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Mjeku
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-[14rem]">
                        Veprimet
                      </th>
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
                      const assignedDoctorName =
                        c.assignedDoctorName ?? c.AssignedDoctorName ?? "";
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
                          <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                            {assignedDoctorName || "—"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {isDoctor && normalizeCaseStatus(status) === "InConsultation" && (
                                <button
                                  type="button"
                                  onClick={() => handleContinueCase(c)}
                                  disabled={continuingCaseId === caseId}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-clinic-400 rounded-lg hover:bg-clinic-500 disabled:opacity-60 transition-colors"
                                >
                                  {continuingCaseId === caseId ? "Duke hapur…" : "Vazhdo Rastin"}
                                </button>
                              )}
                              <Link
                                to={getCaseOpenPath(c)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-clinic-400 bg-clinic-400/10 rounded-lg hover:bg-clinic-400/20 transition-colors border border-clinic-400/20"
                              >
                                Hap
                                <span aria-hidden>→</span>
                              </Link>
                            </div>
                          </td>
                          {canDeleteCases && (
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => requestDeleteCase(c)}
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
