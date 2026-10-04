import { supabase } from "../lib/supabaseClient";
import { apiError, throwIfError } from "../lib/apiError";
import { requireProfile } from "../lib/sessionUser";

function mapApplication(row) {
  return {
    id: row.id,
    clinicName: row.clinic_name,
    adminEmail: row.admin_email,
    clinicMode: row.clinic_mode,
    status: row.status,
    statusDisplay: row.status,
    reviewNote: row.review_note,
    userId: row.user_id,
    clinicId: row.clinic_id,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

export async function listApplications(status) {
  const profile = await requireProfile();
  if (profile.role !== "SuperAdmin") {
    throw apiError("Vetëm superadmini mund të shohë aplikimet.", 403);
  }
  let query = supabase
    .from("clinic_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  throwIfError(error, "Dështoi ngarkimi i aplikimeve.");
  return (data || []).map(mapApplication);
}

export async function approveApplication(id, reviewNote) {
  const numericId = typeof id === "number" ? id : parseInt(id, 10);
  if (Number.isNaN(numericId)) throw apiError("Invalid application id");
  const { data, error } = await supabase.rpc("approve_clinic_application", {
    p_id: numericId,
    p_note: reviewNote ? String(reviewNote).trim() : null,
  });
  throwIfError(error, "Aprovimi dështoi.");
  return data;
}

export async function rejectApplication(id, reviewNote) {
  const numericId = typeof id === "number" ? id : parseInt(id, 10);
  if (Number.isNaN(numericId)) throw apiError("Invalid application id");
  const { data, error } = await supabase.rpc("reject_clinic_application", {
    p_id: numericId,
    p_note: reviewNote ? String(reviewNote).trim() : null,
  });
  throwIfError(error, "Refuzimi dështoi.");
  return data;
}
