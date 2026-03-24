import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiActivity,
  FiFileText,
  FiCheck,
  FiUser,
  FiPhone,
  FiDownload,
  FiUpload,
  FiFile,
  FiDroplet,
} from "react-icons/fi";
import {
  downloadCaseReportPdfFromBackend,
} from "../../../utils/caseReportPdf";
import Notification from "../../../components/ui/Notification";
import {
  getPatientCase,
  submitVitals,
  submitReport,
  updateCaseStatus,
  getLabResults,
  uploadLabResult,
  downloadLabResultFile,
} from "../../../api/patientCase";
import { useAuth } from "../../../context/AuthContext";
import { useSignalR } from "../../../context/SignalRContext";

const STATUS_FLOW = {
  Waiting: ["InProgress"],
  InProgress: ["InConsultation"],
  InConsultation: ["Completed"],
  Completed: ["Finished"],
  Finished: [],
};

/** Normalize status string to match STATUS_FLOW keys (backend may return enum string). */
function normalizeCaseStatus(s) {
  const t = String(s ?? "").trim();
  const key = t.toLowerCase().replace(/\s+/g, "");
  const map = {
    waiting: "Waiting",
    inprogress: "InProgress",
    in_progress: "InProgress",
    inconsultation: "InConsultation",
    in_consultation: "InConsultation",
    completed: "Completed",
    finished: "Finished",
  };
  return map[key] ?? (STATUS_FLOW[t] ? t : "Waiting");
}

export default function CaseDetail() {
  const { id, view } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const currentRole = String(role || "").toLowerCase();
  const isDoctor = currentRole === "doctor";
  const showNurseSection = !isDoctor && view !== "doctor";
  const showDoctorSection = view !== "nurse";
  const { connection, joinCase, onVitalsUpdated, onReportUpdated, onCaseStatusChanged } =
    useSignalR();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });

  // Nurse: vitals form
  const [vitals, setVitals] = useState({
    weightKg: "",
    systolicPressure: "",
    diastolicPressure: "",
    temperatureC: "",
    heartRate: "",
  });
  const [vitalsSubmitting, setVitalsSubmitting] = useState(false);

  // Doctor: report form
  const [report, setReport] = useState({ anamneza: "", diagnosis: "", therapy: "" });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [labResults, setLabResults] = useState([]);
  const [labResultsLoading, setLabResultsLoading] = useState(false);
  const [labUploading, setLabUploading] = useState(false);
  const [labFileInputKey, setLabFileInputKey] = useState(0);

  const fetchCase = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getPatientCase(id);
      setCaseData(data);
      const v = data?.latestVitals ?? data?.LatestVitals;
      if (v) {
        setVitals({
          weightKg: v.weightKg ?? v.WeightKg ?? "",
          systolicPressure: v.systolicPressure ?? v.SystolicPressure ?? "",
          diastolicPressure: v.diastolicPressure ?? v.DiastolicPressure ?? "",
          temperatureC: v.temperatureC ?? v.TemperatureC ?? "",
          heartRate: v.heartRate ?? v.HeartRate ?? "",
        });
      }
      const r = data?.medicalReport ?? data?.MedicalReport;
      if (r) {
        setReport({
          anamneza: r.anamneza ?? r.Anamneza ?? "",
          diagnosis: r.diagnosis ?? r.Diagnosis ?? "",
          therapy: r.therapy ?? r.Therapy ?? "",
        });
      }
    } catch (e) {
      setNotif({
        visible: true,
        type: "error",
        message: e.response?.data?.message || e.response?.data || "Dështoi ngarkimi i rastit.",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLabResultsLoading(true);
    getLabResults(id)
      .then((list) => {
        if (!cancelled) setLabResults(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setLabResults([]);
      })
      .finally(() => {
        if (!cancelled) setLabResultsLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  // Join SignalR room for this case and subscribe to events
  useEffect(() => {
    if (!id || !connection) return;
    joinCase(id);

    const unsubVitals = onVitalsUpdated((patientCaseId, vitalsDto) => {
      if (patientCaseId === id) {
        const v = vitalsDto || {};
        setCaseData((prev) => (prev ? { ...prev, latestVitals: v } : null));
        setVitals((prev) => ({
          ...prev,
          weightKg: v.weightKg ?? v.WeightKg ?? prev.weightKg,
          systolicPressure: v.systolicPressure ?? v.SystolicPressure ?? prev.systolicPressure,
          diastolicPressure: v.diastolicPressure ?? v.DiastolicPressure ?? prev.diastolicPressure,
          temperatureC: v.temperatureC ?? v.TemperatureC ?? prev.temperatureC,
          heartRate: v.heartRate ?? v.HeartRate ?? prev.heartRate,
        }));
      }
    });
    const unsubReport = onReportUpdated((patientCaseId, reportDto) => {
      if (patientCaseId === id) {
        const r = reportDto || {};
        setCaseData((prev) => (prev ? { ...prev, medicalReport: r } : null));
        setReport((prev) => ({
          anamneza: r.anamneza ?? r.Anamneza ?? prev.anamneza,
          diagnosis: r.diagnosis ?? r.Diagnosis ?? prev.diagnosis,
          therapy: r.therapy ?? r.Therapy ?? prev.therapy,
        }));
      }
    });
    const unsubStatus = onCaseStatusChanged((patientCaseId, status) => {
      if (patientCaseId === id) {
        setCaseData((prev) => (prev ? { ...prev, status } : null));
      }
    });
    return () => {
      unsubVitals();
      unsubReport();
      unsubStatus();
    };
  }, [id, connection, joinCase, onVitalsUpdated, onReportUpdated, onCaseStatusChanged]);

  const showNotif = (type, message) => {
    setNotif({ visible: true, type, message });
  };

  const handleSubmitVitals = async (e) => {
    e.preventDefault();
    const body = {};
    if (vitals.weightKg !== "") body.weightKg = Number(vitals.weightKg);
    if (vitals.systolicPressure !== "") body.systolicPressure = Number(vitals.systolicPressure);
    if (vitals.diastolicPressure !== "") body.diastolicPressure = Number(vitals.diastolicPressure);
    if (vitals.temperatureC !== "") body.temperatureC = Number(vitals.temperatureC);
    if (vitals.heartRate !== "") body.heartRate = Number(vitals.heartRate);
    if (Object.keys(body).length === 0) {
      showNotif("error", "Vendosni të paktën një shenjë jetësore për të ruajtur.");
      return;
    }
    setVitalsSubmitting(true);
    try {
      const dto = await submitVitals(id, body);
      setCaseData((prev) => (prev ? { ...prev, latestVitals: dto } : null));
      setVitals({
        weightKg: dto?.WeightKg ?? dto?.weightKg ?? "",
        systolicPressure: dto?.SystolicPressure ?? dto?.systolicPressure ?? "",
        diastolicPressure: dto?.DiastolicPressure ?? dto?.diastolicPressure ?? "",
        temperatureC: dto?.TemperatureC ?? dto?.temperatureC ?? "",
        heartRate: dto?.HeartRate ?? dto?.heartRate ?? "",
      });
      showNotif("success", "Shenjat jetësore u ruajtën. Pamja e mjekut përditësohet në kohë reale.");
    } catch (e) {
      showNotif(
        "error",
        e.response?.data?.message || e.response?.data || "Dështoi ruajtja e shenjave jetësore."
      );
    } finally {
      setVitalsSubmitting(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!report.diagnosis.trim() || !report.therapy.trim()) {
      showNotif("error", "Diagnoza dhe terapia janë të detyrueshme.");
      return;
    }
    setReportSubmitting(true);
    try {
      await submitReport(id, {
        anamneza: (report.anamneza || "").trim(),
        diagnosis: report.diagnosis.trim(),
        therapy: report.therapy.trim(),
      });
      showNotif("success", "Raporti u ruajt.");
    } catch (e) {
      showNotif(
        "error",
        e.response?.data?.message || e.response?.data || "Dështoi ruajtja e raportit."
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusSubmitting(true);
    try {
      await updateCaseStatus(id, newStatus);
      setCaseData((prev) => (prev ? { ...prev, status: newStatus } : null));
      showNotif("success", `Statusi u përditësua në ${newStatus}.`);
    } catch (e) {
      showNotif(
        "error",
        e.response?.data?.message || e.response?.data || "Dështoi përditësimi i statusit."
      );
    } finally {
      setStatusSubmitting(false);
    }
  };

  const canEditVitals = isAuthenticated;
  const canEditReportAndStatus = isAuthenticated;
  const rawStatus = caseData?.status ?? caseData?.Status;
  const caseStatus = normalizeCaseStatus(rawStatus);
  const allowedNextStatuses = caseData ? (STATUS_FLOW[caseStatus] || []) : [];
  const nurseNextStatuses = allowedNextStatuses.filter((s) => s === "InProgress" || s === "InConsultation");
  const doctorNextStatuses = allowedNextStatuses.filter((s) => s === "InConsultation" || s === "Completed" || s === "Finished");

  if (loading && !caseData) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center py-20">
        <svg
          className="animate-spin h-10 w-10 text-[#81a2c5]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate("/dashboard/cases")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <FiArrowLeft size={18} />
            Mbrapsht te rastet
          </button>
        <p className="text-slate-600">Rasti nuk u gjet.</p>
      </div>
    );
  }

  const patient = caseData.patient || caseData.Patient || {};
  const latestVitals = caseData.latestVitals ?? caseData.LatestVitals;
  const medicalReport = caseData.medicalReport ?? caseData.MedicalReport;
  // Support both nested patient and flat case-level names (e.g. patientFirstName from list DTO)
  const patientFirstName = patient.firstName ?? patient.FirstName ?? caseData.patientFirstName ?? caseData.PatientFirstName ?? "";
  const patientLastName = patient.lastName ?? patient.LastName ?? caseData.patientLastName ?? caseData.PatientLastName ?? "";
  const patientDisplayName = [patientFirstName, patientLastName].filter(Boolean).join(" ") || "—";
  // Backend may send nested (patient.Phone/Gender) or flat (caseData.patientPhone/patientGender); support both
  const patientPhone =
    patient.phone ?? patient.Phone ?? caseData.patientPhone ?? caseData.PatientPhone ?? "—";
  const patientGender =
    patient.gender ??
    patient.Gender ??
    patient.sex ??
    patient.Sex ??
    caseData.patientGender ??
    caseData.PatientGender ??
    caseData.patientSex ??
    caseData.PatientSex ??
    (caseData.Patient && (caseData.Patient.gender ?? caseData.Patient.Gender)) ??
    "—";
  const patientDob =
    patient.dateOfBirth ?? patient.DateOfBirth ?? caseData.patientDateOfBirth ?? caseData.PatientDateOfBirth;
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(dateString);
    }
  };

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((prev) => ({ ...prev, visible: false }))}
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate("/dashboard/cases")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200"
          >
            <FiArrowLeft size={18} />
            Mbrapsht te rastet
          </button>
        </div>

        {/* Patient card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7 mb-7">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FiUser className="text-[#81a2c5]" />
            Pacienti
          </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <p className="text-sm text-slate-500">Emri</p>
              <p className="font-medium text-slate-900">{patientDisplayName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Gjinia</p>
              <p className="font-medium text-slate-900">{patientGender}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <FiPhone size={12} />
                Numri i telefonit
              </p>
              <p className="font-medium text-slate-900">{patientPhone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Statusi</p>
              <p className="font-medium text-slate-900">{caseData.status ?? caseData.Status}</p>
            </div>
          </div>
        </div>

        {showNurseSection && (
        <>
        {/* Nurse section: vitals + hand-off to doctor */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7 mb-7">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <FiActivity className="text-[#81a2c5]" />
            Infermieri – Shenjat jetësore dhe radha
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Vendosni shenjat jetësore dhe dërgoni rastin te mjeku kur gati.
          </p>

          {canEditVitals ? (
            <form onSubmit={handleSubmitVitals} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pesha (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={vitals.weightKg}
                    onChange={(e) => setVitals((p) => ({ ...p, weightKg: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sistolike (mmHg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vitals.systolicPressure}
                    onChange={(e) =>
                      setVitals((p) => ({ ...p, systolicPressure: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Diastolike (mmHg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vitals.diastolicPressure}
                    onChange={(e) =>
                      setVitals((p) => ({ ...p, diastolicPressure: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitals.temperatureC}
                    onChange={(e) =>
                      setVitals((p) => ({ ...p, temperatureC: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rrahjet e zemrës (bpm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals((p) => ({ ...p, heartRate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={vitalsSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#81a2c5] text-white font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm"
              >
                {vitalsSubmitting ? (
                  <span className="animate-pulse">Duke ruajtur…</span>
                ) : (
                  <>
                    <FiCheck size={18} />
                    Ruaj shenjat jetësore
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Pesha (kg)</p>
                <p className="font-medium text-slate-900">
                  {(latestVitals?.weightKg ?? latestVitals?.WeightKg) != null ? (latestVitals?.weightKg ?? latestVitals?.WeightKg) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Presioni i gjakut</p>
                <p className="font-medium text-slate-900">
                  {(latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null &&
                  (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null
                    ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure} / ${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure} mmHg`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Temperatura (°C)</p>
                <p className="font-medium text-slate-900">
                  {(latestVitals?.temperatureC ?? latestVitals?.TemperatureC) != null ? (latestVitals?.temperatureC ?? latestVitals?.TemperatureC) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Rrahjet e zemrës (bpm)</p>
                <p className="font-medium text-slate-900">
                  {(latestVitals?.heartRate ?? latestVitals?.HeartRate) != null ? (latestVitals?.heartRate ?? latestVitals?.HeartRate) : "—"}
                </p>
              </div>
            </div>
          )}

          {nurseNextStatuses.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-200">
              <p className="text-sm font-medium text-slate-600 mb-2">Ndrysho statusin (infermieri):</p>
              <div className="flex flex-wrap gap-2">
                {nurseNextStatuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={statusSubmitting}
                    onClick={() => handleStatusChange(s)}
                    className="px-4 py-2 bg-[#81a2c5] text-white text-sm font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {s === "InProgress" && "Kalo në progres"}
                    {s === "InConsultation" && "Dërgo te mjeku"}
                    {!["InProgress", "InConsultation"].includes(s) && s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        </>
        )}

        {showDoctorSection && (
        <>
        {/* Doctor section: live vitals + status + diagnosis & therapy */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-7">
          <div className="p-7 pb-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <FiFileText className="text-[#81a2c5]" />
              Mjeku – Konsultimi dhe raporti
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Shenjat jetësore përditësohen në kohë reale. Vendosni diagnozën dhe terapiën dhe përfundoni vizitën.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Pesha</p>
                <p className="font-medium text-slate-900">{(latestVitals?.weightKg ?? latestVitals?.WeightKg) != null ? `${latestVitals?.weightKg ?? latestVitals?.WeightKg} kg` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Presioni</p>
                <p className="font-medium text-slate-900">
                  {(latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null && (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null
                    ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure}/${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Temperatura</p>
                <p className="font-medium text-slate-900">{(latestVitals?.temperatureC ?? latestVitals?.TemperatureC) != null ? `${latestVitals?.temperatureC ?? latestVitals?.TemperatureC} °C` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Rrahjet</p>
                <p className="font-medium text-slate-900">{(latestVitals?.heartRate ?? latestVitals?.HeartRate) != null ? `${latestVitals?.heartRate ?? latestVitals?.HeartRate} bpm` : "—"}</p>
              </div>
            </div>

            {doctorNextStatuses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-slate-600 mr-2">Statusi (mjeku):</span>
                {doctorNextStatuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={statusSubmitting}
                    onClick={() => handleStatusChange(s)}
                    className="px-4 py-2 bg-[#81a2c5] text-white text-sm font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {s === "InConsultation" && "Fillo konsultimin"}
                    {s === "Completed" && "Përfundo vizitën"}
                    {s === "Finished" && "Mbyll vizitën"}
                    {!["InConsultation", "Completed", "Finished"].includes(s) && s}
                  </button>
                ))}
              </div>
            )}
          </div>

        {/* Medical Report – inside doctor section */}
        <div className="border-t border-slate-200">
          <div className="bg-slate-900 px-7 py-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiFileText size={22} />
              Raporti mjekësor
            </h2>
            <button
              type="button"
              onClick={async () => {
                try {
                  await downloadCaseReportPdfFromBackend(id);
                  showNotif("success", "Raporti u shkarkua.");
                } catch (e) {
                  const msg = e.response?.status === 404
                    ? "Rasti nuk u gjet ose nuk është në klinikën tuaj."
                    : (e.response?.data?.message || e.message || "Dështoi shkarkimi i raportit.");
                  showNotif("error", msg);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors border border-white/20"
            >
              <FiDownload size={18} />
              Shkarko PDF
            </button>
          </div>

          <div className="p-0">
            {/* Patient & case info – lined rows */}
            <section className="border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <FiUser size={14} />
                Pacienti dhe rasti
              </h3>
              <div className="divide-y divide-slate-200">
                {[
                  { label: "Emri", value: patientDisplayName },
                  { label: "Gjinia", value: patientGender },
                  { label: "Numri i telefonit", value: patientPhone },
                  { label: "Data e lindjes", value: formatDateDisplay(patientDob) },
                  { label: "Statusi", value: caseData.status ?? caseData.Status },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-wrap items-baseline justify-between gap-4 px-6 py-3">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-medium text-slate-900 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Vitals – lined rows */}
            <section className="border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <FiActivity size={14} />
                Shenjat jetësore
              </h3>
              <div className="divide-y divide-slate-200">
                {[
                  {
                    label: "Pesha",
                    value: (latestVitals?.weightKg ?? latestVitals?.WeightKg) != null ? `${latestVitals?.weightKg ?? latestVitals?.WeightKg} kg` : "—",
                  },
                  {
                    label: "Presioni i gjakut",
                    value: (latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null && (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null
                      ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure} / ${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure} mmHg`
                      : "—",
                  },
                  {
                    label: "Temperatura",
                    value: (latestVitals?.temperatureC ?? latestVitals?.TemperatureC) != null ? `${latestVitals?.temperatureC ?? latestVitals?.TemperatureC} °C` : "—",
                  },
                  {
                    label: "Rrahjet e zemrës",
                    value: (latestVitals?.heartRate ?? latestVitals?.HeartRate) != null ? `${latestVitals?.heartRate ?? latestVitals?.HeartRate} bpm` : "—",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-wrap items-baseline justify-between gap-4 px-6 py-3">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-medium text-slate-900 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Diagnosis & therapy – lined */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <FiFileText size={14} />
                Shënime klinike
              </h3>
              {canEditReportAndStatus ? (
                <form onSubmit={handleSubmitReport} className="p-7 space-y-5">
                  <div className="border-b border-slate-200 pb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Anamneza</label>
                    <textarea
                      value={report.anamneza}
                      onChange={(e) => setReport((p) => ({ ...p, anamneza: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                      placeholder="Historia e sëmundjes, anamneza..."
                    />
                  </div>
                  <div className="border-b border-slate-200 pb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Diagnoza *</label>
                    <textarea
                      value={report.diagnosis}
                      onChange={(e) => setReport((p) => ({ ...p, diagnosis: e.target.value }))}
                      rows={3}
                      required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                      placeholder="Vendosni diagnozën..."
                    />
                  </div>
                  <div className="border-b border-slate-200 pb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Terapia *</label>
                    <textarea
                      value={report.therapy}
                      onChange={(e) => setReport((p) => ({ ...p, therapy: e.target.value }))}
                      rows={3}
                      required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                      placeholder="Vendosni terapi / recetë..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#81a2c5] text-white font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {reportSubmitting ? <span className="animate-pulse">Duke ruajtur…</span> : (<><FiCheck size={18} /> Ruaj raportin</>)}
                  </button>
                </form>
              ) : (
                <div className="divide-y divide-slate-200">
                  <div className="px-6 py-4">
                    <p className="text-sm text-slate-500 mb-2">Anamneza</p>
                    <p className="text-slate-900 whitespace-pre-wrap">
                      {medicalReport?.anamneza ?? medicalReport?.Anamneza ?? "—"}
                    </p>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-sm text-slate-500 mb-2">Diagnoza</p>
                    <p className="text-slate-900 whitespace-pre-wrap">
                      {medicalReport?.diagnosis ?? medicalReport?.Diagnosis ?? "—"}
                    </p>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-sm text-slate-500 mb-2">Terapia</p>
                    <p className="text-slate-900 whitespace-pre-wrap">
                      {medicalReport?.therapy ?? medicalReport?.Therapy ?? "—"}
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
        </div>
        </>
        )}

        {/* Lab results – list + upload (any role that can view the case) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7 mb-7">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <FiDroplet className="text-amber-600" />
            Rezultatet e laboratorit
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Shtoni PDF të rezultateve të laboratorit. Ato do të përfshihen në raportin e rastit (Shkarko PDF).
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl cursor-pointer transition-colors border border-slate-200">
              <FiUpload size={18} />
              Zgjidh PDF
              <input
                key={labFileInputKey}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !id) return;
                  setLabUploading(true);
                  try {
                    await uploadLabResult(id, file);
                    const list = await getLabResults(id);
                    setLabResults(Array.isArray(list) ? list : []);
                    setLabFileInputKey((k) => k + 1);
                    showNotif("success", "Rezultati i laboratorit u ngarkua.");
                  } catch (err) {
                    const msg = err.response?.data?.message || err.response?.data || "Ngarkimi dështoi.";
                    showNotif("error", msg);
                  } finally {
                    setLabUploading(false);
                  }
                }}
                disabled={labUploading}
              />
            </label>
            {labUploading && (
              <span className="text-sm text-slate-500 animate-pulse">Duke ngarkuar…</span>
            )}
          </div>

          {labResultsLoading ? (
            <p className="text-sm text-slate-500">Duke ngarkuar rezultatet…</p>
          ) : labResults.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Nuk ka rezultate laboratori ende. Shtoni një PDF më sipër.</p>
          ) : (
            <ul className="space-y-2">
              {labResults.map((lab) => (
                <li
                  key={lab.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <span className="flex items-center gap-2 text-slate-800">
                    <FiFile className="text-amber-600" />
                    {lab.fileName ?? lab.FileName ?? "lab-result.pdf"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {lab.uploadedAt ?? lab.UploadedAt
                      ? new Date(lab.uploadedAt ?? lab.UploadedAt).toLocaleString("sq-AL")
                      : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      downloadLabResultFile(
                        lab.downloadUrl ?? lab.DownloadUrl,
                        lab.fileName ?? lab.FileName ?? "lab-result.pdf"
                      )
                    }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
                  >
                    <FiDownload size={16} />
                    Shkarko
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </>
  );
}
