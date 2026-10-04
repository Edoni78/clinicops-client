import { supabase } from "../lib/supabaseClient";
import { apiError, throwIfError } from "../lib/apiError";
import { num, resolveClinicId } from "../lib/sessionUser";

function mapService(row) {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    price: num(row.price) ?? 0,
    createdAt: row.created_at,
    isActive: row.is_active,
  };
}

export async function listServices(clinicId) {
  const scoped = await resolveClinicId(clinicId);
  const { data, error } = await supabase
    .from("services")
    .select("id, clinic_id, name, price, created_at, is_active")
    .eq("clinic_id", scoped)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  throwIfError(error, "Dështoi ngarkimi i shërbimeve.");
  return (data || []).map(mapService);
}

export async function getService(id, clinicId) {
  const scoped = await resolveClinicId(clinicId);
  const { data, error } = await supabase
    .from("services")
    .select("id, clinic_id, name, price, created_at, is_active")
    .eq("id", id)
    .eq("clinic_id", scoped)
    .maybeSingle();
  throwIfError(error, "Shërbimi nuk u gjet.");
  if (!data || !data.is_active) throw apiError("Shërbimi nuk u gjet.", 404);
  return mapService(data);
}

function validateService(body, { partial = false } = {}) {
  const payload = {};
  if (!partial || body.name != null) {
    const name = String(body.name ?? "").trim();
    if (!name) throw apiError("Emri i shërbimit është i detyrueshëm.");
    if (name.length > 300) throw apiError("Emri i shërbimit nuk mund të kalojë 300 karaktere.");
    payload.name = name;
  }
  if (!partial || body.price != null) {
    const price = num(body.price);
    if (price == null || price < 0) throw apiError("Çmimi duhet të jetë 0 ose më i madh.");
    payload.price = price;
  }
  return payload;
}

export async function createService(body, clinicId) {
  const scoped = await resolveClinicId(clinicId);
  const payload = validateService(body);
  const { data, error } = await supabase
    .from("services")
    .insert({ ...payload, clinic_id: scoped, is_active: true })
    .select("*")
    .single();
  throwIfError(error, "Krijimi i shërbimit dështoi.");
  return mapService(data);
}

export async function updateService(id, body, clinicId) {
  const scoped = await resolveClinicId(clinicId);
  const payload = validateService(body, { partial: true });
  const { data, error } = await supabase
    .from("services")
    .update(payload)
    .eq("id", id)
    .eq("clinic_id", scoped)
    .eq("is_active", true)
    .select("*")
    .single();
  throwIfError(error, "Përditësimi i shërbimit dështoi.");
  return mapService(data);
}

export async function deleteService(id, clinicId) {
  const scoped = await resolveClinicId(clinicId);
  const { data, error } = await supabase
    .from("services")
    .update({ is_active: false })
    .eq("id", id)
    .eq("clinic_id", scoped)
    .select("id");
  throwIfError(error, "Fshirja e shërbimit dështoi.");
  if (!data?.length) throw apiError("Shërbimi nuk u gjet.", 404);
}
