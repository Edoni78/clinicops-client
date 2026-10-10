import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiFolder, FiRefreshCw, FiTrash2, FiUploadCloud } from "react-icons/fi";
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
import { CLINIC_MODE_SOLO_DOCTOR } from "../../../utils/clinicMode";
import StatusBadge from "../../../components/ui/StatusBadge";
import { formatUpdatedBy } from "../../../utils/relativeTime";

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

export default function Cases() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, clinicMode } = useAuth();
  const currentRole = String(role || "").toLowerCase();
  const isSoloDoctorClinic = clinicMode === CLINIC_MODE_SOLO_DOCTOR;
  const isDoctor = currentRole === "doctor";
  const isNurse = currentRole === "nurse";
  const canDeleteCases =
    isClinicAdminRole(currentRole) || currentRole === "doctor" || currentRole === "superadmin";
  const canImportCases = isClinicAdminRole(currentRole);
  const [cases, setCases] = useState([]);
  const [deletingCaseId, setDeletingCaseId] = useState(null);
  const [continuingCaseId, setContinuingCaseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });
  const { confirm, ConfirmDialog } = useConfirmModal();
  /** Nurse queue is split by handoff. Other roles keep active / completed. */
  const [casesTab, setCasesTab] = useState(isNurse ? "waiting" : "active");
  /** Preset date filter when no custom D/M/Y is set */
  const [casesQuickDate, setCasesQuickDate] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [customDate, setCustomDate] = useState("");
  const { connection, connectionState, onVitalsUpdated, onReportUpdated, onCaseStatusChanged } =
    useSignalR();
  const signalRRefreshTimerRef = React.useRef(null);

  useEffect(() => {
    const notice = location.state?.notice;
    if (!notice) return;
    setNotif({
      visible: true,
      type: location.state?.noticeType || "success",
      message: notice,
    });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const nurseCounts = useMemo(() => {
    const counts = { waiting: 0, withDoctor: 0, toClose: 0, closed: 0 };
    cases.forEach((c) => {
      const status = normalizeCaseStatus(c.status ?? c.Status);
      if (status === "Waiting") counts.waiting += 1;
      else if (status === "InConsultation" || status === "InProgress") counts.withDoctor += 1;
      else if (status === "Finished") counts.toClose += 1;
      else if (status === "Mbyllur" || status === "Completed") counts.closed += 1;
    });
    return counts;
  }, [cases]);

  const statusTabs = isNurse
    ? [
        { value: "waiting", label: `Në pritje (${nurseCounts.waiting})` },
        { value: "withDoctor", label: `Te mjeku (${nurseCounts.withDoctor})` },
        { value: "toClose", label: `Për mbyllje (${nurseCounts.toClose})` },
        { value: "closed", label: `Mbyllur (${nurseCounts.closed})` },
      ]
    : CASE_TABS;

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
      if (isNurse) {
        if (casesTab === "waiting" && status !== "Waiting") return false;
        if (
          casesTab === "withDoctor" &&
          status !== "InConsultation" &&
          status !== "InProgress"
        ) {
          return false;
        }
        if (casesTab === "toClose" && status !== "Finished") return false;
        if (casesTab === "closed" && status !== "Mbyllur" && status !== "Completed") return false;
      } else {
        const terminal = isTerminalCaseStatus(status);
        if (casesTab === "active" && terminal) return false;
        if (casesTab === "completed" && !terminal) return false;
      }
      if (!caseMatchesNameQuery(c, nameSearch)) return false;
      const created = c.createdAt ?? c.CreatedAt;
      if (customDate) return isSameCalendarDay(created, customDate);
      if (casesQuickDate === "today") return isSameDay(created, new Date().toISOString());
      if (casesQuickDate === "yesterday") return isYesterday(created);
      return true;
    });
  }, [cases, casesTab, nameSearch, customDate, casesQuickDate, isDoctor, isNurse]);

  const getCaseOpenPath = useCallback(
    (c) => {
      const caseId = c?.id ?? c?.Id;
      if (!caseId) return "/dashboard/cases";
      if (isDoctor || isSoloDoctorClinic) return `/dashboard/cases/${caseId}/doctor`;
      if (isNurse) return `/dashboard/cases/${caseId}/nurse`;
      const status = String(c?.status ?? c?.Status ?? "").trim().toLowerCase();
      if (["inconsultation", "completed", "finished"].includes(status)) {
        return `/dashboard/cases/${caseId}/doctor`;
      }
      return `/dashboard/cases/${caseId}/nurse`;
    },
    [isDoctor, isNurse, isSoloDoctorClinic]
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
  // so we silently refresh while this page is open (less often when SignalR is up).
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") fetchCases(true);
    };
    const intervalMs = connectionState === "Connected" ? 30000 : 8000;
    const intervalId = window.setInterval(refreshIfVisible, intervalMs);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [fetchCases, connectionState]);

  const scheduleSignalRListRefresh = useCallback(() => {
    if (signalRRefreshTimerRef.current) {
      clearTimeout(signalRRefreshTimerRef.current);
    }
    signalRRefreshTimerRef.current = window.setTimeout(() => {
      signalRRefreshTimerRef.current = null;
      fetchCases(true);
    }, 200);
  }, [fetchCases]);

  // Auto-update list via SignalR and show notification when status changes (e.g. nurse sends case to doctor)
  useEffect(() => {
    if (!connection) return;
    const unsubV = isDoctor ? () => {} : onVitalsUpdated(scheduleSignalRListRefresh);
    const unsubR = onReportUpdated(scheduleSignalRListRefresh);
    const unsubS = onCaseStatusChanged((patientCaseId, newStatus) => {
      scheduleSignalRListRefresh();
      const statusKey = normalizeCaseStatus(newStatus);
      if (isDoctor && statusKey === "InConsultation") {
        setNotif({
          visible: true,
          type: "success",
          message: "Infermieri dërgoi një pacient për konsultim. Lista u përditësua.",
        });
      } else if (isNurse && statusKey === "InConsultation") {
        setNotif({ visible: true, type: "info", message: "Pacienti u dërgua te mjeku." });
      } else if (isNurse && statusKey === "Finished") {
        setCasesTab("toClose");
        setNotif({
          visible: true,
          type: "success",
          message: "Mjeku përfundoi vizitën. Rasti është te «Për mbyllje».",
        });
      } else if (isNurse && statusKey === "Mbyllur") {
        setCasesTab("waiting");
        setNotif({ visible: true, type: "success", message: "Rasti u mbyll." });
      } else if (isDoctor && statusKey === "Finished") {
        setNotif({ visible: true, type: "success", message: "Vizitë e përfunduar." });
      } else {
        setNotif({ visible: true, type: "info", message: "Statusi i rastit u përditësua. Lista u rifreskua." });
      }
    });
    return () => {
      unsubV();
      unsubR();
      unsubS();
      if (signalRRefreshTimerRef.current) {
        clearTimeout(signalRRefreshTimerRef.current);
        signalRRefreshTimerRef.current = null;
      }
    };
  }, [
    connection,
    scheduleSignalRListRefresh,
    onVitalsUpdated,
    onReportUpdated,
    onCaseStatusChanged,
    isDoctor,
    isNurse,
  ]);

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
        subtitle={
          isNurse
            ? "Në pritje, te mjeku, pastaj «Për mbyllje» pasi mjeku përfundon vizitën."
            : "Të gjitha rastet. Ndryshimet e statusit përditësohen në kohë reale."
        }
        icon={FiFolder}
        actions={
          <>
            {connectionState === "Connected" && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md font-medium">
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
            {canImportCases && (
              <Link to="/dashboard/cases-import" className="btn-primary btn-md">
                <FiUploadCloud size={18} />
                Importo raste
              </Link>
            )}
          </>
        }
      />

      <div className="table-shell">
        {loading ? (
          <LoadingSpinner className="py-20" label="Duke ngarkuar rastet…" />
        ) : cases.length === 0 ? (
          <EmptyState
            icon={FiFolder}
            title="Nuk ka raste"
            description="Nuk ka raste të regjistruara ende."
            action={
              isNurse || isClinicAdminRole(currentRole) || currentRole === "superadmin" ? (
                <Link to="/dashboard/patients" className="btn-primary btn-md">
                  Hap rast të ri
                </Link>
              ) : null
            }
          />
        ) : (
          <>
            <ListFiltersBar
              searchValue={nameSearch}
              onSearchChange={setNameSearch}
              searchPlaceholder="Kërko sipas emrit të pacientit…"
              statusTabs={statusTabs}
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
              <div className="text-center py-10 px-4">
                <p className="text-sm text-slate-600">
                  {nameSearch.trim()
                    ? "Nuk u gjet asnjë rast për këtë kërkim."
                    : customDate
                      ? "Nuk ka raste për këtë datë."
                      : casesQuickDate === "today"
                        ? "Nuk ka raste për sot."
                        : casesQuickDate === "yesterday"
                          ? "Nuk ka raste për dje."
                          : isNurse && casesTab === "waiting"
                            ? "Nuk ka pacientë në pritje."
                            : isNurse && casesTab === "withDoctor"
                              ? "Nuk ka pacientë te mjeku."
                              : isNurse && casesTab === "toClose"
                                ? "Nuk ka vizita të përfunduara për mbyllje."
                                : isNurse && casesTab === "closed"
                                  ? "Nuk ka raste të mbyllura."
                                  : casesTab === "completed"
                                    ? "Nuk ka raste të përfunduar ose të mbyllur që përputhen me filtrat."
                                    : "Nuk ka raste në vazhdim që përputhen me filtrat."}
                </p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="w-full">
                  <thead>
                    <tr className="table-head-row">
                      <th className="table-th">Pacienti</th>
                      <th className="table-th">Data</th>
                      <th className="table-th">Statusi</th>
                      <th className="table-th">Mjeku</th>
                      <th className="table-th text-right min-w-[12rem]">Veprimet</th>
                      {canDeleteCases && <th className="w-16" />}
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
                      const updatedAt = c.updatedAt ?? c.UpdatedAt ?? createdAt;
                      return (
                        <tr key={caseId} className="table-row">
                          <td className="table-td">
                            <Link
                              to={getCaseOpenPath(c)}
                              className="font-medium text-slate-900 hover:text-sky-700"
                            >
                              {firstName} {lastName}
                            </Link>
                            <p className="audit-meta mt-0.5">
                              {formatUpdatedBy(updatedAt, assignedDoctorName)}
                            </p>
                          </td>
                          <td className="table-td tabular-nums text-xs text-slate-600">
                            {formatDate(createdAt)}
                          </td>
                          <td className="table-td">
                            <StatusBadge status={status} />
                          </td>
                          <td className="table-td whitespace-nowrap">
                            {assignedDoctorName || "—"}
                          </td>
                          <td className="table-td text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {isDoctor && normalizeCaseStatus(status) === "InConsultation" && (
                                <button
                                  type="button"
                                  onClick={() => handleContinueCase(c)}
                                  disabled={continuingCaseId === caseId}
                                  className="btn-primary btn-sm"
                                >
                                  {continuingCaseId === caseId ? "Duke hapur…" : "Vazhdo Rastin"}
                                </button>
                              )}
                              <Link
                                to={getCaseOpenPath(c)}
                                className={
                                  isNurse &&
                                  (normalizeCaseStatus(status) === "Waiting" ||
                                    normalizeCaseStatus(status) === "Finished")
                                    ? "btn-primary btn-sm"
                                    : "btn-secondary btn-sm"
                                }
                              >
                                {isNurse && normalizeCaseStatus(status) === "Finished"
                                  ? "Mbyll"
                                  : isNurse && normalizeCaseStatus(status) === "Waiting"
                                    ? "Përgatit"
                                    : "Hap"}
                              </Link>
                            </div>
                          </td>
                          {canDeleteCases && (
                            <td className="table-td text-right">
                              <button
                                type="button"
                                onClick={() => requestDeleteCase(c)}
                                disabled={deletingCaseId === caseId}
                                className="btn-danger btn-sm"
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
