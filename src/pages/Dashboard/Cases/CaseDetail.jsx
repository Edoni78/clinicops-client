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
  FiCalendar,
} from "react-icons/fi";
import { downloadCaseReportPdf } from "../../../utils/caseReportPdf";
import Notification from "../../../components/ui/Notification";
import {
  getPatientCase,
  submitVitals,
  submitReport,
  updateCaseStatus,
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

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
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
  const [report, setReport] = useState({ diagnosis: "", therapy: "" });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

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
          diagnosis: r.diagnosis ?? r.Diagnosis ?? "",
          therapy: r.therapy ?? r.Therapy ?? "",
        });
      }
    } catch (e) {
      setNotif({
        visible: true,
        type: "error",
        message: e.response?.data?.message || e.response?.data || "Failed to load case.",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

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
    setVitalsSubmitting(true);
    try {
      const body = {};
      if (vitals.weightKg !== "") body.weightKg = Number(vitals.weightKg);
      if (vitals.systolicPressure !== "") body.systolicPressure = Number(vitals.systolicPressure);
      if (vitals.diastolicPressure !== "") body.diastolicPressure = Number(vitals.diastolicPressure);
      if (vitals.temperatureC !== "") body.temperatureC = Number(vitals.temperatureC);
      if (vitals.heartRate !== "") body.heartRate = Number(vitals.heartRate);
      await submitVitals(id, body);
      showNotif("success", "Vitals saved. Doctor view will update in real time.");
    } catch (e) {
      showNotif(
        "error",
        e.response?.data?.message || e.response?.data || "Failed to save vitals."
      );
    } finally {
      setVitalsSubmitting(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!report.diagnosis.trim() || !report.therapy.trim()) {
      showNotif("error", "Diagnosis and therapy are required.");
      return;
    }
    setReportSubmitting(true);
    try {
      await submitReport(id, { diagnosis: report.diagnosis.trim(), therapy: report.therapy.trim() });
      showNotif("success", "Report saved.");
    } catch (e) {
      showNotif(
        "error",
        e.response?.data?.message || e.response?.data || "Failed to save report."
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
      showNotif("success", `Status updated to ${newStatus}.`);
    } catch (e) {
      showNotif(
        "error",
        e.response?.data?.message || e.response?.data || "Failed to update status."
      );
    } finally {
      setStatusSubmitting(false);
    }
  };

  const isNurse = role && role.toLowerCase() === "nurse";
  const isDoctor = role && role.toLowerCase() === "doctor";
  const isSuperAdmin = role && role.toLowerCase() === "superadmin";
  // SuperAdmin can do both nurse and doctor actions for testing
  const canEditVitals = isNurse || isSuperAdmin;
  const canEditReportAndStatus = isDoctor || isSuperAdmin;
  const caseStatus = caseData?.status ?? caseData?.Status;
  const allowedNextStatuses = caseData ? STATUS_FLOW[caseStatus] || [] : [];

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
          Back to cases
        </button>
        <p className="text-slate-600">Case not found.</p>
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

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard/cases")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <FiArrowLeft size={18} />
            Back to cases
          </button>
          {isSuperAdmin && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
              Testing: full edit (Nurse + Doctor)
            </span>
          )}
        </div>

        {/* Patient card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FiUser className="text-[#81a2c5]" />
            Patient
          </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Name</p>
              <p className="font-medium text-slate-900">{patientDisplayName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Gender</p>
              <p className="font-medium text-slate-900">{patientGender}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <FiPhone size={12} />
                Mobile number
              </p>
              <p className="font-medium text-slate-900">{patientPhone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="font-medium text-slate-900">{caseData.status ?? caseData.Status}</p>
            </div>
          </div>

          {canEditReportAndStatus && allowedNextStatuses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
              {allowedNextStatuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={statusSubmitting}
                  onClick={() => handleStatusChange(s)}
                  className="px-4 py-2 bg-[#81a2c5] text-white text-sm font-medium rounded-lg hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors"
                >
                  {s === "InConsultation" && "Start consultation"}
                  {s === "Completed" && "Complete visit"}
                  {s === "Finished" && "End visit"}
                  {!["InConsultation", "Completed", "Finished"].includes(s) && s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vitals: Nurse can edit, Doctor sees live */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FiActivity className="text-[#81a2c5]" />
            Vitals
            {latestVitals && (
              <span className="text-xs font-normal text-slate-500">(live updates)</span>
            )}
          </h2>

          {canEditVitals ? (
            <form onSubmit={handleSubmitVitals} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={vitals.weightKg}
                    onChange={(e) => setVitals((p) => ({ ...p, weightKg: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Systolic (mmHg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vitals.systolicPressure}
                    onChange={(e) =>
                      setVitals((p) => ({ ...p, systolicPressure: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Diastolic (mmHg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vitals.diastolicPressure}
                    onChange={(e) =>
                      setVitals((p) => ({ ...p, diastolicPressure: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitals.temperatureC}
                    onChange={(e) =>
                      setVitals((p) => ({ ...p, temperatureC: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Heart rate (bpm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals((p) => ({ ...p, heartRate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={vitalsSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#81a2c5] text-white font-medium rounded-lg hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors"
              >
                {vitalsSubmitting ? (
                  <span className="animate-pulse">Saving…</span>
                ) : (
                  <>
                    <FiCheck size={18} />
                    Save vitals
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Weight (kg)</p>
                <p className="font-medium text-slate-900">
                  {(latestVitals?.weightKg ?? latestVitals?.WeightKg) != null ? (latestVitals?.weightKg ?? latestVitals?.WeightKg) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Blood pressure</p>
                <p className="font-medium text-slate-900">
                  {(latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null &&
                  (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null
                    ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure} / ${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure} mmHg`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Temperature (°C)</p>
                <p className="font-medium text-slate-900">
                  {(latestVitals?.temperatureC ?? latestVitals?.TemperatureC) != null ? (latestVitals?.temperatureC ?? latestVitals?.TemperatureC) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Heart rate (bpm)</p>
                <p className="font-medium text-slate-900">
                  {(latestVitals?.heartRate ?? latestVitals?.HeartRate) != null ? (latestVitals?.heartRate ?? latestVitals?.HeartRate) : "—"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Medical Report – clean card layout */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#81a2c5] to-[#6b8fa8] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiFileText size={22} />
              Medical report
            </h2>
            <button
              type="button"
              onClick={() => downloadCaseReportPdf(caseData)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors border border-white/30"
            >
              <FiDownload size={18} />
              Download PDF
            </button>
          </div>

          <div className="p-0">
            {/* Patient & case info – lined rows */}
            <section className="border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <FiUser size={14} />
                Patient & case
              </h3>
              <div className="divide-y divide-slate-200">
                {[
                  { label: "Name", value: patientDisplayName },
                  { label: "Gender", value: patientGender },
                  { label: "Mobile number", value: patientPhone },
                  { label: "Date of birth", value: formatDateDisplay(patientDob) },
                  { label: "Status", value: caseData.status ?? caseData.Status },
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
                Vital signs
              </h3>
              <div className="divide-y divide-slate-200">
                {[
                  {
                    label: "Weight",
                    value: (latestVitals?.weightKg ?? latestVitals?.WeightKg) != null ? `${latestVitals?.weightKg ?? latestVitals?.WeightKg} kg` : "—",
                  },
                  {
                    label: "Blood pressure",
                    value: (latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null && (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null
                      ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure} / ${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure} mmHg`
                      : "—",
                  },
                  {
                    label: "Temperature",
                    value: (latestVitals?.temperatureC ?? latestVitals?.TemperatureC) != null ? `${latestVitals?.temperatureC ?? latestVitals?.TemperatureC} °C` : "—",
                  },
                  {
                    label: "Heart rate",
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
                Clinical notes
              </h3>
              {canEditReportAndStatus ? (
                <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
                  <div className="border-b border-slate-200 pb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Diagnosis *</label>
                    <textarea
                      value={report.diagnosis}
                      onChange={(e) => setReport((p) => ({ ...p, diagnosis: e.target.value }))}
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                      placeholder="Enter diagnosis..."
                    />
                  </div>
                  <div className="border-b border-slate-200 pb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Therapy *</label>
                    <textarea
                      value={report.therapy}
                      onChange={(e) => setReport((p) => ({ ...p, therapy: e.target.value }))}
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                      placeholder="Enter therapy / prescription..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#81a2c5] text-white font-medium rounded-lg hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors"
                  >
                    {reportSubmitting ? <span className="animate-pulse">Saving…</span> : (<><FiCheck size={18} /> Save report</>)}
                  </button>
                </form>
              ) : (
                <div className="divide-y divide-slate-200">
                  <div className="px-6 py-4">
                    <p className="text-sm text-slate-500 mb-2">Diagnosis</p>
                    <p className="text-slate-900 whitespace-pre-wrap">
                      {medicalReport?.diagnosis ?? medicalReport?.Diagnosis ?? "—"}
                    </p>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-sm text-slate-500 mb-2">Therapy</p>
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
  );
}
