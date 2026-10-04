import { supabase } from "../lib/supabaseClient";
import { apiError, throwIfError } from "../lib/apiError";
import { fetchCurrentProfile, requireProfile } from "../lib/sessionUser";

export async function recordAudit({
  action,
  entityName,
  entityId,
  entityDisplayName,
  description,
  clinicId,
  metadata,
}) {
  try {
    const profile = await fetchCurrentProfile();
    if (!profile?.id) return;
    const { error } = await supabase.from("audit_logs").insert({
      clinic_id: clinicId || profile.clinic_id || null,
      user_id: profile.id,
      user_display_name: profile.display_name,
      user_role: profile.role,
      action,
      description: description || action,
      entity_name: entityName || null,
      entity_id: entityId != null ? String(entityId) : null,
      entity_display_name: entityDisplayName || null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      metadata: metadata || null,
    });
    if (error) {
      // Audit must not block the clinical workflow.
      console.warn("Audit log skipped", error.message);
    }
  } catch (err) {
    console.warn("Audit log skipped", err?.message || err);
  }
}

function mapLog(row) {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    userId: row.user_id,
    userDisplayName: row.user_display_name,
    userFullName: row.user_display_name,
    userRole: row.user_role,
    action: row.action,
    description: row.description,
    status: row.status,
    severity: row.severity,
    entityName: row.entity_name,
    entityId: row.entity_id,
    entityDisplayName: row.entity_display_name,
    entityReference: row.entity_reference,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAtUtc: row.created_at,
    metadata: row.metadata,
  };
}

export async function getAuditLogs(params = {}) {
  const profile = await requireProfile();
  if (profile.role !== "ClinicAdmin" && profile.role !== "SuperAdmin") {
    throw apiError("Nuk keni leje për auditimin.", 403);
  }
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.max(1, Number(params.pageSize) || 20);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("audit_logs").select("*", { count: "exact" });
  if (profile.role !== "SuperAdmin") {
    query = query.eq("clinic_id", profile.clinic_id);
  }
  if (params.action) query = query.eq("action", params.action);
  if (params.entityName) query = query.eq("entity_name", params.entityName);
  if (params.userId) query = query.eq("user_id", params.userId);
  if (params.fromDate) query = query.gte("created_at", `${params.fromDate}T00:00:00`);
  if (params.toDate) query = query.lte("created_at", `${params.toDate}T23:59:59`);
  if (params.search) {
    const term = String(params.search).replace(/[%_,]/g, "").trim();
    if (term) {
      query = query.or(
        `description.ilike.%${term}%,entity_display_name.ilike.%${term}%,user_display_name.ilike.%${term}%`
      );
    }
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  throwIfError(error, "Could not load audit logs. Please try again.");
  return {
    items: (data || []).map(mapLog),
    totalCount: count || 0,
    page,
    pageSize,
  };
}
