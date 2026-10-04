import { jsPDF } from "jspdf";
import { getCaseReportPdf } from "../api/patientCase";
import { getGenderLabel } from "./emrDisplay";

const MARGIN = 12;
const FOOTER_GAP = 14;
const INK = [23, 32, 51];
const LABEL = [32, 43, 60];
const BLUE = [17, 135, 207];
const LINE = [19, 133, 199];
const TITLE = [18, 25, 42];
const SECTION = [7, 89, 155];
const BAR = [214, 235, 248];
const DIVIDER = [52, 149, 209];
const WATERMARK_OPACITY = 0.045;

function clean(value) {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text || text === "null" || text === "undefined") return "";
  return text;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

function formatTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function imageFormat(dataUrl) {
  const head = String(dataUrl || "").slice(0, 48).toLowerCase();
  if (head.includes("image/png")) return "PNG";
  if (head.includes("image/webp")) return "WEBP";
  return "JPEG";
}

function loadHtmlImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = src;
  });
}

function withImageMime(dataUrl) {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl;
  let header = "";
  try {
    header = atob(dataUrl.slice(comma + 1, comma + 24));
  } catch {
    return dataUrl;
  }
  const bytes = dataUrl.slice(comma + 1);
  if (header.charCodeAt(0) === 0x89 && header.slice(1, 4) === "PNG") return `data:image/png;base64,${bytes}`;
  if (header.charCodeAt(0) === 0xff && header.charCodeAt(1) === 0xd8) return `data:image/jpeg;base64,${bytes}`;
  return dataUrl;
}

/** Keep PNG transparency. Convert formats jsPDF cannot embed into PNG. */
export async function normalizeReportImage(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const typed = withImageMime(dataUrl);
  const head = typed.slice(0, 64).toLowerCase();
  if (head.startsWith("data:image/png") || head.startsWith("data:image/jpeg") || head.startsWith("data:image/jpg")) {
    return typed;
  }
  if (typeof document === "undefined") return null;
  try {
    const image = await loadHtmlImage(dataUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function imageSize(doc, dataUrl, maxW, maxH) {
  if (!dataUrl) return null;
  try {
    const props = doc.getImageProperties(dataUrl);
    const ratio = props.width / Math.max(props.height, 1);
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
    return { w, h };
  } catch {
    return null;
  }
}

function paintImage(doc, dataUrl, x, y, w, h) {
  if (!dataUrl || w <= 0 || h <= 0) return false;
  try {
    doc.addImage(dataUrl, imageFormat(dataUrl), x, y, w, h);
    return true;
  } catch {
    return false;
  }
}

/** Same placement rules as the clinic logo: keep the ratio, never invent a broken box. */
function drawReportImage(doc, dataUrl, x, y, maxW, maxH) {
  const size = imageSize(doc, dataUrl, maxW, maxH);
  if (!size) return null;
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 1 }));
  const painted = paintImage(doc, dataUrl, x, y, size.w, size.h);
  doc.restoreGraphicsState();
  return painted ? size : null;
}

function doctorLine(name) {
  const text = clean(name);
  if (!text) return "";
  if (/^dr\b/i.test(text)) return text;
  return `Dr. ${text}`;
}

function getReportData(caseData, clinicHeader = {}, doctorInfo = {}) {
  const patient = caseData?.patient || caseData?.Patient || {};
  const vitals = caseData?.latestVitals ?? caseData?.LatestVitals;
  const report = caseData?.medicalReport ?? caseData?.MedicalReport;
  const firstName = clean(patient?.firstName ?? patient?.FirstName ?? caseData?.patientFirstName ?? caseData?.PatientFirstName);
  const lastName = clean(patient?.lastName ?? patient?.LastName ?? caseData?.patientLastName ?? caseData?.PatientLastName);
  const genderRaw = clean(patient?.gender ?? patient?.Gender ?? caseData?.patientGender ?? caseData?.PatientGender);
  const visitAt = caseData?.createdAt ?? caseData?.CreatedAt ?? "";
  const weight = vitals?.weightKg ?? vitals?.WeightKg;
  const systolic = vitals?.systolicPressure ?? vitals?.SystolicPressure;
  const diastolic = vitals?.diastolicPressure ?? vitals?.DiastolicPressure;
  const temperature = vitals?.temperatureC ?? vitals?.TemperatureC;
  const heartRate = vitals?.heartRate ?? vitals?.HeartRate;

  const vitalRows = [];
  if (systolic != null || diastolic != null) {
    const sys = systolic != null ? String(systolic) : "";
    const dia = diastolic != null ? String(diastolic) : "";
    const value = [sys, dia].filter(Boolean).join("/");
    if (value) vitalRows.push(["TA", `${value} mmHg`]);
  }
  if (heartRate != null && heartRate !== "") vitalRows.push(["Pulsi", `${heartRate}/min`]);
  if (temperature != null && temperature !== "") vitalRows.push(["Temperatura", `${temperature} °C`]);
  if (weight != null && weight !== "") vitalRows.push(["Pesha", `${weight} kg`]);

  const labFileNames = (Array.isArray(caseData?.labFileNames) ? caseData.labFileNames : [])
    .map((name) => clean(name))
    .filter(Boolean);

  return {
    clinic: {
      name: clean(clinicHeader?.name),
      address: clean(clinicHeader?.address),
      phone: clean(clinicHeader?.phone),
      email: clean(clinicHeader?.email),
      logoBase64: clinicHeader?.logoBase64 || null,
    },
    meta: {
      date: formatDate(visitAt),
      time: formatTime(visitAt),
      protocol: clean(caseData?.protocolNumber ?? caseData?.ProtocolNumber),
    },
    patient: {
      name: [firstName, lastName].filter(Boolean).join(" "),
      dateOfBirth: formatDate(patient?.dateOfBirth ?? patient?.DateOfBirth ?? caseData?.patientDateOfBirth ?? caseData?.PatientDateOfBirth),
      gender: genderRaw ? getGenderLabel(genderRaw) : "",
      phone: clean(patient?.phone ?? patient?.Phone ?? caseData?.patientPhone ?? caseData?.PatientPhone),
    },
    visit: {
      date: formatDate(visitAt),
      time: formatTime(visitAt),
      doctor: doctorLine(doctorInfo?.name || caseData?.assignedDoctorName || caseData?.AssignedDoctorName),
      service: clean(caseData?.serviceName ?? caseData?.ServiceName),
      protocol: clean(caseData?.protocolNumber ?? caseData?.ProtocolNumber),
    },
    visitNotes: clean(caseData?.notes ?? caseData?.Notes),
    vitals: vitalRows,
    anamneza: clean(report?.anamneza ?? report?.Anamneza),
    ekzaminimi: clean(report?.ekzaminimi ?? report?.Ekzaminimi),
    diagnosis: clean(report?.diagnosis ?? report?.Diagnosis),
    therapy: clean(report?.therapy ?? report?.Therapy),
    labFileNames,
    signoff: {
      name: doctorLine(doctorInfo?.name || caseData?.assignedDoctorName || caseData?.AssignedDoctorName),
      signatureBase64: doctorInfo?.signatureBase64 || null,
      stampBase64: doctorInfo?.stampBase64 || null,
    },
  };
}

function contentBottom(pageHeight) {
  return pageHeight - FOOTER_GAP;
}

function splitClinicName(name) {
  const parts = clean(name).split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { lead: "", main: parts[0] || "" };
  return { lead: parts[0], main: parts.slice(1).join(" ") };
}

function drawWatermark(doc, ctx) {
  if (!ctx.logo || ctx.watermarked.has(ctx.page)) return;
  const size = imageSize(doc, ctx.logo, 125, 125);
  if (!size) return;
  const x = (ctx.pageWidth - size.w) / 2;
  const y = (ctx.pageHeight - size.h) / 2;
  ctx.watermarked.add(ctx.page);
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: WATERMARK_OPACITY }));
  paintImage(doc, ctx.logo, x, y, size.w, size.h);
  doc.restoreGraphicsState();
}

function continuePage(doc, ctx) {
  doc.addPage();
  ctx.page += 1;
  ctx.y = MARGIN;
  drawWatermark(doc, ctx);
}

function ensure(doc, ctx, needed) {
  if (ctx.y + needed <= contentBottom(ctx.pageHeight)) return;
  if (needed > contentBottom(ctx.pageHeight) - MARGIN && ctx.y <= MARGIN + 0.5) return;
  continuePage(doc, ctx);
}

function drawHeader(doc, ctx, data) {
  const top = MARGIN;
  const logo = drawReportImage(doc, data.clinic.logoBase64, MARGIN, top, 23, 23);
  const nameX = MARGIN + (logo ? logo.w + 3 : 0);
  const contacts = [data.clinic.address, data.clinic.phone, data.clinic.email].filter(Boolean);
  const contactW = contacts.length ? 62 : 0;
  const contactX = ctx.pageWidth - MARGIN - contactW;
  const nameMax = Math.max(36, contactX - nameX - 4);
  const parts = splitClinicName(data.clinic.name);
  let nameBottom = top;

  doc.setTextColor(...BLUE);
  doc.setFont("helvetica", "bold");
  if (parts.lead) {
    doc.setFontSize(16);
    doc.text(doc.splitTextToSize(parts.lead, nameMax)[0], nameX, top + 8);
    doc.setFontSize(parts.main.length > 18 ? 16 : 20);
    const main = doc.splitTextToSize(parts.main, nameMax).slice(0, 2);
    doc.text(main, nameX, top + 16);
    nameBottom = top + 16 + main.length * 6;
  } else if (parts.main) {
    doc.setFontSize(18);
    const lines = doc.splitTextToSize(parts.main, nameMax).slice(0, 2);
    doc.text(lines, nameX, top + 12);
    nameBottom = top + 12 + lines.length * 7;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let contactY = top + 5;
  contacts.forEach((line) => {
    doc.setFillColor(...BLUE);
    doc.circle(contactX + 1.1, contactY - 0.9, 0.7, "F");
    doc.setTextColor(...INK);
    const wrapped = doc.splitTextToSize(line, contactW - 5).slice(0, 2);
    doc.text(wrapped, contactX + 4, contactY);
    contactY += wrapped.length * 3.5 + 1.4;
  });

  const headerBottom = Math.max(top + 25, nameBottom + 2, contactY + 1, logo ? top + logo.h : top);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.45);
  doc.line(MARGIN, headerBottom, ctx.pageWidth - MARGIN, headerBottom);
  ctx.y = headerBottom + 7;
}

function drawTitle(doc, ctx, data) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...TITLE);
  doc.text("RAPORT MJEKËSOR", ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 6;

  const bits = [];
  if (data.meta.date) bits.push(["Data:", data.meta.date]);
  if (data.meta.time) bits.push(["Ora:", data.meta.time]);
  if (data.meta.protocol) bits.push(["Nr. raportit:", data.meta.protocol]);
  if (!bits.length) {
    ctx.y += 2;
    return;
  }

  doc.setFontSize(9);
  const gap = 5;
  const dividerW = 4;
  const widths = bits.map(([label, value]) => {
    doc.setFont("helvetica", "normal");
    const labelW = doc.getTextWidth(`${label} `);
    doc.setFont("helvetica", "bold");
    return labelW + doc.getTextWidth(value);
  });
  const total = widths.reduce((sum, width) => sum + width, 0) + (bits.length - 1) * (gap * 2 + dividerW);
  let x = (ctx.pageWidth - total) / 2;
  bits.forEach(([label, value], index) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.text(`${label} `, x, ctx.y);
    x += doc.getTextWidth(`${label} `);
    doc.setFont("helvetica", "bold");
    doc.text(value, x, ctx.y);
    x += doc.getTextWidth(value);
    if (index < bits.length - 1) {
      x += gap;
      doc.setDrawColor(128, 144, 163);
      doc.setLineWidth(0.25);
      doc.line(x, ctx.y - 3, x, ctx.y + 0.6);
      x += dividerW + gap;
    }
  });
  ctx.y += 7;
}

function drawHeading(doc, ctx, title) {
  ensure(doc, ctx, 12);
  const width = ctx.pageWidth - MARGIN * 2;
  doc.setFillColor(...BAR);
  doc.rect(MARGIN, ctx.y - 3.4, width, 6.4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...SECTION);
  doc.text(title, MARGIN + 3, ctx.y);
  ctx.y += 5.2;
}

function drawProse(doc, ctx, text) {
  const width = ctx.pageWidth - MARGIN * 2 - 6;
  const lineH = 4.6;
  const paragraphs = String(text).replace(/\r\n/g, "\n").split("\n");
  paragraphs.forEach((paragraph) => {
    if (!paragraph.trim()) {
      ensure(doc, ctx, 3);
      ctx.y += 2;
      return;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.splitTextToSize(paragraph, width).forEach((line) => {
      ensure(doc, ctx, lineH);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.text(line, MARGIN + 3, ctx.y);
      ctx.y += lineH;
    });
  });
  ctx.y += 3.5;
}

function paintLabeled(doc, x, y, pair, width) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...LABEL);
  const label = `${pair[0]}: `;
  doc.text(label, x, y);
  const labelW = doc.getTextWidth(label);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  const value = doc.splitTextToSize(String(pair[1]), Math.max(16, width - labelW));
  doc.text(value[0] || "", x + labelW, y);
}

function drawSplit(doc, ctx, leftPairs, rightPairs, { divider = false } = {}) {
  const left = leftPairs.filter((pair) => clean(pair[1]));
  const right = rightPairs.filter((pair) => clean(pair[1]));
  if (!left.length && !right.length) return;
  const rows = Math.max(left.length, right.length);
  const rowH = 5.4;
  ensure(doc, ctx, rows * rowH);
  const mid = ctx.pageWidth / 2;
  const leftX = MARGIN + 3;
  const rightX = mid + 4;
  const colW = mid - MARGIN - 8;
  if (divider && left.length && right.length) {
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(0.3);
    doc.line(mid, ctx.y - 3.2, mid, ctx.y - 3.2 + rows * rowH);
  }
  for (let index = 0; index < rows; index += 1) {
    if (left[index]) paintLabeled(doc, leftX, ctx.y, left[index], colW);
    if (right[index]) paintLabeled(doc, rightX, ctx.y, right[index], colW);
    ctx.y += rowH;
  }
  ctx.y += 2.5;
}

function drawTextSection(doc, ctx, title, text) {
  if (!clean(text)) return;
  drawHeading(doc, ctx, title);
  drawProse(doc, ctx, text);
}

function drawVitals(doc, ctx, rows) {
  if (!rows.length) return;
  const byLabel = Object.fromEntries(rows);
  drawHeading(doc, ctx, "PARAMETRAT VITALË");
  drawSplit(
    doc,
    ctx,
    [
      ["TA", byLabel.TA],
      ["Temperatura", byLabel.Temperatura],
    ],
    [
      ["Pulsi", byLabel.Pulsi],
      ["Pesha", byLabel.Pesha],
    ],
    { divider: true }
  );
}

function drawLabs(doc, ctx, names) {
  if (!names.length) return;
  drawTextSection(doc, ctx, "LABORATORI", names.map((name) => `- ${name}`).join("\n"));
}

function drawSignoff(doc, ctx, data) {
  const signature = imageSize(doc, data.signoff.signatureBase64, 40, 18);
  const stamp = imageSize(doc, data.signoff.stampBase64, 32, 32);
  const name = data.signoff.name;
  if (!signature && !stamp && !name) return;

  const blockH = Math.max(36, stamp ? stamp.h + 4 : 0, signature ? 28 : 18);
  if (ctx.y > MARGIN + 1) ctx.y += 4;
  if (ctx.y + blockH > contentBottom(ctx.pageHeight)) continuePage(doc, ctx);
  const top = ctx.y;
  const bottom = top + blockH;

  if (stamp) {
    drawReportImage(doc, data.signoff.stampBase64, MARGIN + 8, bottom - stamp.h, 32, 32);
  }

  const columnW = 55;
  const columnX = ctx.pageWidth - MARGIN - 10 - columnW;
  const center = columnX + columnW / 2;
  let y = bottom - (signature ? signature.h + 14 : 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text("Mjeku përgjegjës", center, y, { align: "center" });
  y += 4.5;
  if (name) {
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(name, columnW);
    doc.text(lines.slice(0, 2), center, y, { align: "center" });
    y += lines.slice(0, 2).length * 4.2;
  }
  if (signature) {
    drawReportImage(
      doc,
      data.signoff.signatureBase64,
      center - signature.w / 2,
      y,
      40,
      18
    );
    y += signature.h - 1;
  }
  doc.setDrawColor(39, 54, 74);
  doc.setLineWidth(0.3);
  doc.line(center - 24, y, center + 24, y);
  ctx.y = bottom + 2;
}

function drawFooter(doc, ctx, data) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const y = ctx.pageHeight - 8;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.35);
    doc.line(MARGIN, y - 4, ctx.pageWidth - MARGIN, y - 4);
    doc.setFontSize(7.5);
    doc.setTextColor(38, 50, 69);
    const pageLabel = `Faqe ${page} / ${pageCount}`;
    const pageW = doc.getTextWidth(pageLabel);
    const parts = [data.clinic.name, data.clinic.address, data.clinic.phone, data.clinic.email].filter(Boolean);
    if (data.meta.protocol) parts.push(`Nr. raportit: ${data.meta.protocol}`);
    const left = parts.join("  |  ");
    const maxW = ctx.pageWidth - MARGIN * 2 - pageW - 4;
    if (left) {
      doc.setFont("helvetica", "bold");
      doc.text(doc.splitTextToSize(left, maxW)[0], MARGIN, y);
    }
    doc.setFont("helvetica", "normal");
    doc.text(pageLabel, ctx.pageWidth - MARGIN, y, { align: "right" });
  }
}

/**
 * Build the visit PDF in memory. Callers can download it or return the blob.
 */
export function createCaseReportPdfDocument(caseData, clinicHeader = null, doctorInfo = null) {
  const data = getReportData(caseData, clinicHeader || {}, doctorInfo || {});
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const ctx = {
    pageWidth: doc.internal.pageSize.getWidth(),
    pageHeight: doc.internal.pageSize.getHeight(),
    y: MARGIN,
    page: 1,
    logo: data.clinic.logoBase64,
    watermarked: new Set(),
  };

  drawWatermark(doc, ctx);
  drawHeader(doc, ctx, data);
  drawTitle(doc, ctx, data);

  const hasPatient = [data.patient.name, data.patient.dateOfBirth, data.patient.gender, data.patient.phone].some(clean);
  if (hasPatient) {
    drawHeading(doc, ctx, "TË DHËNAT E PACIENTIT");
    drawSplit(
      doc,
      ctx,
      [
        ["Emri dhe mbiemri", data.patient.name],
        ["Gjinia", data.patient.gender],
      ],
      [
        ["Datëlindja", data.patient.dateOfBirth],
        ["Telefoni", data.patient.phone],
      ]
    );
  }

  const hasVisit = [data.visit.date, data.visit.time, data.visit.doctor, data.visit.service].some(clean);
  if (hasVisit) {
    drawHeading(doc, ctx, "VIZITA");
    drawSplit(
      doc,
      ctx,
      [
        ["Data e vizitës", data.visit.date],
        ["Ora", data.visit.time],
      ],
      [
        ["Mjeku", data.visit.doctor],
        ["Shërbimi", data.visit.service],
      ],
      { divider: true }
    );
  }

  drawTextSection(doc, ctx, "SHËNIME TË VIZITËS", data.visitNotes);
  drawTextSection(doc, ctx, "ANAMNEZA", data.anamneza);
  drawVitals(doc, ctx, data.vitals);
  drawTextSection(doc, ctx, "EKZAMINIMI / GJENDJA KLINIKE", data.ekzaminimi);
  drawTextSection(doc, ctx, "DIAGNOZA", data.diagnosis);
  drawTextSection(doc, ctx, "TERAPIA / TRAJTIMI", data.therapy);
  drawLabs(doc, ctx, data.labFileNames);
  drawSignoff(doc, ctx, data);
  drawFooter(doc, ctx, data);

  const safeName = (data.patient.name || "raport").replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "raport";
  const filename = `raport_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  return { doc, filename };
}

/**
 * Generate and download a PDF report using jsPDF only (no HTML).
 */
export function downloadCaseReportPdf(caseData, clinicHeader = null, doctorInfo = null) {
  const { doc, filename } = createCaseReportPdfDocument(caseData, clinicHeader, doctorInfo);
  doc.save(filename);
}

/**
 * Download case report PDF with clinic header from API (client-generated fallback).
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
    const logoUrl = profile?.logoUrl ?? profile?.LogoUrl;
    const rawLogo = logoUrl ? await getLogoAsBase64(logoUrl) : null;
    const themeId =
      profile?.colorThemePreferences?.themeId ??
      profile?.colorThemePreferences?.ThemeId ??
      profile?.ColorThemePreferences?.themeId ??
      "";
    clinicHeader = {
      name,
      address,
      phone,
      email,
      themeId,
      logoBase64: (await normalizeReportImage(rawLogo)) || rawLogo || null,
    };
  } catch (_) {}
  const preparedDoctor = doctorInfo
    ? {
        ...doctorInfo,
        signatureBase64: (await normalizeReportImage(doctorInfo.signatureBase64)) || doctorInfo.signatureBase64 || null,
        stampBase64: (await normalizeReportImage(doctorInfo.stampBase64)) || doctorInfo.stampBase64 || null,
      }
    : null;
  downloadCaseReportPdf(caseData, clinicHeader, preparedDoctor);
}

/**
 * Download case report PDF from backend (GET /api/PatientCase/{id}/pdf).
 * Uses filename from Content-Disposition when present.
 * @param {string} caseId - case id (GUID)
 * @throws On 404 (case not found / not in your clinic) or network errors
 */
export async function downloadCaseReportPdfFromBackend(caseId) {
  const { blob, filename } = await getCaseReportPdf(caseId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open the backend case report PDF in a hidden frame and trigger the browser print dialog.
 * Resolves as soon as print() is called so the UI can print again (afterprint is unreliable in iframes).
 * @param {string} caseId - case id (GUID)
 */
export async function printCaseReportPdfFromBackend(caseId) {
  const { blob } = await getCaseReportPdf(caseId);
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Raport mjekësor");
    iframe.style.cssText =
      "position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;";

    let settled = false;
    let printed = false;

    const cleanup = () => {
      try {
        if (iframe.parentNode) document.body.removeChild(iframe);
      } catch (_) {}
      URL.revokeObjectURL(url);
    };

    const settleOk = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const settleErr = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      try {
        const win = iframe.contentWindow;
        if (!win?.print) {
          settleErr(new Error("Printimi nuk mbështetet në këtë shfletues."));
          return;
        }
        const onAfterPrint = () => cleanup();
        win.addEventListener("afterprint", onAfterPrint, { once: true });
        window.addEventListener("afterprint", onAfterPrint, { once: true });
        win.focus();
        win.print();
        settleOk();
        window.setTimeout(cleanup, 90_000);
      } catch (e) {
        settleErr(e);
      }
    };

    iframe.onload = triggerPrint;
    iframe.onerror = () => settleErr(new Error("Dështoi ngarkimi i PDF për printim."));

    iframe.src = url;
    document.body.appendChild(iframe);

    window.setTimeout(() => {
      if (!printed) triggerPrint();
    }, 1500);
  });
}
