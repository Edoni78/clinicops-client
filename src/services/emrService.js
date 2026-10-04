import { supabase } from "../lib/supabaseClient";
import { apiError, throwIfError } from "../lib/apiError";
import { asOne, num, requireProfile } from "../lib/sessionUser";
import { recordAudit } from "./auditService";

function mapVitals(row) {
  return {
    weightKg: num(row.weight_kg),
    systolicPressure: num(row.systolic_pressure),
    diastolicPressure: num(row.diastolic_pressure),
    temperatureC: num(row.temperature_c),
    heartRate: num(row.heart_rate),
    recordedAt: row.recorded_at,
  };
}

export async function getPatientEmr(patientId, doctorView = false) {
  if (!patientId) throw apiError("patientId is required");
  const profile = await requireProfile();
  const { data: patient, error } = await supabase
    .from("patients")
    .select("id, clinic_id, first_name, last_name, date_of_birth, gender, phone")
    .eq("id", patientId)
    .is("deleted_at", null)
    .maybeSingle();
  throwIfError(error, "Nuk u ngarkua EMR.");
  if (!patient) throw apiError("Nuk u ngarkua EMR.", 404);

  const { data: cases, error: caseError } = await supabase
    .from("patient_cases")
    .select(`
      id, status, notes, created_at,
      doctor:profiles!patient_cases_assigned_doctor_user_id_fkey (display_name),
      medical_reports (anamneza, ekzaminimi, diagnosis, therapy, created_at),
      case_vitals (weight_kg, systolic_pressure, diastolic_pressure, temperature_c, heart_rate, recorded_at)
    `)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  throwIfError(caseError, "Nuk u ngarkua EMR.");

  const name = `${patient.first_name || ""} ${patient.last_name || ""}`.trim();
  await recordAudit({
    action: "PatientViewed",
    entityName: "Patient",
    entityId: patient.id,
    entityDisplayName: name,
    description: `PatientViewed on ${name}`,
    clinicId: patient.clinic_id || profile.clinic_id,
  });
  if (doctorView || (cases || []).some((item) => asOne(item.medical_reports))) {
    await recordAudit({
      action: "MedicalRecordViewed",
      entityName: "MedicalRecord",
      entityId: patient.id,
      entityDisplayName: name,
      description: `MedicalRecordViewed on ${name}`,
      clinicId: patient.clinic_id || profile.clinic_id,
    });
  }

  return {
    patientId: patient.id,
    firstName: patient.first_name,
    lastName: patient.last_name,
    gender: patient.gender,
    phone: patient.phone,
    dateOfBirth: patient.date_of_birth,
    history: (cases || []).map((item) => {
      const report = asOne(item.medical_reports);
      const doctor = asOne(item.doctor);
      const vitals = Array.isArray(item.case_vitals)
        ? [...item.case_vitals].sort((a, b) => new Date(a.recorded_at || 0) - new Date(b.recorded_at || 0)).map(mapVitals)
        : [];
      return {
        patientCaseId: item.id,
        consultDate: item.created_at,
        reportCreatedAt: report?.created_at || null,
        caseStatus: item.status,
        doctorDisplayName: doctor?.display_name || "",
        anamneza: report?.anamneza || "",
        ekzaminimi: report?.ekzaminimi || "",
        diagnosis: report?.diagnosis || "",
        therapy: report?.therapy || "",
        notes: item.notes || "",
        vitals,
      };
    }),
  };
}

export async function getPatientEmrPublic(patientId) {
  if (!patientId) throw apiError("patientId is required");
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      return await getPatientEmr(patientId, false);
    }
  } catch {
    // Public link falls through when the viewer is anonymous or outside the clinic.
  }
  const { data, error } = await supabase.rpc("get_public_emr", { p_patient_id: patientId });
  throwIfError(error, "EMR nuk u gjet ose linku nuk është valid.");
  if (!data) throw apiError("EMR nuk u gjet ose linku nuk është valid.", 404);
  return data;
}
