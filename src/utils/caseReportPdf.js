import { jsPDF } from "jspdf";
import { getCaseReportPdf } from "../api/patientCase";
import { getGenderLabel } from "./emrDisplay";

const MARGIN = 22;
const FOOTER_GAP = 18;
const SECTION_GAP = 6;
const INK = [38, 38, 38];
const MUTED = [120, 120, 120];
const HAIRLINE = [214, 214, 214];
const RULE = [70, 70, 70];
const WATERMARK_OPACITY = 0.035;

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
  const logo = drawReportImage(doc, data.clinic.logoBase64, MARGIN, top, 16, 16);
  const nameX = MARGIN + (logo ? logo.w + 4 : 0);
  const contactW = 70;
  const contactRight = ctx.pageWidth - MARGIN;
  const nameMax = Math.max(42, contactRight - contactW - nameX - 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  const nameLines = data.clinic.name
    ? doc.splitTextToSize(data.clinic.name, nameMax).slice(0, 2)
    : [];
  if (nameLines.length) doc.text(nameLines, nameX, top + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const contacts = [data.clinic.address, data.clinic.phone, data.clinic.email].filter(Boolean);
  let contactY = top + 4.2;
  contacts.forEach((line) => {
    doc.splitTextToSize(line, contactW).slice(0, 2).forEach((part) => {
      doc.text(part, contactRight, contactY, { align: "right" });
      contactY += 3.7;
    });
    contactY += 0.4;
  });

  const headerBottom = Math.max(
    top + (logo ? logo.h : 0),
    top + 5.5 + Math.max(nameLines.length, 1) * 5.2,
    contactY
  ) + 2.5;
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, headerBottom, ctx.pageWidth - MARGIN, headerBottom);
  ctx.y = headerBottom + 11;
}

function drawTitle(doc, ctx, data) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text("RAPORT SPECIALISTIK", ctx.pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 5.5;

  const bits = [];
  if (data.meta.date) bits.push(data.meta.date);
  if (data.meta.time) bits.push(data.meta.time);
  if (data.meta.protocol) bits.push(`Nr. ${data.meta.protocol}`);
  if (bits.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(bits.join("    ·    "), ctx.pageWidth / 2, ctx.y, { align: "center" });
    ctx.y += 5;
  }
  ctx.y += 7;
}

function drawHeading(doc, ctx, title) {
  ensure(doc, ctx, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(title, MARGIN, ctx.y);
  ctx.y += 2;
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, ctx.y, ctx.pageWidth - MARGIN, ctx.y);
  ctx.y += 4.5;
}

function drawProse(doc, ctx, text) {
  const width = ctx.pageWidth - MARGIN * 2;
  const lineH = 4.8;
  const paragraphs = String(text).replace(/\r\n/g, "\n").split("\n");
  paragraphs.forEach((paragraph) => {
    if (!paragraph.trim()) {
      ensure(doc, ctx, 3);
      ctx.y += 2.2;
      return;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.splitTextToSize(paragraph, width).forEach((line) => {
      ensure(doc, ctx, lineH);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...INK);
      doc.text(line, MARGIN, ctx.y);
      ctx.y += lineH;
    });
  });
  ctx.y += SECTION_GAP;
}

function drawSplit(doc, ctx, leftPairs, rightPairs) {
  const left = leftPairs.filter((pair) => clean(pair[1]));
  const right = rightPairs.filter((pair) => clean(pair[1]));
  if (!left.length && !right.length) return;
  const rows = Math.max(left.length, right.length);
  const gap = 12;
  const colW = (ctx.pageWidth - MARGIN * 2 - gap) / 2;
  const rightX = MARGIN + colW + gap;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  const measured = Array.from({ length: rows }, (_, index) => {
    const pack = (pair) => {
      if (!pair) return [];
      return doc.splitTextToSize(String(pair[1]), colW).slice(0, 3);
    };
    const leftLines = pack(left[index]);
    const rightLines = pack(right[index]);
    const rowH = 5 + Math.max(leftLines.length, rightLines.length, 1) * 4.5;
    return { leftLines, rightLines, rowH };
  });
  ensure(doc, ctx, measured.reduce((sum, row) => sum + row.rowH, 0) + 2);

  const paint = (pair, lines, x, y) => {
    if (!pair) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(String(pair[0]), x, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(lines, x, y + 4.6);
  };

  measured.forEach((row, index) => {
    paint(left[index], row.leftLines, MARGIN, ctx.y);
    paint(right[index], row.rightLines, rightX, ctx.y);
    ctx.y += row.rowH;
  });

  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, ctx.y, ctx.pageWidth - MARGIN, ctx.y);
  ctx.y += SECTION_GAP;
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
  );
}

function drawLabs(doc, ctx, names) {
  if (!names.length) return;
  drawTextSection(doc, ctx, "LABORATORI", names.map((name) => `- ${name}`).join("\n"));
}

function drawSignoff(doc, ctx, data) {
  const name = data.signoff.name;
  const signature = imageSize(doc, data.signoff.signatureBase64, 48, 16);
  const stamp = imageSize(doc, data.signoff.stampBase64, 32, 28);
  const gap = 16;
  const colW = (ctx.pageWidth - MARGIN * 2 - gap) / 2;
  const rightX = MARGIN + colW + gap;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  const nameLines = name
    ? doc.splitTextToSize(name, colW - 2).slice(0, 2)
    : [];
  const nameH = nameLines.length ? nameLines.length * 4.6 : 0;
  const sigH = signature ? signature.h + 3 : 8;
  const stampH = stamp ? stamp.h + 3 : 20;
  const inner = Math.max(stampH, 5 + nameH + sigH);
  const blockH = 8 + inner + 8;

  if (ctx.y > MARGIN + 1) ctx.y += 8;
  if (ctx.y + blockH > contentBottom(ctx.pageHeight)) continuePage(doc, ctx);

  const top = ctx.y;
  const lineY = top + 5 + inner;
  const lineW = Math.min(colW - 2, 68);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text("Mjeku përgjegjës", MARGIN, top + 4);

  if (nameLines.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(nameLines, MARGIN, top + 10);
  }
  if (signature) {
    drawReportImage(
      doc,
      data.signoff.signatureBase64,
      MARGIN,
      lineY - signature.h - 2,
      48,
      16
    );
  }
  if (stamp) {
    drawReportImage(
      doc,
      data.signoff.stampBase64,
      rightX,
      lineY - stamp.h - 2,
      32,
      28
    );
  }

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, lineY, MARGIN + lineW, lineY);
  doc.line(rightX, lineY, rightX + lineW, lineY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Nënshkrimi", MARGIN, lineY + 4.4);
  doc.text("Vula", rightX, lineY + 4.4);
  ctx.y = lineY + 8;
}

function drawFooter(doc, ctx, data) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const y = ctx.pageHeight - 8;
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, y - 4, ctx.pageWidth - MARGIN, y - 4);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
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
