import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Notification from "../../../components/ui/Notification";
import {
  getPatientCase,
  getPatientCases,
  submitVitals,
  submitReport,
  updateCaseStatus,
  attachServiceToCase,
  getLabResults,
  uploadLabResult,
  downloadLabResultFile,
} from "../../../api/patientCase";
import { listServices } from "../../../api/service";
import {
  getDoctorProfile,
  getDoctorImageFullUrl,
} from "../../../api/doctorProfile";
import { downloadCaseReportPdfFromBackend } from "../../../utils/caseReportPdf";
import { useAuth } from "../../../context/AuthContext";
import { useSignalR } from "../../../context/SignalRContext";
import { CLINIC_MODE_SOLO_DOCTOR } from "../../../utils/clinicMode";
import {
  STATUS_FLOW,
  normalizeCaseStatus,
  SINGLE_CONSULTATION_MESSAGE,
  findActiveInConsultationCase,
} from "./caseStatus";
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
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  /** Another case id already InConsultation (blocks starting a second). */
  const [otherConsultationCaseId, setOtherConsultationCaseId] = useState(null);

  const refreshConsultationLock = useCallback(async () => {
    try {
      const list = await getPatientCases("InConsultation");
      const active = findActiveInConsultationCase(list);
      const activeId = active?.id ?? active?.Id ?? null;
      setOtherConsultationCaseId(activeId && activeId !== id ? activeId : null);
    } catch {
      setOtherConsultationCaseId(null);
    }
  }, [id]);

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
    refreshConsultationLock();
  }, [refreshConsultationLock]);

  // Doctor: if another case is in consultation, stay on that visit.
  useEffect(() => {
    if (!isDoctor || loading || !caseData || !otherConsultationCaseId) return;
    const status = normalizeCaseStatus(caseData?.status ?? caseData?.Status);
    if (status === "InConsultation") return;
    navigate(`/dashboard/cases/${otherConsultationCaseId}/doctor`, { replace: true });
  }, [isDoctor, loading, caseData, otherConsultationCaseId, navigate]);

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
      refreshConsultationLock();
      if (patientCaseId === id) {
        setCaseData((prev) => (prev ? { ...prev, status } : null));
      }
      if (isDoctor && normalizeCaseStatus(status) === "InConsultation" && patientCaseId !== id) {
        navigate(`/dashboard/cases/${patientCaseId}/doctor`, { replace: true });
      }
    });
    return () => {
      unsubVitals();
      unsubReport();
      unsubStatus();
    };
  }, [
    id,
    connection,
    joinCase,
    onVitalsUpdated,
    onReportUpdated,
    onCaseStatusChanged,
    refreshConsultationLock,
    isDoctor,
    navigate,
  ]);

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

  useEffect(() => {
    const sid = caseData?.serviceId ?? caseData?.ServiceId;
    if (sid) setSelectedServiceId(String(sid));
  }, [caseData?.serviceId, caseData?.ServiceId]);

  useEffect(() => {
    if (!showDoctorSection) return;
    let cancelled = false;
    setServicesLoading(true);
    listServices()
      .then((list) => {
        if (!cancelled) setServices(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false);
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
    if (newStatus === "InConsultation" && otherConsultationCaseId) {
      showNotif("error", SINGLE_CONSULTATION_MESSAGE);
      return;
    }
    setStatusSubmitting(true);
    try {
      await updateCaseStatus(id, newStatus);
      await refreshConsultationLock();
      setCaseData((prev) => (prev ? { ...prev, status: newStatus } : null));
      if (newStatus === "Completed") {
        navigate("/dashboard/cases");
        return;
      }
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

  const handleAttachService = async () => {
    const serviceId = String(selectedServiceId || "").trim();
    if (!serviceId) {
      showNotif("error", "Zgjidhni një shërbim.");
      return;
    }
    setServiceSubmitting(true);
    try {
      const attached = await attachServiceToCase(id, serviceId);
      const selected = services.find((s) => (s.id ?? s.Id) === serviceId);
      setCaseData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          serviceId: attached?.serviceId ?? attached?.ServiceId ?? serviceId,
          serviceName:
            attached?.serviceName ??
            attached?.ServiceName ??
            selected?.name ??
            selected?.Name ??
            prev.serviceName ??
            prev.ServiceName ??
            "",
          servicePrice:
            attached?.servicePrice ??
            attached?.ServicePrice ??
            selected?.price ??
            selected?.Price ??
            prev.servicePrice ??
            prev.ServicePrice ??
            null,
        };
      });
      showNotif("success", "Shërbimi u lidh me rastin.");
    } catch (e) {
      showNotif(
        "error",
        e.response?.data?.message || e.response?.data || "Dështoi lidhja e shërbimit me rastin."
      );
    } finally {
      setServiceSubmitting(false);
    }
  };

  const canEditVitals = isAuthenticated;
  const canEditReportAndStatus = isAuthenticated;
  const rawStatus = caseData?.status ?? caseData?.Status;
  const caseStatus = normalizeCaseStatus(rawStatus);
  const allowedNextStatuses = caseData ? (STATUS_FLOW[caseStatus] || []) : [];
  const blockNewConsultation =
    !!otherConsultationCaseId && caseStatus !== "InConsultation";
  const withoutBlockedConsultation = (statuses) =>
    blockNewConsultation ? statuses.filter((s) => s !== "InConsultation") : statuses;
  const nurseNextStatuses = withoutBlockedConsultation(
    allowedNextStatuses.filter((s) => s === "InProgress" || s === "InConsultation")
  );
  const doctorNextStatuses = withoutBlockedConsultation(
    allowedNextStatuses.filter((s) => s === "InConsultation" || s === "Completed")
  );

  if (loading && !caseData) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center py-20">
        <svg
          className="animate-spin h-10 w-10 text-clinic-400"
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
  const attachedServiceName = caseData?.serviceName ?? caseData?.ServiceName ?? "";
  const attachedServicePrice = caseData?.servicePrice ?? caseData?.ServicePrice;
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
        <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-slate-200 pb-5">
          <button
            type="button"
            onClick={() => navigate("/dashboard/cases")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50 border border-slate-200"
          >
            <FiArrowLeft size={18} />
            Rastet
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 truncate">
              {patientDisplayName}
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
              Kartela e rastit
            </p>
          </div>
        </div>

        <PatientInfoCard
          patientDisplayName={patientDisplayName}
          patientGender={patientGender}
          patientPhone={patientPhone}
          caseStatus={caseData.status ?? caseData.Status}
        />

        {blockNewConsultation && (
          <p className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {SINGLE_CONSULTATION_MESSAGE}
          </p>
        )}

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
            services={services}
            servicesLoading={servicesLoading}
            selectedServiceId={selectedServiceId}
            setSelectedServiceId={setSelectedServiceId}
            serviceSubmitting={serviceSubmitting}
            handleAttachService={handleAttachService}
            attachedServiceName={attachedServiceName}
            attachedServicePrice={attachedServicePrice}
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
