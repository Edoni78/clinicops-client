import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Notification from "../../../components/ui/Notification";
import {
  getPatientCase,
  submitVitals,
  submitReport,
  updateCaseStatus,
  updateCaseProtocol,
  attachServiceToCase,
  getLabResults,
  uploadLabResult,
  downloadLabResultFile,
} from "../../../api/patientCase";
import { listServices } from "../../../api/service";
import {
  getDoctorProfile,
  getDoctorSignoff,
  getDoctorImageFullUrl,
} from "../../../api/doctorProfile";
import {
  downloadCaseReportPdfFromBackend,
  printCaseReportPdfFromBackend,
} from "../../../utils/caseReportPdf";
import { useAuth } from "../../../context/AuthContext";
import { useSignalR } from "../../../context/SignalRContext";
import { CLINIC_MODE_SOLO_DOCTOR } from "../../../utils/clinicMode";
import { isClinicAdminRole } from "../../../utils/dashboardMenu";
import { normalizeCaseStatus } from "./caseStatus";
import {
  buildVitalsSubmitBody,
  parseVitalPreferences,
} from "../../../utils/vitalPreferences";
import {
  canEditProtocolOnCase,
  getCaseProtocolNumber,
  hasCaseProtocolNumber,
  isProtocolRequired,
  parseProtocolPreferences,
  protocolMissingMessage,
} from "../../../utils/protocolPreferences";
import { fmtEmrDateOnly, getGenderLabel } from "../../../utils/emrDisplay";
import PatientInfoCard from "./components/PatientInfoCard";
import NurseSection from "./components/NurseSection";
import DoctorSection from "./components/DoctorSectionSimple";
import LabResultsSection from "./components/LabResultsSection";
import CaseProtocolSection from "./components/CaseProtocolSection";

export default function CaseDetail() {
  const { id, view } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role, clinicMode } = useAuth();
  const currentRole = String(role || "").toLowerCase();
  const isDoctor = currentRole === "doctor";
  const isNurse = currentRole === "nurse";
  const isSoloDoctorClinic = clinicMode === CLINIC_MODE_SOLO_DOCTOR;
  const isSoloClinicAdmin = isSoloDoctorClinic && isClinicAdminRole(currentRole);
  const canUseOwnDoctorProfile = isDoctor || isSoloClinicAdmin;
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
  const [report, setReport] = useState({ anamneza: "", ekzaminimi: "", diagnosis: "", therapy: "" });
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
  const [protocolInput, setProtocolInput] = useState("");
  const [protocolSubmitting, setProtocolSubmitting] = useState(false);
  const [signoffPreview, setSignoffPreview] = useState({ signature: "", stamp: "" });

  const caseStatus = normalizeCaseStatus(
    caseData ? (caseData.status ?? caseData.Status) : "Waiting"
  );
  const visitClosed =
    caseStatus === "Finished" || caseStatus === "Mbyllur" || caseStatus === "Completed";
  const nurseReviewsOutcome = (isNurse || view === "nurse") && visitClosed;
  const showNurseSection = !isSoloDoctorClinic && !isDoctor && view !== "doctor";
  const showDoctorSection = isSoloDoctorClinic || view !== "nurse" || nurseReviewsOutcome;
  const canEditVitals =
    (isNurse || view === "nurse") && caseStatus === "Waiting" && isAuthenticated;
  const canEditReportAndStatus =
    isAuthenticated &&
    !visitClosed &&
    (isDoctor || isSoloDoctorClinic || (view === "doctor" && !isNurse));
  const canCloseCase =
    caseStatus === "Finished" && (isNurse || view === "nurse" || isSoloDoctorClinic);

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
          ekzaminimi: r.ekzaminimi ?? r.Ekzaminimi ?? "",
          diagnosis: r.diagnosis ?? r.Diagnosis ?? "",
          therapy: r.therapy ?? r.Therapy ?? "",
        });
      }
      setProtocolInput(getCaseProtocolNumber(data));
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
      if (patientCaseId !== id) return;
      const v = vitalsDto || {};
      setCaseData((prev) => {
        if (!prev) return null;
        if (
          isDoctor &&
          normalizeCaseStatus(prev.status ?? prev.Status) !== "InConsultation"
        ) {
          return prev;
        }
        return { ...prev, latestVitals: v };
      });
      if (!isDoctor) {
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
          ekzaminimi: r.ekzaminimi ?? r.Ekzaminimi ?? prev.ekzaminimi,
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
  }, [
    id,
    connection,
    isDoctor,
    joinCase,
    onVitalsUpdated,
    onReportUpdated,
    onCaseStatusChanged,
  ]);

  useEffect(() => {
    if (!showDoctorSection || !canUseOwnDoctorProfile) return;
    let cancelled = false;
    setDoctorProfileLoading(true);
    getDoctorProfile()
      .then((data) => {
        if (!cancelled) {
          setDoctorProfile(data || null);
          setSignoffPreview({ signature: "", stamp: "" });
        }
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
  }, [showDoctorSection, canUseOwnDoctorProfile]);

  useEffect(() => {
    if (!showDoctorSection || canUseOwnDoctorProfile) return;
    const assignedId = caseData?.assignedDoctorUserId ?? caseData?.AssignedDoctorUserId;
    if (!assignedId) return;
    let cancelled = false;
    setDoctorProfileLoading(true);
    getDoctorSignoff(assignedId)
      .then((data) => {
        if (cancelled) return;
        setDoctorProfile(null);
        setSignoffPreview({
          signature: data?.signatureBase64 || "",
          stamp: data?.stampBase64 || "",
        });
      })
      .catch(() => {
        if (!cancelled) setSignoffPreview({ signature: "", stamp: "" });
      })
      .finally(() => {
        if (!cancelled) setDoctorProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    showDoctorSection,
    canUseOwnDoctorProfile,
    caseData?.assignedDoctorUserId,
    caseData?.AssignedDoctorUserId,
  ]);

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

  const vitalPreferences = parseVitalPreferences(caseData);
  const protocolPreferences = parseProtocolPreferences(
    caseData?.protocolPreferences ?? caseData?.ProtocolPreferences ?? caseData
  );
  const protocolNumber = getCaseProtocolNumber(caseData);
  const canEditProtocol =
    caseData && canEditProtocolOnCase(protocolPreferences, currentRole);
  const caseFinished = visitClosed;

  const assertProtocolBeforeFinish = () => {
    if (!isProtocolRequired(protocolPreferences)) return true;
    if (hasCaseProtocolNumber(caseData) || protocolInput.trim()) return true;
    showNotif("error", protocolMissingMessage());
    return false;
  };

  const persistProtocolIfNeeded = async () => {
    if (!canEditProtocol || visitClosed) return;
    const value = protocolInput.trim();
    if (!value || value === (protocolNumber || "").trim()) return;
    setProtocolSubmitting(true);
    try {
      const res = await updateCaseProtocol(id, value);
      const saved = res?.protocolNumber ?? res?.ProtocolNumber ?? value;
      setCaseData((prev) =>
        prev ? { ...prev, protocolNumber: saved, ProtocolNumber: saved } : null
      );
      setProtocolInput(saved);
    } finally {
      setProtocolSubmitting(false);
    }
  };

  const sendCaseToDoctor = async ({ saveVitals }) => {
    if (vitalsSubmitting || statusSubmitting) return;
    setVitalsSubmitting(true);
    setStatusSubmitting(true);
    try {
      if (saveVitals) {
        const body = buildVitalsSubmitBody(vitals, vitalPreferences);
        if (!body) {
          showNotif(
            "error",
            "Plotësoni të paktën një shenjë vitale, ose dërgoni pa shenja."
          );
          return;
        }
        const dto = await submitVitals(id, body);
        setCaseData((prev) => (prev ? { ...prev, latestVitals: dto } : null));
      }
      await persistProtocolIfNeeded();
      await updateCaseStatus(id, "InConsultation");
      navigate("/dashboard/cases", {
        state: { notice: "Pacienti u dërgua te mjeku.", noticeType: "success" },
      });
    } catch (err) {
      showNotif(
        "error",
        err.response?.data?.message || err.response?.data || "Dështoi dërgimi te mjeku."
      );
    } finally {
      setVitalsSubmitting(false);
      setStatusSubmitting(false);
    }
  };

  const handleSubmitVitals = (e) => {
    e.preventDefault();
    sendCaseToDoctor({ saveVitals: true });
  };

  const handleSkipVitals = () => {
    sendCaseToDoctor({ saveVitals: false });
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!report.diagnosis.trim() || !report.therapy.trim()) {
      showNotif("error", "Diagnoza dhe terapia janë të detyrueshme.");
      return;
    }
    if (!assertProtocolBeforeFinish()) return;
    if (!isSoloDoctorClinic && caseStatus !== "InConsultation") {
      showNotif("error", "Pacienti duhet të jetë në konsultim para se të përfundoni vizitën.");
      return;
    }
    setReportSubmitting(true);
    setStatusSubmitting(true);
    try {
      await persistProtocolIfNeeded();
      await submitReport(id, {
        anamneza: (report.anamneza || "").trim(),
        ekzaminimi: (report.ekzaminimi || "").trim(),
        diagnosis: report.diagnosis.trim(),
        therapy: report.therapy.trim(),
      });
      let finished = false;
      if (isSoloDoctorClinic) {
        try {
          await updateCaseStatus(id, "Finished");
          finished = true;
        } catch {
          const fallbackFlow = ["InConsultation", "Finished"];
          for (const next of fallbackFlow) {
            try {
              await updateCaseStatus(id, next);
            } catch {
              // Continue trying remaining steps.
            }
          }
          const latest = await getPatientCase(id);
          finished = normalizeCaseStatus(latest?.status ?? latest?.Status) === "Finished";
        }
        if (finished) {
          try {
            await updateCaseStatus(id, "Mbyllur");
          } catch {
            // The visit report is saved. Closing can still be done from Raportet.
          }
        }
      } else {
        await updateCaseStatus(id, "Finished");
        finished = true;
      }
      if (finished) {
        navigate("/dashboard/cases", {
          state: {
            notice: isSoloDoctorClinic
              ? "Raporti u ruajt dhe rasti u mbyll."
              : "Vizitë e përfunduar. Infermieri e sheh te «Për mbyllje».",
            noticeType: "success",
          },
        });
        return;
      }
      showNotif("success", "Raporti u ruajt.");
    } catch (err) {
      showNotif(
        "error",
        err.response?.data?.message || err.response?.data || "Dështoi përfundimi i vizitës."
      );
    } finally {
      setReportSubmitting(false);
      setStatusSubmitting(false);
    }
  };

  const handleCloseCase = async () => {
    if (statusSubmitting) return;
    setStatusSubmitting(true);
    try {
      await updateCaseStatus(id, "Mbyllur");
      navigate("/dashboard/cases", {
        state: { notice: "Rasti u mbyll.", noticeType: "success" },
      });
    } catch (err) {
      showNotif(
        "error",
        err.response?.data?.message || err.response?.data || "Dështoi mbyllja e rastit."
      );
    } finally {
      setStatusSubmitting(false);
    }
  };

  const pdfErrorMessage = (e, fallback) =>
    e.response?.status === 404
      ? "Rasti nuk u gjet ose nuk është në klinikën tuaj."
      : e.response?.data?.message || e.message || fallback;

  const handleDownloadReportPdf = async () => {
    try {
      await downloadCaseReportPdfFromBackend(id);
      showNotif("success", "Raporti u shkarkua.");
    } catch (e) {
      showNotif("error", pdfErrorMessage(e, "Dështoi shkarkimi i raportit."));
    }
  };

  const handlePrintReportPdf = async () => {
    try {
      await printCaseReportPdfFromBackend(id);
    } catch (e) {
      showNotif("error", pdfErrorMessage(e, "Dështoi printimi i raportit."));
    }
  };

  const handleAttachService = async (serviceIdArg) => {
    const serviceId = String(serviceIdArg ?? selectedServiceId ?? "").trim();
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
    } catch (e) {
      showNotif(
        "error",
        e.response?.data?.message || e.response?.data || "Dështoi lidhja e shërbimit me rastin."
      );
    } finally {
      setServiceSubmitting(false);
    }
  };

  if (loading && !caseData) {
    return (
      <div className="page-shell flex justify-center py-20">
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
      <div className="page-shell">
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
  const patientGenderRaw =
    patient.gender ??
    patient.Gender ??
    patient.sex ??
    patient.Sex ??
    caseData.patientGender ??
    caseData.PatientGender ??
    caseData.patientSex ??
    caseData.PatientSex ??
    (caseData.Patient && (caseData.Patient.gender ?? caseData.Patient.Gender)) ??
    "";
  const patientGender = getGenderLabel(patientGenderRaw);
  const patientDob =
    patient.dateOfBirth ?? patient.DateOfBirth ?? caseData.patientDateOfBirth ?? caseData.PatientDateOfBirth;
  const signaturePath = doctorProfile?.signatureUrl ?? doctorProfile?.SignatureUrl;
  const stampPath = doctorProfile?.stampUrl ?? doctorProfile?.StampUrl;
  const signaturePreviewUrl = signoffPreview.signature || getDoctorImageFullUrl(signaturePath);
  const stampPreviewUrl = signoffPreview.stamp || getDoctorImageFullUrl(stampPath);
  const assignedDoctorName =
    caseData?.assignedDoctorName ?? caseData?.AssignedDoctorName ?? "";
  const attachedServiceName = caseData?.serviceName ?? caseData?.ServiceName ?? "";
  const attachedServicePrice = caseData?.servicePrice ?? caseData?.ServicePrice;
  const formatDateDisplay = fmtEmrDateOnly;

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((prev) => ({ ...prev, visible: false }))}
      />

      <div className="page-shell">
        <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/cases")}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-50 border border-slate-200 text-sm"
          >
            <FiArrowLeft size={18} />
            Rastet
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
              {patientDisplayName}
            </h1>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">
              Kartela e rastit
            </p>
          </div>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1.85fr)_minmax(280px,1fr)] gap-3 items-start">
          <div className="order-2 xl:order-1 min-w-0">
        <CaseProtocolSection
          protocolPreferences={protocolPreferences}
          protocolNumber={protocolNumber}
          protocolInput={protocolInput}
          setProtocolInput={setProtocolInput}
          canEdit={canEditProtocol}
          protocolSubmitting={protocolSubmitting}
          caseFinished={caseFinished}
        />

        {nurseReviewsOutcome && showDoctorSection && (
          <DoctorSection
            isSoloDoctorClinic={isSoloDoctorClinic}
            latestVitals={latestVitals}
            vitalPreferences={vitalPreferences}
            statusSubmitting={statusSubmitting}
            handleDownloadReportPdf={handleDownloadReportPdf}
            handlePrintReportPdf={handlePrintReportPdf}
            canCloseCase={canCloseCase}
            onCloseCase={handleCloseCase}
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
            showRecordedVitals={false}
          />
        )}

        {showNurseSection && (
          <NurseSection
            canEditVitals={canEditVitals}
            vitals={vitals}
            setVitals={setVitals}
            handleSubmitVitals={handleSubmitVitals}
            handleSkipVitals={handleSkipVitals}
            vitalsSubmitting={vitalsSubmitting || statusSubmitting}
            latestVitals={latestVitals}
            vitalPreferences={vitalPreferences}
            caseStatus={caseStatus}
          />
        )}

        {!nurseReviewsOutcome && showDoctorSection && (
          <DoctorSection
            isSoloDoctorClinic={isSoloDoctorClinic}
            latestVitals={latestVitals}
            vitalPreferences={vitalPreferences}
            statusSubmitting={statusSubmitting}
            handleDownloadReportPdf={handleDownloadReportPdf}
            handlePrintReportPdf={handlePrintReportPdf}
            canCloseCase={canCloseCase}
            onCloseCase={handleCloseCase}
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
          <aside className="order-1 xl:order-2 xl:sticky xl:top-0">
            <PatientInfoCard
              patientDisplayName={patientDisplayName}
              patientGender={patientGender}
              patientPhone={patientPhone}
              caseStatus={caseData.status ?? caseData.Status}
              assignedDoctorName={assignedDoctorName}
              protocolNumber={protocolNumber}
            />
          </aside>
        </div>
      </div>
    </>
  );
}
