import { supabase } from "../lib/supabaseClient";
import { apiError, throwIfError } from "../lib/apiError";
import { requireProfile, resolveClinicId } from "../lib/sessionUser";

function collectDoctors(cases) {
  const ordered = [...(cases || [])].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
  const seen = new Set();
  const doctors = [];
  for (const row of ordered) {
    const id = row.assigned_doctor_user_id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const doctor = Array.isArray(row.doctor) ? row.doctor[0] : row.doctor;
    const name = String(doctor?.display_name || "").trim() || "Mjek";
    doctors.push({ id, name });
  }
  return doctors;
}

function mapPatient(row) {
  const doctors = collectDoctors(row.patient_cases);
  return {
    id: row.id,
    patientId: row.id,
    clinicId: row.clinic_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    phone: row.phone,
    notes: row.notes,
    createdAt: row.created_at,
    doctors,
    doctorNames: doctors.map((doctor) => doctor.name).join(", "),
  };
}

export async function listPatients(clinicId) {
  const scoped = await resolveClinicId(clinicId);
  const { data, error } = await supabase
    .from("patients")
    .select(`
      id, clinic_id, first_name, last_name, date_of_birth, gender, phone, notes, created_at,
      patient_cases (
        assigned_doctor_user_id, created_at,
        doctor:profiles!patient_cases_assigned_doctor_user_id_fkey (display_name)
      )
    `)
    .eq("clinic_id", scoped)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  throwIfError(error, "Dështoi ngarkimi i pacientëve.");
  return (data || []).map(mapPatient);
}

export async function registerPatient(body) {
  const profile = await requireProfile();
  const clinicId = await resolveClinicId(body.clinicId);
  if (!body.firstName || !body.lastName) {
    throw apiError("Emri dhe mbiemri janë të detyrueshëm.");
  }
  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      clinic_id: clinicId,
      first_name: String(body.firstName).trim(),
      last_name: String(body.lastName).trim(),
      date_of_birth: body.dateOfBirth || null,
      gender: body.gender || null,
      phone: body.phone || null,
      notes: body.notes || null,
    })
    .select("id")
    .single();
  throwIfError(error, "Regjistrimi i pacientit dështoi.");

  const { data: createdCase, error: caseError } = await supabase
    .from("patient_cases")
    .insert({
      clinic_id: clinicId,
      patient_id: patient.id,
      status: "Waiting",
      notes: body.notes || null,
      assigned_doctor_user_id: body.assignedDoctorUserId || null,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (caseError) {
    await supabase.from("patients").delete().eq("id", patient.id);
    throwIfError(caseError, "Regjistrimi i pacientit dështoi.");
  }

  return {
    ...mapPatient({ ...patient, clinic_id: clinicId, first_name: body.firstName, last_name: body.lastName }),
    id: patient.id,
    patientCaseId: createdCase.id,
  };
}

export async function openPatientCase(patientId, body) {
  const profile = await requireProfile();
  const clinicId = await resolveClinicId(body?.clinicId);
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("clinic_id", clinicId)
    .is("deleted_at", null)
    .maybeSingle();
  throwIfError(patientError, "Pacienti nuk u gjet.");
  if (!patient) throw apiError("Pacienti nuk u gjet.", 404);

  const { data, error } = await supabase
    .from("patient_cases")
    .insert({
      clinic_id: clinicId,
      patient_id: patientId,
      status: "Waiting",
      notes: body?.notes || null,
      assigned_doctor_user_id: body?.assignedDoctorUserId || null,
      created_by: profile.id,
    })
    .select("id")
    .single();
  throwIfError(error, "Hapja e rastit dështoi.");
  return { id: data.id, patientCaseId: data.id, patientId };
}

export async function deletePatient(id, clinicId) {
  const profile = await requireProfile();
  if (!["ClinicAdmin", "Doctor", "SuperAdmin"].includes(profile.role)) {
    throw apiError("Nuk keni leje për të fshirë pacientin.", 403);
  }
  const scoped = await resolveClinicId(clinicId);
  const { data, error } = await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("clinic_id", scoped)
    .is("deleted_at", null)
    .select("id");
  throwIfError(error, "Fshirja e pacientit dështoi.");
  if (!data?.length) throw apiError("Pacienti nuk u gjet.", 404);
}
