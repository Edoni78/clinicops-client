import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  FiClock,
  FiRefreshCw,
  FiChevronDown,
  FiChevronRight,
  FiUser,
  FiPhone,
} from "react-icons/fi";
import api from "../../../api/axios";
import { getPatientEmr } from "../../../api/emr";
import { useAuth } from "../../../context/AuthContext";
import { isClinicAdminRole, normalizeRole } from "../../../utils/dashboardMenu";
import Notification from "../../../components/ui/Notification";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import EmptyState from "../../../components/ui/EmptyState";
import ListFiltersBar from "../../../components/ui/ListFiltersBar";
import {
  fmtEmrDateOnly,
  getGenderLabel,
  getPatientInitials,
  resolveDoctorName,
} from "../../../utils/emrDisplay";

function consultField(consult, key) {
  const cap = key.charAt(0).toUpperCase() + key.slice(1);
  return consult?.[key] ?? consult?.[cap] ?? "";
}

function SimpleNote({ label, text }) {
  const v = String(text ?? "").trim();
  if (!v) return null;
  return (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{v}</p>
    </div>
  );
}

function formatVitalsLine(vitals) {
  if (!Array.isArray(vitals) || vitals.length === 0) return null;
  const v = vitals[vitals.length - 1];
  const parts = [];
  const w = v.weightKg ?? v.WeightKg;
  const sys = v.systolicPressure ?? v.SystolicPressure;
  const dia = v.diastolicPressure ?? v.DiastolicPressure;
  const temp = v.temperatureC ?? v.TemperatureC;
  const hr = v.heartRate ?? v.HeartRate;
  if (w != null) parts.push(`Pesha ${w} kg`);
  if (sys != null && dia != null) parts.push(`TA ${sys}/${dia}`);
  if (temp != null) parts.push(`Temp ${temp}°C`);
  if (hr != null) parts.push(`RZ ${hr}`);
  return parts.length ? parts.join(" · ") : null;
}

function VisitDetail({ consult }) {
  const vitalsLine = formatVitalsLine(consult.vitals);
  const hasClinical =
    consultField(consult, "anamneza") ||
    consultField(consult, "ekzaminimi") ||
    consultField(consult, "diagnosis") ||
    consultField(consult, "therapy");

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-1">
      {vitalsLine && (
        <p className="text-xs text-slate-600 py-2 border-b border-slate-100">
          <span className="font-medium text-slate-500">Shenjat: </span>
          {vitalsLine}
        </p>
      )}
      <SimpleNote label="Anamneza" text={consultField(consult, "anamneza")} />
      <SimpleNote label="Ekzaminimi" text={consultField(consult, "ekzaminimi")} />
      <SimpleNote label="Diagnoza" text={consultField(consult, "diagnosis")} />
      <SimpleNote label="Terapia" text={consultField(consult, "therapy")} />
      {!hasClinical && !vitalsLine && (
        <p className="text-sm text-slate-500 py-3">Pa të dhëna klinike për këtë vizitë.</p>
      )}
    </div>
  );
}

function getPatientId(p) {
  return p?.id ?? p?.Id ?? p?.patientId ?? "";
}

function patientDisplayName(p) {
  return `${p?.firstName ?? p?.FirstName ?? ""} ${p?.lastName ?? p?.LastName ?? ""}`.trim() || "—";
}

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return "—";
  try {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return String(age);
  } catch {
    return "—";
  }
}

export default function History() {
  const { role } = useAuth();
  const roleLower = String(role || "").toLowerCase();
  const roleKey = normalizeRole(roleLower);
  const isDoctor = roleKey === "doctor";
  const canAccess = isDoctor || isClinicAdminRole(roleLower);

  const [patients, setPatients] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const [expandedConsultIds, setExpandedConsultIds] = useState(() => new Set());
  const [emrByPatient, setEmrByPatient] = useState({});
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });

  const fetchPatients = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/api/Patient");
      const list = Array.isArray(res.data) ? res.data : [];
      setPatients(list);
    } catch (err) {
      setPatients([]);
      setNotif({
        visible: true,
        type: "error",
        message: err?.response?.data?.message || "Nuk u ngarkuan pacientët.",
      });
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) fetchPatients();
  }, [canAccess, fetchPatients]);

  const loadPatientEmr = useCallback(
    async (patientId) => {
      if (!patientId) return;
      setEmrByPatient((prev) => ({
        ...prev,
        [patientId]: { ...(prev[patientId] || {}), loading: true, error: null },
      }));
      try {
        const data = await getPatientEmr(patientId, isDoctor);
        const history = Array.isArray(data?.history) ? [...data.history] : [];
        history.sort((a, b) => new Date(b.consultDate || 0) - new Date(a.consultDate || 0));
        setEmrByPatient((prev) => ({
          ...prev,
          [patientId]: { loading: false, error: null, data: { ...data, history } },
        }));
      } catch (err) {
        const msg =
          typeof err?.response?.data === "string"
            ? err.response.data
            : err?.response?.data?.message;
        setEmrByPatient((prev) => ({
          ...prev,
          [patientId]: {
            loading: false,
            error: msg || "Nuk u ngarkua historia.",
            data: null,
          },
        }));
      }
    },
    [isDoctor]
  );

  const togglePatient = (patientId) => {
    if (expandedPatientId === patientId) {
      setExpandedPatientId(null);
      setExpandedConsultIds(new Set());
      return;
    }
    setExpandedPatientId(patientId);
    setExpandedConsultIds(new Set());
    if (!emrByPatient[patientId]?.data && !emrByPatient[patientId]?.loading) {
      loadPatientEmr(patientId);
    }
  };

  const toggleConsult = (caseId) => {
    setExpandedConsultIds((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  };

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const name = patientDisplayName(p).toLowerCase();
      const phone = String(p.phone ?? p.Phone ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [patients, search]);

  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const colCount = 6;

  return (
    <div className="page-shell max-w-6xl">
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <PageHeader
        title="Historia"
        subtitle="Shikoni historinë klinike të pacientëve — vetëm lexim. Klikoni një rresht për të hapur vizitat."
        icon={FiClock}
        actions={
          <button
            type="button"
            onClick={fetchPatients}
            disabled={loadingList}
            className="btn-secondary btn-md"
          >
            <FiRefreshCw className={loadingList ? "animate-spin" : ""} size={18} />
            Rifresko
          </button>
        }
      />

      <div className="table-shell">
        <ListFiltersBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Kërko sipas emrit ose telefonit…"
          resultCount={filteredPatients.length}
          resultLabel="pacient"
        />

        {loadingList ? (
          <LoadingSpinner className="py-16" label="Duke ngarkuar pacientët…" />
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            icon={FiUser}
            title={search ? "Nuk u gjet asnjë pacient" : "Ende nuk ka pacientë"}
            description={
              search
                ? "Provoni një kërkim tjetër."
                : "Historia shfaqet pasi të regjistrohen pacientët në klinikë."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="table-head-row">
                  <th className="table-th w-10" aria-label="Zgjerimi" />
                  <th className="table-th">Pacienti</th>
                  <th className="table-th">Data e lindjes</th>
                  <th className="table-th">Mosha</th>
                  <th className="table-th">Gjinia</th>
                  <th className="table-th">Telefoni</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const pid = getPatientId(patient);
                  const isOpen = expandedPatientId === pid;
                  const emrState = emrByPatient[pid];
                  const history = emrState?.data?.history ?? [];
                  const visitCount = emrState?.data ? history.length : null;

                  return (
                    <React.Fragment key={pid}>
                      <tr
                        className={`table-row cursor-pointer transition-colors ${
                          isOpen ? "bg-clinic-50/60" : "hover:bg-slate-50/80"
                        }`}
                        onClick={() => togglePatient(pid)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            togglePatient(pid);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-expanded={isOpen}
                      >
                        <td className="py-4 px-3 text-slate-500">
                          {isOpen ? (
                            <FiChevronDown size={18} className="text-clinic-600" />
                          ) : (
                            <FiChevronRight size={18} />
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-clinic-100 text-clinic-700 text-xs font-semibold">
                              {getPatientInitials(
                                patient.firstName ?? patient.FirstName,
                                patient.lastName ?? patient.LastName
                              )}
                            </span>
                            <div>
                              <div className="font-medium text-slate-900">
                                {patientDisplayName(patient)}
                              </div>
                              {visitCount != null && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {visitCount}{" "}
                                  {visitCount === 1 ? "vizitë në histori" : "vizita në histori"}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-700">
                          {fmtEmrDateOnly(patient.dateOfBirth ?? patient.DateOfBirth)}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-700">
                          {calcAge(patient.dateOfBirth ?? patient.DateOfBirth)}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-700">
                          {getGenderLabel(patient.gender ?? patient.Gender)}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <FiPhone size={14} className="text-slate-400 shrink-0" />
                            {patient.phone ?? patient.Phone ?? "—"}
                          </span>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={colCount} className="px-4 py-5 border-b border-slate-200">
                            {emrState?.loading ? (
                              <LoadingSpinner
                                className="py-8"
                                label="Duke ngarkuar historinë klinike…"
                              />
                            ) : emrState?.error ? (
                              <p className="text-sm text-red-600 py-4">{emrState.error}</p>
                            ) : history.length === 0 ? (
                              <p className="text-sm text-slate-600 py-4">
                                Nuk ka vizita të regjistruara për këtë pacient.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide pb-1">
                                  Historia e vizitave
                                </h3>
                                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                  <table className="w-full min-w-[640px] text-sm">
                                    <thead>
                                      <tr className="border-b border-slate-200 bg-slate-50/90">
                                        <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-8" />
                                        <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                          Data
                                        </th>
                                        <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                          Mjeku
                                        </th>
                                        <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                          Statusi
                                        </th>
                                        <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                          Diagnoza
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {history.map((consult) => {
                                        const caseId = consult.patientCaseId;
                                        const consultOpen = expandedConsultIds.has(caseId);
                                        return (
                                          <React.Fragment key={caseId}>
                                            <tr
                                              className="border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleConsult(caseId);
                                              }}
                                            >
                                              <td className="py-3 px-3 text-slate-400">
                                                {consultOpen ? (
                                                  <FiChevronDown size={16} />
                                                ) : (
                                                  <FiChevronRight size={16} />
                                                )}
                                              </td>
                                              <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                                                {fmtEmrDateOnly(consult.consultDate)}
                                              </td>
                                              <td className="py-3 px-3 text-slate-700">
                                                {resolveDoctorName(consult)}
                                              </td>
                                              <td className="py-3 px-3 text-slate-700">
                                                {consult.caseStatus || "—"}
                                              </td>
                                              <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                                                {consult.diagnosis || "—"}
                                              </td>
                                            </tr>
                                            {consultOpen && (
                                              <tr className="bg-slate-50/40">
                                                <td colSpan={5} className="p-3">
                                                  <VisitDetail consult={consult} />
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
