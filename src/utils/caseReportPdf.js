import { jsPDF } from "jspdf";

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

/**
 * Draw clinic header (logo + name, address, phone) at top of PDF.
 * @param {jsPDF} doc
 * @param {{ name?: string, address?: string, phone?: string, logoBase64?: string }} clinicHeader
 * @returns {number} y position after header (mm)
 */
function drawClinicHeader(doc, clinicHeader) {
  if (!clinicHeader) return 20;
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoSize = 18;
  let y = 18;

  if (clinicHeader.logoBase64) {
    try {
      const data = clinicHeader.logoBase64;
      const format = data.indexOf("image/png") !== -1 ? "PNG" : "JPEG";
      doc.addImage(data, format, margin, y, logoSize, logoSize);
    } catch {
      // ignore invalid image (e.g. WebP not supported in this jsPDF build)
    }
  }

  const textX = margin + logoSize + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const name = clinicHeader.name || "";
  doc.text(name, textX, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let lineY = y + 10;
  if (clinicHeader.address) {
    const addrLines = doc.splitTextToSize(clinicHeader.address, pageWidth - textX - margin);
    doc.text(addrLines, textX, lineY);
    lineY += addrLines.length * 4 + 2;
  }
  if (clinicHeader.phone) {
    doc.text(clinicHeader.phone, textX, lineY);
    lineY += 5;
  }
  y = Math.max(y + logoSize, lineY) + 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  return y + 8;
}

/**
 * Generate and download a PDF report for a patient case.
 * @param {Object} caseData - Full case detail (patient, latestVitals, medicalReport, etc.)
 * @param {{ name?: string, address?: string, phone?: string, logoBase64?: string }} [clinicHeader] - Optional clinic header (logo as data URL, name, address, phone)
 */
export function downloadCaseReportPdf(caseData, clinicHeader = null) {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const margin = 18;
  let y = drawClinicHeader(doc, clinicHeader);
  const lineHeight = 7;
  const sectionGap = 10;

  const patient = caseData?.patient || caseData?.Patient || {};
  const v = caseData?.latestVitals ?? caseData?.LatestVitals;
  const r = caseData?.medicalReport ?? caseData?.MedicalReport;

  const firstName =
    patient?.firstName ?? patient?.FirstName ?? caseData?.patientFirstName ?? caseData?.PatientFirstName ?? "";
  const lastName =
    patient?.lastName ?? patient?.LastName ?? caseData?.patientLastName ?? caseData?.PatientLastName ?? "";
  const patientName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const phone =
    patient?.phone ?? patient?.Phone ?? caseData?.patientPhone ?? caseData?.PatientPhone ?? "";
  const gender =
    patient?.gender ??
    patient?.Gender ??
    patient?.sex ??
    patient?.Sex ??
    caseData?.patientGender ??
    caseData?.PatientGender ??
    caseData?.patientSex ??
    caseData?.PatientSex ??
    (caseData?.Patient && (caseData.Patient.gender ?? caseData.Patient.Gender)) ??
    "";
  const dateOfBirth =
    patient?.dateOfBirth ?? patient?.DateOfBirth ?? caseData?.patientDateOfBirth ?? caseData?.PatientDateOfBirth ?? "";
  const status = caseData?.status ?? caseData?.Status ?? "";

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Medical Report", margin, y);
  y += lineHeight + 4;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, margin, y);
  y += lineHeight + sectionGap;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Patient information", margin, y);
  y += lineHeight;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${patientName}`, margin, y);
  y += lineHeight;
  doc.text(`Gender: ${gender || "—"}`, margin, y);
  y += lineHeight;
  doc.text(`Mobile number: ${phone || "—"}`, margin, y);
  y += lineHeight;
  doc.text(`Date of birth: ${formatDate(dateOfBirth)}`, margin, y);
  y += lineHeight;
  doc.text(`Case status: ${status || "—"}`, margin, y);
  y += lineHeight + sectionGap;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Vital signs", margin, y);
  y += lineHeight;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const weight = v?.weightKg ?? v?.WeightKg;
  const sys = v?.systolicPressure ?? v?.SystolicPressure;
  const dia = v?.diastolicPressure ?? v?.DiastolicPressure;
  const temp = v?.temperatureC ?? v?.TemperatureC;
  const hr = v?.heartRate ?? v?.HeartRate;
  doc.text(`Weight: ${weight != null ? `${weight} kg` : "—"}`, margin, y);
  y += lineHeight;
  doc.text(`Blood pressure: ${sys != null && dia != null ? `${sys}/${dia} mmHg` : "—"}`, margin, y);
  y += lineHeight;
  doc.text(`Temperature: ${temp != null ? `${temp} °C` : "—"}`, margin, y);
  y += lineHeight;
  doc.text(`Heart rate: ${hr != null ? `${hr} bpm` : "—"}`, margin, y);
  y += lineHeight + sectionGap;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Diagnosis", margin, y);
  y += lineHeight;
  doc.setFont("helvetica", "normal");
  const diagnosis = r?.diagnosis ?? r?.Diagnosis ?? "—";
  const diagnosisLines = doc.splitTextToSize(diagnosis, 180);
  doc.text(diagnosisLines, margin, y);
  y += diagnosisLines.length * lineHeight + sectionGap;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Therapy", margin, y);
  y += lineHeight;
  doc.setFont("helvetica", "normal");
  const therapy = r?.therapy ?? r?.Therapy ?? "—";
  const therapyLines = doc.splitTextToSize(therapy, 180);
  doc.text(therapyLines, margin, y);

  const filename = `report_${patientName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Download case report PDF with clinic header (logo + name, address, phone) when the user has a clinic.
 * If clinic profile is not available (e.g. SuperAdmin), falls back to PDF without header.
 * Logo is fetched via the authenticated API so it works with the same origin/CORS setup.
 * @param {Object} caseData - Full case detail
 */
export async function downloadCaseReportPdfWithClinicHeader(caseData) {
  const { getClinicProfile, getLogoAsBase64 } = await import("../api/clinic");
  let clinicHeader = null;
  try {
    const profile = await getClinicProfile();
    const name = profile?.name ?? profile?.Name ?? "";
    const address = profile?.address ?? profile?.Address ?? "";
    const phone = profile?.phone ?? profile?.Phone ?? "";
    const logoUrl = profile?.logoUrl ?? profile?.LogoUrl;
    const logoBase64 = logoUrl ? await getLogoAsBase64(logoUrl) : null;
    clinicHeader = { name, address, phone, logoBase64 };
  } catch {
    // No clinic (e.g. SuperAdmin) or API error: proceed without header
  }
  downloadCaseReportPdf(caseData, clinicHeader);
}
