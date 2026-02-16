import { jsPDF } from "jspdf";

// Colors (R, G, B) for jsPDF
const colors = {
  white: [255, 255, 255],
  slate50: [248, 250, 252],
  slate200: [226, 232, 240],
  slate500: [100, 116, 139],
  slate700: [51, 65, 85],
  slate900: [15, 23, 42],
  teal600: [13, 148, 136],
  teal700: [15, 118, 110],
  indigo600: [79, 70, 229],
  emerald600: [5, 150, 105],
  violet600: [124, 58, 237],
};

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("sq-AL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(dateString);
  }
}

function formatTime(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleTimeString("sq-AL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getReportData(caseData, clinicHeader = {}, doctorInfo = {}) {
  const patient = caseData?.patient || caseData?.Patient || {};
  const v = caseData?.latestVitals ?? caseData?.LatestVitals;
  const r = caseData?.medicalReport ?? caseData?.MedicalReport;
  const caseId = caseData?.id ?? caseData?.Id ?? "";

  const firstName = patient?.firstName ?? patient?.FirstName ?? caseData?.patientFirstName ?? caseData?.PatientFirstName ?? "";
  const lastName = patient?.lastName ?? patient?.LastName ?? caseData?.patientLastName ?? caseData?.PatientLastName ?? "";
  const patientName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const phone = patient?.phone ?? patient?.Phone ?? caseData?.patientPhone ?? caseData?.PatientPhone ?? "—";
  const gender = patient?.gender ?? patient?.Gender ?? patient?.sex ?? patient?.Sex ?? caseData?.patientGender ?? caseData?.PatientGender ?? "—";
  const dateOfBirth = patient?.dateOfBirth ?? patient?.DateOfBirth ?? caseData?.patientDateOfBirth ?? caseData?.PatientDateOfBirth ?? "";
  const address = patient?.address ?? patient?.Address ?? caseData?.patientAddress ?? caseData?.PatientAddress ?? "—";
  const idNumber = patient?.idNumber ?? patient?.IdNumber ?? patient?.personalId ?? patient?.PersonalId ?? caseData?.patientIdNumber ?? "—";

  const visitDate = caseData?.createdAt ?? caseData?.CreatedAt ?? caseData?.updatedAt ?? caseData?.UpdatedAt ?? new Date().toISOString();
  const reportNumber = caseId ? `MR-${caseId}` : "MR-________";
  const doctorName = doctorInfo?.name ?? "__________________";

  const weight = v?.weightKg ?? v?.WeightKg;
  const sys = v?.systolicPressure ?? v?.SystolicPressure;
  const dia = v?.diastolicPressure ?? v?.DiastolicPressure;
  const temp = v?.temperatureC ?? v?.TemperatureC;
  const hr = v?.heartRate ?? v?.HeartRate;
  const o2 = v?.oxygenSaturation ?? v?.OxygenSaturation ?? v?.spo2 ?? v?.SpO2;
  const resp = v?.respiratoryRate ?? v?.RespiratoryRate;
  const height = v?.heightCm ?? v?.HeightCm;

  return {
    clinic: {
      name: clinicHeader?.name || "Klinika / Spitali",
      address: clinicHeader?.address || "—",
      phone: clinicHeader?.phone || "—",
      email: clinicHeader?.email || "—",
      nui: clinicHeader?.nui || "—",
      logoBase64: clinicHeader?.logoBase64,
    },
    meta: {
      visitDate: formatDate(visitDate),
      visitTime: formatTime(visitDate),
      reportNumber,
      doctorName,
    },
    patient: {
      name: patientName,
      dateOfBirth: formatDate(dateOfBirth),
      gender: gender || "—",
      phone: phone || "—",
      address: address || "—",
      idNumber: idNumber || "—",
    },
    vitals: {
      temp: temp != null ? String(temp) : "—",
      sys: sys != null ? String(sys) : "—",
      dia: dia != null ? String(dia) : "—",
      hr: hr != null ? String(hr) : "—",
      o2: o2 != null ? String(o2) : "—",
      resp: resp != null ? String(resp) : "—",
      weight: weight != null ? String(weight) : "—",
      height: height != null ? String(height) : "—",
    },
    diagnosis: r?.diagnosis ?? r?.Diagnosis ?? "—",
    therapy: r?.therapy ?? r?.Therapy ?? "—",
    notes: r?.notes ?? r?.Notes ?? "",
  };
}

function drawHeader(doc, data, margin, pageWidth, yRef) {
  let y = yRef.current;
  const leftW = pageWidth * 0.58;

  if (data.clinic.logoBase64) {
    try {
      const format = data.clinic.logoBase64.indexOf("image/png") !== -1 ? "PNG" : "JPEG";
      doc.addImage(data.clinic.logoBase64, format, margin, y, 14, 14);
    } catch (_) {}
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.teal700);
  doc.text(data.clinic.name, margin + 16, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.slate500);
  y += 8;
  doc.text(data.clinic.address, margin + 16, y);
  y += 4;
  doc.text(`Tel: ${data.clinic.phone}  |  Email: ${data.clinic.email}`, margin + 16, y);
  y += 4;
  doc.text(`NUI / Licence: ${data.clinic.nui}`, margin + 16, y);
  y += 8;

  const metaX = margin + leftW;
  doc.setDrawColor(...colors.slate200);
  doc.setFillColor(...colors.slate50);
  doc.roundedRect(metaX, yRef.current, pageWidth - leftW - margin, 28, 2, 2, "FD");
  doc.setFontSize(10);
  doc.setTextColor(...colors.slate700);
  doc.setFont("helvetica", "bold");
  doc.text("Data e raportit", metaX + 4, yRef.current + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.slate900);
  doc.text(`Data: ${data.meta.visitDate}  Ora: ${data.meta.visitTime}`, metaX + 4, yRef.current + 12);
  doc.text(`Nr. Raportit: ${data.meta.reportNumber}`, metaX + 4, yRef.current + 17);
  doc.text(`Mjeku: ${data.meta.doctorName}`, metaX + 4, yRef.current + 22);

  y = Math.max(y, yRef.current + 28);
  doc.setDrawColor(...colors.slate200);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  yRef.current = y + 8;
}

function drawSectionTitle(doc, title, margin, pageWidth, yRef, accentColor) {
  doc.setFillColor(...(accentColor || colors.teal600));
  doc.rect(margin, yRef.current, 4, 8, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.slate900);
  doc.text(title, margin + 6, yRef.current + 5.5);
  yRef.current += 10;
}

function drawPatientCard(doc, data, margin, pageWidth, yRef) {
  drawSectionTitle(doc, "Informacionet e pacientit", margin, pageWidth, yRef, colors.teal600);
  const cardW = pageWidth - 2 * margin;
  const keyW = 48;
  const valX = margin + keyW + 4;
  const valW = cardW - keyW - 12;
  const rows = [
    ["Emri dhe Mbiemri", data.patient.name],
    ["Datëlindja", data.patient.dateOfBirth],
    ["Gjinia", data.patient.gender],
    ["Nr. Telefonit", data.patient.phone],
    ["Adresa", data.patient.address],
    ["Nr. Identifikues", data.patient.idNumber],
  ];
  doc.setDrawColor(...colors.slate200);
  doc.setFillColor(...colors.slate50);
  doc.roundedRect(margin, yRef.current, cardW, 42, 1, 1, "FD");
  doc.setFontSize(9);
  let y = yRef.current + 5;
  rows.forEach(([label, value]) => {
    doc.setTextColor(...colors.slate500);
    doc.text(label, margin + 4, y);
    doc.setTextColor(...colors.slate900);
    doc.setFont("helvetica", "normal");
    const valStr = doc.splitTextToSize(value || "—", valW);
    doc.text(valStr[0] || "—", valX, y);
    y += 7;
  });
  yRef.current = y + 4;
}

function drawVitalsCard(doc, data, margin, pageWidth, yRef) {
  drawSectionTitle(doc, "Shenjat vitale", margin, pageWidth, yRef, colors.indigo600);
  const vitals = [
    ["Temperatura", data.vitals.temp, "°C"],
    ["Tensioni", `${data.vitals.sys}/${data.vitals.dia}`, "mmHg"],
    ["Pulsi", data.vitals.hr, "bpm"],
    ["O₂", data.vitals.o2, "%"],
    ["Frymëmarrja", data.vitals.resp, "/min"],
    ["Pesha / Gjatësia", `${data.vitals.weight} / ${data.vitals.height}`, "kg / cm"],
  ];
  const cellW = (pageWidth - 2 * margin - 12) / 3;
  const cellH = 14;
  doc.setFontSize(8);
  vitals.forEach(([label, value, unit], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + 4 + col * (cellW + 4);
    const y = yRef.current + row * (cellH + 4);
    doc.setDrawColor(...colors.slate200);
    doc.setFillColor(...colors.slate50);
    doc.roundedRect(x, y, cellW, cellH, 1, 1, "FD");
    doc.setTextColor(...colors.slate500);
    doc.text(label, x + 2, y + 4);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.slate900);
    doc.setFontSize(10);
    doc.text(String(value), x + 2, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...colors.slate500);
    doc.text(unit, x + 2, y + 12);
  });
  doc.setFontSize(9);
  yRef.current += 2 * (cellH + 4) + 6;
}

function drawTextBox(doc, title, content, margin, pageWidth, yRef, titleColor) {
  drawSectionTitle(doc, title, margin, pageWidth, yRef, titleColor);
  const boxW = pageWidth - 2 * margin;
  const lineHeight = 5;
  const lines = doc.splitTextToSize(content || "—", boxW - 8);
  const boxH = Math.max(20, lines.length * lineHeight + 8);
  doc.setDrawColor(...colors.slate200);
  doc.setFillColor(...colors.white);
  doc.roundedRect(margin, yRef.current, boxW, boxH, 1, 1, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.slate900);
  let y = yRef.current + 6;
  lines.forEach((line) => {
    doc.text(line, margin + 4, y);
    y += lineHeight;
  });
  yRef.current += boxH + 6;
}

function drawFooter(doc, margin, pageWidth, pageHeight, yRef) {
  const footerY = pageHeight - 22;
  if (yRef.current < footerY - 5) yRef.current = footerY - 5;
  doc.setDrawColor(...colors.slate200);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFontSize(8);
  doc.setTextColor(...colors.slate500);
  doc.text(
    "Ky raport është dokument mjekësor dhe është i vlefshëm vetëm me nënshkrim dhe vulë.",
    margin,
    footerY + 6
  );
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.slate700);
  doc.text("Nënshkrimi / Vula i mjekut:", margin, footerY + 12);
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(...colors.slate500);
  doc.line(margin + 52, footerY + 11, pageWidth - margin - 10, footerY + 11);
}

/**
 * Generate and download a PDF report using jsPDF only (no HTML).
 */
export function downloadCaseReportPdf(caseData, clinicHeader = null, doctorInfo = null) {
  const data = getReportData(caseData, clinicHeader || {}, doctorInfo || {});
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const yRef = { current: 18 };

  drawHeader(doc, data, margin, pageWidth, yRef);
  drawPatientCard(doc, data, margin, pageWidth, yRef);
  drawVitalsCard(doc, data, margin, pageWidth, yRef);
  drawTextBox(doc, "Diagnoza", data.diagnosis, margin, pageWidth, yRef, colors.emerald600);
  drawTextBox(doc, "Terapia", data.therapy, margin, pageWidth, yRef, colors.violet600);
  if (data.notes) {
    drawTextBox(doc, "Vërejtje / Rekomandime", data.notes, margin, pageWidth, yRef, colors.slate700);
  }
  drawFooter(doc, margin, pageWidth, pageHeight, yRef);

  const patientName = data.patient.name.replace(/\s+/g, "_") || "report";
  const filename = `raport_${patientName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Download case report PDF with clinic header from API.
 */
export async function downloadCaseReportPdfWithClinicHeader(caseData, doctorInfo = null) {
  const { getClinicProfile, getLogoAsBase64 } = await import("../api/clinic");
  let clinicHeader = {};
  try {
    const profile = await getClinicProfile();
    const name = profile?.name ?? profile?.Name ?? "";
    const address = profile?.address ?? profile?.Address ?? "";
    const phone = profile?.phone ?? profile?.Phone ?? "";
    const email = profile?.email ?? profile?.Email ?? "";
    const nui = profile?.nui ?? profile?.Nui ?? profile?.licenseNumber ?? profile?.LicenseNumber ?? "";
    const logoUrl = profile?.logoUrl ?? profile?.LogoUrl;
    const logoBase64 = logoUrl ? await getLogoAsBase64(logoUrl) : null;
    clinicHeader = { name, address, phone, email, nui, logoBase64 };
  } catch (_) {}
  downloadCaseReportPdf(caseData, clinicHeader, doctorInfo);
}
