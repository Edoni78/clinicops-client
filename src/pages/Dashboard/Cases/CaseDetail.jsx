import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
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
import {
  getDoctorProfile,
  getDoctorImageFullUrl,
} from "../../../api/doctorProfile";
import { downloadCaseReportPdfFromBackend } from "../../../utils/caseReportPdf";
import { useAuth } from "../../../context/AuthContext";
import { useSignalR } from "../../../context/SignalRContext";
import { CLINIC_MODE_SOLO_DOCTOR } from "../../../utils/clinicMode";
import { STATUS_FLOW, normalizeCaseStatus } from "./caseStatus";
import PatientInfoCard from "./components/PatientInfoCard";
import NurseSection from "./components/NurseSection";
import DoctorSection from "./components/DoctorSectionSimple";
import LabResultsSection from "./components/LabResultsSection";

export default function CaseDetail() {
  const { id, view } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role, clinicMode } = useAuth();
  const currentRole = String(role || "").toLowerCase();
  const isDoctor = currentRole === "doctor";
  const isSoloDoctorClinic = clinicMode === CLINIC_MODE_SOLO_DOCTOR;
  const showNurseSection = !isSoloDoctorClinic && !isDoctor && view !== "doctor";
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
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [doctorProfileLoading, setDoctorProfileLoading] = useState(false);

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
    if (isSoloDoctorClinic) {
      setLabResults([]);
      setLabResultsLoading(false);
      return;
    }
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
  }, [id, isSoloDoctorClinic]);

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

  useEffect(() => {
    if (!showDoctorSection) return;
    let cancelled = false;
    setDoctorProfileLoading(true);
    getDoctorProfile()
      .then((data) => {
        if (!cancelled) setDoctorProfile(data || null);
      })
      .catch(() => {
        if (!cancelled) setDoctorProfile(null);
      })
      .finally(() => {
        if (!cancelled) setDoctorProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showDoctorSection]);

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
      if (isSoloDoctorClinic) {
        // SoloDoctor workflow: close the case immediately after report save.
        // Try direct finish first; if backend enforces step flow, advance in sequence.
        let finished = false;
        try {
          await updateCaseStatus(id, "Finished");
          finished = true;
        } catch {
          const fallbackFlow = ["InProgress", "InConsultation", "Completed", "Finished"];
          for (const next of fallbackFlow) {
            try {
              await updateCaseStatus(id, next);
            } catch {
              // Continue trying remaining steps.
            }
          }
          const latest = await getPatientCase(id);
          const latestStatus = normalizeCaseStatus(latest?.status ?? latest?.Status);
          finished = latestStatus === "Finished";
        }

        if (finished) {
          setCaseData((prev) => (prev ? { ...prev, status: "Finished" } : prev));
          showNotif("success", "Raporti u ruajt dhe rasti u mbyll automatikisht (SoloDoctor).");
        } else {
          showNotif("success", "Raporti u ruajt.");
        }
      } else {
        showNotif("success", "Raporti u ruajt.");
      }
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

  const handleDownloadReportPdf = async () => {
    try {
      await downloadCaseReportPdfFromBackend(id);
      showNotif("success", "Raporti u shkarkua.");
    } catch (e) {
      const msg = e.response?.status === 404
        ? "Rasti nuk u gjet ose nuk është në klinikën tuaj."
        : (e.response?.data?.message || e.message || "Dështoi shkarkimi i raportit.");
      showNotif("error", msg);
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
  const signaturePath = doctorProfile?.signatureUrl ?? doctorProfile?.SignatureUrl;
  const stampPath = doctorProfile?.stampUrl ?? doctorProfile?.StampUrl;
  const signaturePreviewUrl = getDoctorImageFullUrl(signaturePath);
  const stampPreviewUrl = getDoctorImageFullUrl(stampPath);
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

        <PatientInfoCard
          patientDisplayName={patientDisplayName}
          patientGender={patientGender}
          patientPhone={patientPhone}
          caseStatus={caseData.status ?? caseData.Status}
        />

        {showNurseSection && (
          <NurseSection
            canEditVitals={canEditVitals}
            vitals={vitals}
            setVitals={setVitals}
            handleSubmitVitals={handleSubmitVitals}
            vitalsSubmitting={vitalsSubmitting}
            latestVitals={latestVitals}
            nurseNextStatuses={nurseNextStatuses}
            statusSubmitting={statusSubmitting}
            handleStatusChange={handleStatusChange}
          />
        )}

        {showDoctorSection && (
          <DoctorSection
            isSoloDoctorClinic={isSoloDoctorClinic}
            latestVitals={latestVitals}
            doctorNextStatuses={doctorNextStatuses}
            statusSubmitting={statusSubmitting}
            handleStatusChange={handleStatusChange}
            handleDownloadReportPdf={handleDownloadReportPdf}
            patientDisplayName={patientDisplayName}
            patientGender={patientGender}
            patientPhone={patientPhone}
            formatDateDisplay={formatDateDisplay}
            patientDob={patientDob}
            caseData={caseData}
            canEditReportAndStatus={canEditReportAndStatus}
            handleSubmitReport={handleSubmitReport}
            report={report}
            setReport={setReport}
            reportSubmitting={reportSubmitting}
            medicalReport={medicalReport}
            doctorProfileLoading={doctorProfileLoading}
            signaturePreviewUrl={signaturePreviewUrl}
            stampPreviewUrl={stampPreviewUrl}
          />
        )}

        {!isSoloDoctorClinic && (
          <LabResultsSection
            labFileInputKey={labFileInputKey}
            labUploading={labUploading}
            setLabUploading={setLabUploading}
            id={id}
            uploadLabResult={uploadLabResult}
            getLabResults={getLabResults}
            setLabResults={setLabResults}
            setLabFileInputKey={setLabFileInputKey}
            showNotif={showNotif}
            labResultsLoading={labResultsLoading}
            labResults={labResults}
            downloadLabResultFile={downloadLabResultFile}
          />
        )}
      </div>
    </>
  );
}
