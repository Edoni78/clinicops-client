import { supabase } from "../lib/supabaseClient";
import { apiError, throwIfError } from "../lib/apiError";
import { asOne, num, requireProfile, resolveClinicId } from "../lib/sessionUser";
import { SINGLE_CONSULTATION_MESSAGE, normalizeCaseStatus } from "../pages/Dashboard/Cases/caseStatus";

const CASE_LIST_SELECT = `
  id, clinic_id, patient_id, status, notes, protocol_number, created_at, completed_at, updated_at,
  assigned_doctor_user_id, service_id,
  patients!inner (id, first_name, last_name, date_of_birth, gender, phone, deleted_at),
  services (id, name, price),
  doctor:profiles!patient_cases_assigned_doctor_user_id_fkey (display_name)
`;

const CASE_DETAIL_SELECT = `
  ${CASE_LIST_SELECT},
  case_vitals (weight_kg, systolic_pressure, diastolic_pressure, temperature_c, heart_rate, recorded_at),
  medical_reports (anamneza, ekzaminimi, diagnosis, therapy, created_at, updated_at)
`;

function mapVitals(row) {
  if (!row) return null;
  return {
    weightKg: num(row.weight_kg),
    systolicPressure: num(row.systolic_pressure),
    diastolicPressure: num(row.diastolic_pressure),
    temperatureC: num(row.temperature_c),
    heartRate: num(row.heart_rate),
    recordedAt: row.recorded_at,
  };
}

function latestVitals(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return null;
  const sorted = [...list].sort(
    (a, b) => new Date(b.recorded_at || 0) - new Date(a.recorded_at || 0)
  );
  return mapVitals(sorted[0]);
}

function mapReport(row) {
  const report = asOne(row);
  if (!report) return null;
  return {
    anamneza: report.anamneza ?? "",
    ekzaminimi: report.ekzaminimi ?? "",
    diagnosis: report.diagnosis ?? "",
    therapy: report.therapy ?? "",
    createdAt: report.created_at,
    updatedAt: report.updated_at,
  };
}

export function mapCase(row, { detail = false } = {}) {
  const patient = asOne(row.patients) || {};
  const service = asOne(row.services);
  const doctor = asOne(row.doctor);
  const mapped = {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    patientFirstName: patient.first_name ?? "",
    patientLastName: patient.last_name ?? "",
    patientDateOfBirth: patient.date_of_birth ?? null,
    patientPhone: patient.phone ?? "",
    patientGender: patient.gender ?? "",
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
    notes: row.notes,
    protocolNumber: row.protocol_number,
    assignedDoctorUserId: row.assigned_doctor_user_id,
    assignedDoctorName: doctor?.display_name ?? "",
    serviceId: service?.id ?? row.service_id ?? null,
    serviceName: service?.name ?? "",
    servicePrice: service?.price != null ? num(service.price) : null,
    patient: {
      id: patient.id ?? row.patient_id,
      firstName: patient.first_name ?? "",
      lastName: patient.last_name ?? "",
      dateOfBirth: patient.date_of_birth ?? null,
      phone: patient.phone ?? "",
      gender: patient.gender ?? "",
    },
  };
  if (detail) {
    mapped.latestVitals = latestVitals(row.case_vitals);
    mapped.medicalReport = mapReport(row.medical_reports);
  }
  return mapped;
}

async function loadCaseRow(id, detail = false) {
  const { data, error } = await supabase
    .from("patient_cases")
    .select(detail ? CASE_DETAIL_SELECT : CASE_LIST_SELECT)
    .eq("id", id)
    .maybeSingle();
  throwIfError(error, "Rasti nuk u gjet.");
  if (!data || asOne(data.patients)?.deleted_at) {
    throw apiError("Rasti nuk u gjet.", 404);
  }
  return data;
}

export async function getPatientCases(status) {
  const clinicId = await resolveClinicId();
  let query = supabase
    .from("patient_cases")
    .select(CASE_LIST_SELECT)
    .eq("clinic_id", clinicId)
    .is("patients.deleted_at", null)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", normalizeCaseStatus(status));
  const { data, error } = await query;
  throwIfError(error, "Dështoi ngarkimi i rasteve.");
  return (data || []).map((row) => mapCase(row));
}

export async function getPatientCase(id) {
  const row = await loadCaseRow(id, true);
  return mapCase(row, { detail: true });
}

export async function submitVitals(id, body) {
  const profile = await requireProfile();
  const existing = await loadCaseRow(id, false);
  const payload = {
    patient_case_id: id,
    clinic_id: existing.clinic_id,
    recorded_by: profile.id,
  };
  if (body.weightKg != null) payload.weight_kg = body.weightKg;
  if (body.systolicPressure != null) payload.systolic_pressure = body.systolicPressure;
  if (body.diastolicPressure != null) payload.diastolic_pressure = body.diastolicPressure;
  if (body.temperatureC != null) payload.temperature_c = body.temperatureC;
  if (body.heartRate != null) payload.heart_rate = body.heartRate;
  const { data, error } = await supabase.from("case_vitals").insert(payload).select("*").single();
  throwIfError(error, "Ruajtja e shenjave vitale dështoi.");
  return mapVitals(data);
}

export async function submitReport(id, body) {
  const profile = await requireProfile();
  const existing = await loadCaseRow(id, false);
  const payload = {
    patient_case_id: id,
    clinic_id: existing.clinic_id,
    anamneza: body.anamneza ?? "",
    ekzaminimi: body.ekzaminimi ?? "",
    diagnosis: body.diagnosis ?? "",
    therapy: body.therapy ?? "",
    doctor_user_id: profile.id,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("medical_reports")
    .upsert(payload, { onConflict: "patient_case_id" })
    .select("*")
    .single();
  throwIfError(error, "Ruajtja e raportit dështoi.");
  return mapReport(data);
}

export async function updateCaseProtocol(id, protocolNumber) {
  const value = String(protocolNumber ?? "").trim();
  if (!value) throw apiError("Numri i protokollit është i detyrueshëm.");
  const { data, error } = await supabase
    .from("patient_cases")
    .update({ protocol_number: value })
    .eq("id", id)
    .select("protocol_number")
    .single();
  throwIfError(error, "Përditësimi i protokollit dështoi.");
  return { protocolNumber: data.protocol_number };
}

export async function updateCaseStatus(id, status) {
  const next = normalizeCaseStatus(status);
  const existing = await loadCaseRow(id, false);
  if (next === "InConsultation") {
    let query = supabase
      .from("patient_cases")
      .select("id")
      .eq("clinic_id", existing.clinic_id)
      .eq("status", "InConsultation")
      .neq("id", id);
    if (existing.assigned_doctor_user_id) {
      query = query.eq("assigned_doctor_user_id", existing.assigned_doctor_user_id);
    }
    const { data: openCases, error: openError } = await query.limit(1);
    throwIfError(openError, "Dështoi përditësimi i statusit.");
    if (openCases?.length) throw apiError(SINGLE_CONSULTATION_MESSAGE, 409);
  }
  const { error } = await supabase.from("patient_cases").update({ status: next }).eq("id", id);
  throwIfError(error, "Dështoi përditësimi i statusit.");
}

export async function deletePatientCase(id, clinicId) {
  const scoped = await resolveClinicId(clinicId);
  const { data, error } = await supabase
    .from("patient_cases")
    .delete()
    .eq("id", id)
    .eq("clinic_id", scoped)
    .select("id");
  throwIfError(error, "Fshirja e rastit dështoi.");
  if (!data?.length) throw apiError("Rasti nuk u gjet.", 404);
}

export async function deletePatientCaseReport(id) {
  const { error } = await supabase.from("medical_reports").delete().eq("patient_case_id", id);
  throwIfError(error, "Fshirja e raportit dështoi.");
}

export async function attachServiceToCase(id, serviceId) {
  if (!serviceId) throw apiError("Shërbimi mungon.");
  const { data, error } = await supabase
    .from("patient_cases")
    .update({ service_id: serviceId })
    .eq("id", id)
    .select("id, service_id")
    .single();
  throwIfError(error, "Dështoi lidhja e shërbimit me rastin.");
  return data;
}

export async function getCaseReportPdf(id) {
  const caseData = await getPatientCase(id);
  const { getClinicProfile, getLogoAsBase64 } = await import("./clinicService");
  const { createCaseReportPdfDocument, normalizeReportImage } = await import("../utils/caseReportPdf");

  let clinicHeader = {};
  try {
    const profile = await getClinicProfile();
    const logoUrl = profile?.logoUrl;
    const rawLogo = logoUrl ? await getLogoAsBase64(logoUrl) : null;
    clinicHeader = {
      name: profile?.name || "",
      address: profile?.address || "",
      phone: profile?.phone || "",
      email: profile?.email || "",
      themeId: profile?.colorThemePreferences?.themeId || "",
      logoBase64: (await normalizeReportImage(rawLogo)) || rawLogo || null,
    };
  } catch {
    clinicHeader = {};
  }

  let doctorInfo = { name: caseData.assignedDoctorName || "" };
  try {
    const { getDoctorSignoff } = await import("./doctorService");
    const signoff = await getDoctorSignoff(caseData.assignedDoctorUserId);
    if (signoff) {
      doctorInfo = {
        name: signoff.name || doctorInfo.name,
        signatureBase64: (await normalizeReportImage(signoff.signatureBase64)) || signoff.signatureBase64 || null,
        stampBase64: (await normalizeReportImage(signoff.stampBase64)) || signoff.stampBase64 || null,
      };
    }
  } catch {
    doctorInfo = { name: caseData.assignedDoctorName || "" };
  }

  let labFileNames = [];
  try {
    const labs = await getLabResults(id);
    labFileNames = (labs || []).map((row) => row.fileName).filter(Boolean);
  } catch {
    labFileNames = [];
  }

  const { doc, filename } = createCaseReportPdfDocument(
    { ...caseData, labFileNames },
    clinicHeader,
    doctorInfo
  );
  const blob = doc.output("blob");
  return { blob, filename };
}

export async function getLabResults(caseId) {
  const { data, error } = await supabase
    .from("lab_results")
    .select("id, patient_case_id, file_name, storage_path, content_type, uploaded_at, uploaded_by")
    .eq("patient_case_id", caseId)
    .order("uploaded_at", { ascending: false });
  throwIfError(error, "Dështoi ngarkimi i rezultateve të laboratorit.");
  return (data || []).map((row) => ({
    id: row.id,
    patientCaseId: row.patient_case_id,
    fileName: row.file_name,
    downloadUrl: `sb:lab-results:${row.storage_path}`,
    contentType: row.content_type,
    uploadedAt: row.uploaded_at,
    uploadedById: row.uploaded_by,
  }));
}

export async function uploadLabResult(caseId, file) {
  if (!file) throw apiError("Skedari mungon.");
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (type !== "application/pdf" && !name.endsWith(".pdf")) {
    throw apiError("Lejohet vetëm skedar PDF.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw apiError("PDF-ja e kalon madhësinë maksimale prej 20 MB.");
  }
  const profile = await requireProfile();
  const existing = await loadCaseRow(caseId, false);
  const id = crypto.randomUUID();
  const storagePath = `${existing.clinic_id}/${caseId}/${id}.pdf`;
  const { error: uploadError } = await supabase.storage.from("lab-results").upload(storagePath, file, {
    contentType: "application/pdf",
    upsert: false,
  });
  throwIfError(uploadError, "Ngarkimi i rezultatit të laboratorit dështoi.");

  const { data, error } = await supabase
    .from("lab_results")
    .insert({
      id,
      patient_case_id: caseId,
      clinic_id: existing.clinic_id,
      file_name: file.name || "lab-result.pdf",
      storage_path: storagePath,
      content_type: file.type || "application/pdf",
      uploaded_by: profile.id,
    })
    .select("*")
    .single();
  if (error) {
    await supabase.storage.from("lab-results").remove([storagePath]);
    throwIfError(error, "Ngarkimi i rezultatit të laboratorit dështoi.");
  }
  return {
    id: data.id,
    patientCaseId: data.patient_case_id,
    fileName: data.file_name,
    downloadUrl: `sb:lab-results:${data.storage_path}`,
    contentType: data.content_type,
    uploadedAt: data.uploaded_at,
    uploadedById: data.uploaded_by,
  };
}

export async function downloadLabResultFile(downloadUrl, filename) {
  if (!downloadUrl) return;
  let blob;
  let name = filename || "lab-result.pdf";
  if (String(downloadUrl).startsWith("sb:lab-results:")) {
    const path = String(downloadUrl).slice("sb:lab-results:".length);
    const { data, error } = await supabase.storage.from("lab-results").download(path);
    throwIfError(error, "Shkarkimi i skedarit dështoi.");
    blob = data;
  } else if (/^https?:\/\//i.test(downloadUrl)) {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw apiError("Shkarkimi i skedarit dështoi.");
    blob = await response.blob();
  } else {
    throw apiError("Skedari nuk u gjet.", 404);
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
