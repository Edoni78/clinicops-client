import * as XLSX from "xlsx";
import { supabase } from "../lib/supabaseClient";
import { apiError, throwIfError } from "../lib/apiError";
import { requireProfile, resolveClinicId } from "../lib/sessionUser";

const PATIENT_FIELDS = [
  { key: "firstName", label: "Emri", required: true },
  { key: "lastName", label: "Mbiemri", required: true },
  { key: "dateOfBirth", label: "Data e lindjes", required: true },
  { key: "gender", label: "Gjinia", required: false },
  { key: "phone", label: "Telefoni", required: false },
];

const CASE_FIELDS = [
  { key: "firstName", label: "Emri i pacientit", required: true },
  { key: "lastName", label: "Mbiemri i pacientit", required: true },
  { key: "dateOfBirth", label: "Data e lindjes (opsionale)", required: false },
  { key: "phone", label: "Telefoni", required: false },
  { key: "protocolNumber", label: "Numri i protokollit", required: false },
  { key: "notes", label: "Shënime", required: false },
  { key: "assignedDoctor", label: "Mjeku", required: false },
  { key: "serviceName", label: "Shërbimi", required: false },
  { key: "createdAt", label: "Data e rastit", required: false },
  { key: "completedAt", label: "Data e mbylljes", required: false },
];

const ALIASES = {
  firstName: ["firstname", "emri", "emer", "name", "emripacientit"],
  lastName: ["lastname", "mbiemri", "mbiemer", "surname"],
  dateOfBirth: ["dateofbirth", "dob", "birthday", "datalindjes", "datelindjes"],
  gender: ["gender", "gjinia", "sex"],
  phone: ["phone", "telefoni", "tel", "mobile", "nrtelefonit"],
  protocolNumber: ["protocol", "protocolnumber", "protokolli", "protokoll", "nrprotokollit"],
  notes: ["notes", "shenime", "shenim"],
  assignedDoctor: ["doctor", "assigneddoctor", "mjeku", "mjek"],
  serviceName: ["service", "servicename", "sherbimi", "sherbim"],
  createdAt: ["createdat", "datarastit", "data", "date"],
  completedAt: ["completedat", "datambylljes", "datambylljes"],
};

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function suggestMappings(headers, fields) {
  const suggested = {};
  fields.forEach((field) => {
    const aliases = ALIASES[field.key] || [];
    const match = headers.find((header) => aliases.includes(normalizeHeader(header)));
    if (match) suggested[field.key] = match;
  });
  return suggested;
}

function parseDate(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const text = String(value).trim();
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function parseDateTime(value) {
  const date = parseDate(value);
  if (!date) return null;
  return `${date}T12:00:00.000Z`;
}

function normalizeGender(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return null;
  if (["m", "male", "mashkull", "m"].includes(text)) return "Male";
  if (["f", "female", "femer", "femër"].includes(text)) return "Female";
  return String(value).trim();
}

function readWorkbook(file) {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw apiError("Excel-i nuk ka fletë.");
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
    const headerRow = (matrix[0] || []).map((cell) => String(cell ?? "").trim());
    const headers = headerRow.filter(Boolean);
    if (!headers.length) throw apiError("Excel-i nuk ka rresht titujsh.");
    const rows = [];
    for (let index = 1; index < matrix.length; index += 1) {
      const line = matrix[index] || [];
      const raw = {};
      let empty = true;
      headerRow.forEach((header, column) => {
        if (!header) return;
        const value = line[column];
        raw[header] = value instanceof Date ? value.toISOString() : value ?? "";
        if (String(value ?? "").trim() !== "") empty = false;
      });
      if (!empty) rows.push({ rowNumber: index + 1, raw });
    }
    if (!rows.length) throw apiError("Excel-i nuk ka rreshta me të dhëna.");
    if (rows.length > 5000) throw apiError("Importi lejon deri në 5000 rreshta.");
    return { headers, rows };
  });
}

async function insertChunks(table, rows) {
  const size = 200;
  for (let index = 0; index < rows.length; index += size) {
    const { error } = await supabase.from(table).insert(rows.slice(index, index + size));
    throwIfError(error, "Ruajtja e rreshtave të importit dështoi.");
  }
}

function cell(raw, header) {
  if (!header) return "";
  return raw?.[header];
}

function personKey(first, last, dob) {
  return `${String(first || "").trim().toLowerCase()}|${String(last || "").trim().toLowerCase()}|${dob || ""}`;
}

export async function uploadPatientMigration(file) {
  const profile = await requireProfile();
  const clinicId = await resolveClinicId();
  const { headers, rows } = await readWorkbook(file);
  const suggestedMappings = suggestMappings(headers, PATIENT_FIELDS);
  const { data, error } = await supabase
    .from("patient_migrations")
    .insert({
      clinic_id: clinicId,
      created_by: profile.id,
      file_name: file.name,
      headers,
      total_rows: rows.length,
      status: "uploaded",
    })
    .select("id")
    .single();
  throwIfError(error, "Ngarkimi i Excel-it dështoi.");
  await insertChunks(
    "patient_migration_rows",
    rows.map((row) => ({
      migration_id: data.id,
      row_number: row.rowNumber,
      raw: row.raw,
      status: "pending",
    }))
  );
  return {
    migrationId: data.id,
    fileName: file.name,
    headers,
    fields: PATIENT_FIELDS,
    suggestedMappings,
    totalRows: rows.length,
  };
}

export async function previewPatientMigration(migrationId, mappings) {
  const clinicId = await resolveClinicId();
  const { data: migration, error } = await supabase
    .from("patient_migrations")
    .select("id, clinic_id")
    .eq("id", migrationId)
    .maybeSingle();
  throwIfError(error, "Parapamja e importit dështoi.");
  if (!migration || migration.clinic_id !== clinicId) throw apiError("Importi nuk u gjet.", 404);

  const { data: stored, error: rowError } = await supabase
    .from("patient_migration_rows")
    .select("row_number, raw")
    .eq("migration_id", migrationId)
    .order("row_number");
  throwIfError(rowError, "Parapamja e importit dështoi.");

  const { data: existing, error: existingError } = await supabase
    .from("patients")
    .select("first_name, last_name, date_of_birth, phone")
    .eq("clinic_id", clinicId)
    .is("deleted_at", null);
  throwIfError(existingError, "Parapamja e importit dështoi.");

  const knownPeople = new Set((existing || []).map((row) => personKey(row.first_name, row.last_name, row.date_of_birth)));
  const knownPhones = new Set((existing || []).map((row) => String(row.phone || "").trim()).filter(Boolean));
  const seenPeople = new Set();
  const seenPhones = new Set();
  let validRows = 0;
  let invalidRows = 0;
  let duplicateRows = 0;

  const nextRows = (stored || []).map((row) => {
    const firstName = String(cell(row.raw, mappings.firstName) ?? "").trim();
    const lastName = String(cell(row.raw, mappings.lastName) ?? "").trim();
    const dateOfBirth = parseDate(cell(row.raw, mappings.dateOfBirth));
    const gender = normalizeGender(cell(row.raw, mappings.gender));
    const phone = String(cell(row.raw, mappings.phone) ?? "").trim();
    let status = "valid";
    let message = null;
    if (!firstName || !lastName || !dateOfBirth) {
      status = "invalid";
      message = "Emri, mbiemri dhe data e lindjes janë të detyrueshme dhe data duhet të jetë e vlefshme.";
    } else {
      const key = personKey(firstName, lastName, dateOfBirth);
      if (knownPeople.has(key) || seenPeople.has(key) || (phone && (knownPhones.has(phone) || seenPhones.has(phone)))) {
        status = "duplicate";
        message = "Pacienti ekziston tashmë ose përsëritet në skedar.";
      } else {
        seenPeople.add(key);
        if (phone) seenPhones.add(phone);
      }
    }
    if (status === "valid") validRows += 1;
    if (status === "invalid") invalidRows += 1;
    if (status === "duplicate") duplicateRows += 1;
    return {
      migration_id: migrationId,
      row_number: row.row_number,
      raw: row.raw,
      first_name: firstName || null,
      last_name: lastName || null,
      date_of_birth: dateOfBirth,
      gender,
      phone: phone || null,
      status,
      error: message,
    };
  });

  const { error: deleteError } = await supabase.from("patient_migration_rows").delete().eq("migration_id", migrationId);
  throwIfError(deleteError, "Parapamja e importit dështoi.");
  await insertChunks("patient_migration_rows", nextRows);
  const summary = {
    totalRows: nextRows.length,
    validRows,
    invalidRows,
    duplicateRows,
  };
  const { error: updateError } = await supabase
    .from("patient_migrations")
    .update({ ...summary, status: "previewed" })
    .eq("id", migrationId);
  throwIfError(updateError, "Parapamja e importit dështoi.");
  return summary;
}

export async function listPatientMigrationRows(migrationId, { status, page = 1, pageSize = 25 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("patient_migration_rows")
    .select("row_number, first_name, last_name, date_of_birth, gender, phone, status, error", { count: "exact" })
    .eq("migration_id", migrationId);
  if (status && status !== "All") query = query.eq("status", String(status).toLowerCase());
  const { data, error, count } = await query.order("row_number").range(from, to);
  throwIfError(error, "Dështoi ngarkimi i rreshtave.");
  return {
    items: (data || []).map((row) => ({
      rowNumber: row.row_number,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      phone: row.phone,
      status: row.status,
      error: row.error,
    })),
    total: count || 0,
    page,
    pageSize,
  };
}

export async function confirmPatientMigration(migrationId) {
  const { data, error } = await supabase.rpc("confirm_patient_migration", { p_id: migrationId });
  throwIfError(error, "Importi dështoi. Asnjë pacient nuk u shtua.");
  return data || {};
}

export async function getPatientMigration(migrationId) {
  const { data, error } = await supabase.from("patient_migrations").select("*").eq("id", migrationId).maybeSingle();
  throwIfError(error, "Importi nuk u gjet.");
  if (!data) throw apiError("Importi nuk u gjet.", 404);
  return {
    migrationId: data.id,
    fileName: data.file_name,
    status: data.status,
    totalRows: data.total_rows,
    validRows: data.valid_rows,
    invalidRows: data.invalid_rows,
    duplicateRows: data.duplicate_rows,
    importedRows: data.imported_rows,
    headers: data.headers,
  };
}

export async function uploadCaseMigration(file) {
  const profile = await requireProfile();
  const clinicId = await resolveClinicId();
  const { headers, rows } = await readWorkbook(file);
  const suggestedMappings = suggestMappings(headers, CASE_FIELDS);
  const { data, error } = await supabase
    .from("case_migrations")
    .insert({
      clinic_id: clinicId,
      created_by: profile.id,
      file_name: file.name,
      headers,
      total_rows: rows.length,
      status: "uploaded",
    })
    .select("id")
    .single();
  throwIfError(error, "Ngarkimi i Excel-it dështoi.");
  await insertChunks(
    "case_migration_rows",
    rows.map((row) => ({
      migration_id: data.id,
      row_number: row.rowNumber,
      raw: row.raw,
      status: "pending",
    }))
  );
  return {
    migrationId: data.id,
    fileName: file.name,
    headers,
    fields: CASE_FIELDS,
    suggestedMappings,
    totalRows: rows.length,
  };
}

export async function previewCaseMigration(migrationId, mappings) {
  const clinicId = await resolveClinicId();
  const { data: migration, error } = await supabase
    .from("case_migrations")
    .select("id, clinic_id")
    .eq("id", migrationId)
    .maybeSingle();
  throwIfError(error, "Parapamja e importit dështoi.");
  if (!migration || migration.clinic_id !== clinicId) throw apiError("Importi nuk u gjet.", 404);

  const { data: stored, error: rowError } = await supabase
    .from("case_migration_rows")
    .select("row_number, raw")
    .eq("migration_id", migrationId)
    .order("row_number");
  throwIfError(rowError, "Parapamja e importit dështoi.");

  const [{ data: doctors }, { data: services }, { data: protocols }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, email").eq("clinic_id", clinicId).eq("role", "Doctor").eq("is_active", true),
    supabase.from("services").select("id, name").eq("clinic_id", clinicId).eq("is_active", true),
    supabase.from("patient_cases").select("protocol_number").eq("clinic_id", clinicId).not("protocol_number", "is", null),
  ]);

  const doctorByName = new Map();
  (doctors || []).forEach((doctor) => {
    if (doctor.display_name) doctorByName.set(doctor.display_name.trim().toLowerCase(), doctor.id);
    if (doctor.email) doctorByName.set(doctor.email.trim().toLowerCase(), doctor.id);
  });
  const serviceByName = new Map((services || []).map((service) => [service.name.trim().toLowerCase(), service.id]));
  const knownProtocols = new Set((protocols || []).map((row) => String(row.protocol_number || "").trim().toLowerCase()).filter(Boolean));
  const seenProtocols = new Set();
  let validRows = 0;
  let invalidRows = 0;
  let duplicateRows = 0;

  const nextRows = (stored || []).map((row) => {
    const firstName = String(cell(row.raw, mappings.firstName) ?? "").trim();
    const lastName = String(cell(row.raw, mappings.lastName) ?? "").trim();
    const dateOfBirth = parseDate(cell(row.raw, mappings.dateOfBirth));
    const phone = String(cell(row.raw, mappings.phone) ?? "").trim();
    const protocolNumber = String(cell(row.raw, mappings.protocolNumber) ?? "").trim();
    const notes = String(cell(row.raw, mappings.notes) ?? "").trim();
    const doctorName = String(cell(row.raw, mappings.assignedDoctor) ?? "").trim();
    const serviceName = String(cell(row.raw, mappings.serviceName) ?? "").trim();
    const createdAt = parseDateTime(cell(row.raw, mappings.createdAt));
    const completedAt = parseDateTime(cell(row.raw, mappings.completedAt));
    let status = "valid";
    let message = null;
    let doctorId = null;
    let serviceId = null;
    if (!firstName || !lastName) {
      status = "invalid";
      message = "Emri dhe mbiemri i pacientit janë të detyrueshëm.";
    } else if (doctorName && !doctorByName.has(doctorName.toLowerCase())) {
      status = "invalid";
      message = "Mjeku nuk u gjet në këtë klinikë.";
    } else if (serviceName && !serviceByName.has(serviceName.toLowerCase())) {
      status = "invalid";
      message = "Shërbimi nuk u gjet në këtë klinikë.";
    } else if (protocolNumber && (knownProtocols.has(protocolNumber.toLowerCase()) || seenProtocols.has(protocolNumber.toLowerCase()))) {
      status = "duplicate";
      message = "Numri i protokollit ekziston tashmë ose përsëritet në skedar.";
    }
    if (status === "valid") {
      doctorId = doctorName ? doctorByName.get(doctorName.toLowerCase()) : null;
      serviceId = serviceName ? serviceByName.get(serviceName.toLowerCase()) : null;
      if (protocolNumber) seenProtocols.add(protocolNumber.toLowerCase());
      validRows += 1;
    } else if (status === "invalid") invalidRows += 1;
    else duplicateRows += 1;

    return {
      migration_id: migrationId,
      row_number: row.row_number,
      raw: row.raw,
      first_name: firstName || null,
      last_name: lastName || null,
      date_of_birth: dateOfBirth,
      phone: phone || null,
      protocol_number: protocolNumber || null,
      notes: notes || null,
      assigned_doctor_user_id: doctorId,
      service_id: serviceId,
      case_created_at: createdAt,
      case_completed_at: completedAt,
      case_status: "Mbyllur",
      status,
      error: message,
    };
  });

  const { error: deleteError } = await supabase.from("case_migration_rows").delete().eq("migration_id", migrationId);
  throwIfError(deleteError, "Parapamja e importit dështoi.");
  await insertChunks("case_migration_rows", nextRows);
  const summary = { totalRows: nextRows.length, validRows, invalidRows, duplicateRows };
  const { error: updateError } = await supabase.from("case_migrations").update({ ...summary, status: "previewed" }).eq("id", migrationId);
  throwIfError(updateError, "Parapamja e importit dështoi.");
  return summary;
}

export async function listCaseMigrationRows(migrationId, { status, page = 1, pageSize = 25 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("case_migration_rows")
    .select("row_number, first_name, last_name, protocol_number, case_status, status, error", { count: "exact" })
    .eq("migration_id", migrationId);
  if (status && status !== "All") query = query.eq("status", String(status).toLowerCase());
  const { data, error, count } = await query.order("row_number").range(from, to);
  throwIfError(error, "Dështoi ngarkimi i rreshtave.");
  return {
    items: (data || []).map((row) => ({
      rowNumber: row.row_number,
      firstName: row.first_name,
      lastName: row.last_name,
      protocolNumber: row.protocol_number,
      caseStatus: row.case_status || "Mbyllur",
      status: row.status,
      error: row.error,
    })),
    total: count || 0,
    page,
    pageSize,
  };
}

export async function confirmCaseMigration(migrationId) {
  const { data, error } = await supabase.rpc("confirm_case_migration", { p_id: migrationId });
  throwIfError(error, "Importi dështoi. Asnjë rast nuk u shtua.");
  return data || {};
}

export function apiErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  return err?.message || fallback;
}
