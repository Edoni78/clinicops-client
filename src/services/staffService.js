import { supabase } from "../lib/supabaseClient";
import { apiError, throwIfError } from "../lib/apiError";
import { requireProfile, resolveClinicId } from "../lib/sessionUser";

function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    clinicId: row.clinic_id,
    createdAt: row.created_at,
  };
}

export async function listClinicUsers(params = {}) {
  await requireProfile();
  const clinicId = await resolveClinicId(params.clinicId);
  let query = supabase
    .from("profiles")
    .select("id, email, display_name, role, clinic_id, created_at")
    .eq("clinic_id", clinicId)
    .eq("is_active", true)
    .neq("role", "SuperAdmin")
    .order("created_at", { ascending: false });
  if (params.role) query = query.eq("role", params.role);
  const { data, error } = await query;
  throwIfError(error, "Dështoi ngarkimi i stafit.");
  return (data || []).map(mapUser);
}

export async function createClinicUser(body, clinicId) {
  const scoped = await resolveClinicId(clinicId);
  const { data, error } = await supabase.rpc("create_staff_user", {
    p_email: String(body.email || "").trim(),
    p_password: body.password || "",
    p_display_name: String(body.displayName || "").trim(),
    p_role: body.role,
    p_clinic_id: scoped,
  });
  throwIfError(error, "Dështoi krijimi i përdoruesit.");
  return { id: data, email: body.email, displayName: body.displayName, role: body.role };
}

export async function deleteClinicUser(id, clinicId) {
  const profile = await requireProfile();
  if (id === profile.id) throw apiError("Nuk mund ta fshini llogarinë tuaj.");
  const scoped = await resolveClinicId(clinicId);
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", id)
    .eq("clinic_id", scoped)
    .select("id");
  throwIfError(error, "Fshirja dështoi.");
  if (!data?.length) throw apiError("Përdoruesi nuk u gjet.", 404);
}
