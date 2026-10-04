-- ClinicOps demo schema for Supabase.
-- Apply this file in the Supabase SQL editor (or via psql) once.
-- Demo logins are created at the bottom of this file. Passwords are demo-only.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.app_role as enum (
    'SuperAdmin', 'ClinicAdmin', 'Doctor', 'Nurse', 'LabTechnician'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.clinic_mode as enum ('SoloDoctor', 'FullTeam');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.application_status as enum ('Pending', 'Approved', 'Rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.case_status as enum (
    'Waiting', 'InConsultation', 'Finished', 'Mbyllur', 'InProgress', 'Completed'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  email text,
  logo_path text,
  description text,
  clinic_mode public.clinic_mode not null default 'FullTeam',
  is_active boolean not null default true,
  enable_weight boolean not null default true,
  enable_blood_pressure boolean not null default true,
  enable_temperature boolean not null default true,
  enable_heart_rate boolean not null default true,
  use_protocol_number boolean not null default false,
  allow_nurse_protocol boolean not null default true,
  allow_doctor_protocol boolean not null default true,
  theme_id text not null default 'default',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role public.app_role,
  clinic_id uuid references public.clinics (id) on delete set null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.clinic_applications (
  id integer generated always as identity primary key,
  clinic_name text not null,
  admin_email text not null,
  clinic_mode public.clinic_mode not null default 'FullTeam',
  status public.application_status not null default 'Pending',
  review_note text,
  user_id uuid references auth.users (id) on delete cascade,
  clinic_id uuid references public.clinics (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.doctor_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  signature_path text,
  stamp_path text,
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  gender text,
  phone text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  name text not null check (char_length(name) <= 300),
  price numeric(12, 2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_cases (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  status public.case_status not null default 'Waiting',
  notes text,
  assigned_doctor_user_id uuid references public.profiles (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  protocol_number text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create unique index if not exists patient_cases_protocol_unique
  on public.patient_cases (clinic_id, lower(protocol_number))
  where protocol_number is not null and length(btrim(protocol_number)) > 0;

create table if not exists public.case_vitals (
  id uuid primary key default gen_random_uuid(),
  patient_case_id uuid not null references public.patient_cases (id) on delete cascade,
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  weight_kg numeric(6, 2),
  systolic_pressure integer,
  diastolic_pressure integer,
  temperature_c numeric(5, 2),
  heart_rate integer,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.medical_reports (
  id uuid primary key default gen_random_uuid(),
  patient_case_id uuid not null unique references public.patient_cases (id) on delete cascade,
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  anamneza text,
  ekzaminimi text,
  diagnosis text,
  therapy text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  doctor_user_id uuid references public.profiles (id) on delete set null
);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  patient_case_id uuid not null references public.patient_cases (id) on delete cascade,
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  content_type text,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  clinic_id uuid references public.clinics (id) on delete cascade,
  user_id uuid,
  user_display_name text,
  user_role text,
  action text not null,
  description text,
  status text not null default 'Success',
  severity text not null default 'Info',
  entity_name text,
  entity_id text,
  entity_display_name text,
  entity_reference text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_migrations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  file_name text,
  headers jsonb not null default '[]'::jsonb,
  status text not null default 'uploaded',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  imported_rows integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_migration_rows (
  id uuid primary key default gen_random_uuid(),
  migration_id uuid not null references public.patient_migrations (id) on delete cascade,
  row_number integer not null,
  raw jsonb not null default '{}'::jsonb,
  first_name text,
  last_name text,
  date_of_birth date,
  gender text,
  phone text,
  status text not null default 'pending',
  error text
);

create table if not exists public.case_migrations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  file_name text,
  headers jsonb not null default '[]'::jsonb,
  status text not null default 'uploaded',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  imported_rows integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.case_migration_rows (
  id uuid primary key default gen_random_uuid(),
  migration_id uuid not null references public.case_migrations (id) on delete cascade,
  row_number integer not null,
  raw jsonb not null default '{}'::jsonb,
  first_name text,
  last_name text,
  date_of_birth date,
  phone text,
  protocol_number text,
  notes text,
  assigned_doctor_user_id uuid,
  service_id uuid,
  case_created_at timestamptz,
  case_completed_at timestamptz,
  case_status text,
  status text not null default 'pending',
  error text
);

create table if not exists public.mfa_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists patients_clinic_idx on public.patients (clinic_id) where deleted_at is null;
create index if not exists patient_cases_clinic_idx on public.patient_cases (clinic_id, created_at desc);
create index if not exists patient_cases_patient_idx on public.patient_cases (patient_id);
create index if not exists case_vitals_case_idx on public.case_vitals (patient_case_id, recorded_at desc);
create index if not exists lab_results_case_idx on public.lab_results (patient_case_id);
create index if not exists audit_logs_clinic_idx on public.audit_logs (clinic_id, created_at desc);
create index if not exists profiles_clinic_idx on public.profiles (clinic_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid()
$$;

create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'SuperAdmin' and is_active
  )
$$;

create or replace function public.is_clinic_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin()
    or (
      target is not null
      and public.current_clinic_id() is not null
      and public.current_clinic_id() = target
    )
$$;

create or replace function public.has_role(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin() or public.current_role() = any (roles)
$$;

revoke all on function public.current_role() from public;
revoke all on function public.current_clinic_id() from public;
revoke all on function public.is_superadmin() from public;
revoke all on function public.is_clinic_member(uuid) from public;
revoke all on function public.has_role(text[]) from public;
grant execute on function public.current_role() to authenticated;
grant execute on function public.current_clinic_id() to authenticated;
grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.is_clinic_member(uuid) to authenticated;
grant execute on function public.has_role(text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Auth provisioning
-- ---------------------------------------------------------------------------

create or replace function public._provision_auth_user(
  p_email text,
  p_password text,
  p_meta jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  new_id uuid := gen_random_uuid();
  clean_email text := lower(btrim(p_email));
begin
  if clean_email is null or position('@' in clean_email) = 0 then
    raise exception 'Email i pavlefshëm.';
  end if;
  if p_password is null or char_length(p_password) < 6 then
    raise exception 'Fjalëkalimi duhet të ketë të paktën 6 karaktere.';
  end if;
  if exists (select 1 from auth.users where lower(email) = clean_email) then
    raise exception 'Ky email është tashmë i regjistruar.';
  end if;

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token,
    is_sso_user,
    is_anonymous
  ) values (
    new_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    clean_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    coalesce(p_meta, '{}'::jsonb),
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    false,
    false
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    new_id,
    jsonb_build_object('sub', new_id::text, 'email', clean_email),
    'email',
    new_id::text,
    now(),
    now(),
    now()
  );

  return new_id;
end;
$$;

revoke all on function public._provision_auth_user(text, text, jsonb) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role text := meta->>'role';
  v_clinic uuid := nullif(meta->>'clinicId', '')::uuid;
  v_intent text := meta->>'intent';
  v_mode text := coalesce(meta->>'clinicMode', 'FullTeam');
  v_app_role public.app_role;
begin
  if v_role in ('SuperAdmin', 'ClinicAdmin', 'Doctor', 'Nurse', 'LabTechnician') then
    v_app_role := v_role::public.app_role;
  else
    v_app_role := null;
  end if;

  insert into public.profiles (id, email, display_name, role, clinic_id, is_active)
  values (
    new.id,
    new.email,
    coalesce(nullif(meta->>'displayName', ''), split_part(coalesce(new.email, 'user'), '@', 1)),
    v_app_role,
    v_clinic,
    case
      when v_intent = 'clinic_application' then false
      when v_app_role is not null then true
      else false
    end
  )
  on conflict (id) do nothing;

  if v_intent = 'clinic_application' then
    insert into public.clinic_applications (clinic_name, admin_email, clinic_mode, status, user_id)
    values (
      coalesce(nullif(meta->>'clinicName', ''), 'Klinikë'),
      new.email,
      case
        when lower(v_mode) in ('solodoctor', 'solo', '0') then 'SoloDoctor'::public.clinic_mode
        else 'FullTeam'::public.clinic_mode
      end,
      'Pending',
      new.id
    );
  end if;

  if v_app_role = 'Doctor' then
    insert into public.doctor_profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.submit_clinic_application(
  p_clinic_name text,
  p_email text,
  p_password text,
  p_clinic_mode text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_app integer;
  v_mode text := coalesce(nullif(btrim(p_clinic_mode), ''), 'FullTeam');
begin
  if btrim(coalesce(p_clinic_name, '')) = '' then
    raise exception 'Emri i klinikës është i detyrueshëm.';
  end if;

  v_user := public._provision_auth_user(
    p_email,
    p_password,
    jsonb_build_object(
      'intent', 'clinic_application',
      'clinicName', btrim(p_clinic_name),
      'clinicMode', case when lower(v_mode) in ('solodoctor', 'solo', '0') then 'SoloDoctor' else 'FullTeam' end,
      'displayName', btrim(p_clinic_name)
    )
  );

  select id into v_app
  from public.clinic_applications
  where user_id = v_user
  order by id desc
  limit 1;

  return v_app;
end;
$$;

revoke all on function public.submit_clinic_application(text, text, text, text) from public;
grant execute on function public.submit_clinic_application(text, text, text, text) to anon, authenticated;

create or replace function public.create_staff_user(
  p_email text,
  p_password text,
  p_display_name text,
  p_role text,
  p_clinic_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := btrim(coalesce(p_role, ''));
  v_clinic uuid := p_clinic_id;
begin
  if not public.has_role(array['ClinicAdmin']) then
    raise exception 'Nuk keni leje për të krijuar staf.';
  end if;
  if v_role not in ('Doctor', 'Nurse', 'LabTechnician') then
    raise exception 'Roli i stafit nuk është i vlefshëm.';
  end if;
  if not public.is_superadmin() then
    v_clinic := public.current_clinic_id();
  end if;
  if v_clinic is null or not exists (select 1 from public.clinics where id = v_clinic) then
    raise exception 'Klinika nuk u gjet.';
  end if;
  if not public.is_superadmin() and v_clinic is distinct from public.current_clinic_id() then
    raise exception 'Nuk keni leje për këtë klinikë.';
  end if;

  return public._provision_auth_user(
    p_email,
    p_password,
    jsonb_build_object(
      'role', v_role,
      'displayName', coalesce(nullif(btrim(p_display_name), ''), split_part(p_email, '@', 1)),
      'clinicId', v_clinic::text
    )
  );
end;
$$;

revoke all on function public.create_staff_user(text, text, text, text, uuid) from public;
grant execute on function public.create_staff_user(text, text, text, text, uuid) to authenticated;

create or replace function public.approve_clinic_application(p_id integer, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.clinic_applications%rowtype;
  v_clinic uuid;
begin
  if not public.is_superadmin() then
    raise exception 'Vetëm superadmini mund të aprovojë aplikime.';
  end if;

  select * into app from public.clinic_applications where id = p_id;
  if not found then
    raise exception 'Aplikimi nuk u gjet.';
  end if;
  if app.status <> 'Pending' then
    raise exception 'Vetëm aplikimet në pritje mund të aprovohen.';
  end if;

  insert into public.clinics (name, email, clinic_mode, is_active)
  values (app.clinic_name, app.admin_email, app.clinic_mode, true)
  returning id into v_clinic;

  update public.profiles
  set role = 'ClinicAdmin',
      clinic_id = v_clinic,
      is_active = true,
      display_name = coalesce(nullif(display_name, ''), app.clinic_name)
  where id = app.user_id;

  update public.clinic_applications
  set status = 'Approved',
      clinic_id = v_clinic,
      review_note = nullif(btrim(coalesce(p_note, '')), ''),
      reviewed_at = now()
  where id = p_id;

  return jsonb_build_object('id', p_id, 'clinicId', v_clinic, 'status', 'Approved');
end;
$$;

create or replace function public.reject_clinic_application(p_id integer, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.clinic_applications%rowtype;
begin
  if not public.is_superadmin() then
    raise exception 'Vetëm superadmini mund të refuzojë aplikime.';
  end if;

  select * into app from public.clinic_applications where id = p_id;
  if not found then
    raise exception 'Aplikimi nuk u gjet.';
  end if;
  if app.status <> 'Pending' then
    raise exception 'Vetëm aplikimet në pritje mund të refuzohen.';
  end if;

  update public.clinic_applications
  set status = 'Rejected',
      review_note = nullif(btrim(coalesce(p_note, '')), ''),
      reviewed_at = now()
  where id = p_id;

  update public.profiles set is_active = false where id = app.user_id;

  return jsonb_build_object('id', p_id, 'status', 'Rejected');
end;
$$;

revoke all on function public.approve_clinic_application(integer, text) from public;
revoke all on function public.reject_clinic_application(integer, text) from public;
grant execute on function public.approve_clinic_application(integer, text) to authenticated;
grant execute on function public.reject_clinic_application(integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Profile protection (stop privilege escalation from the browser)
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_superadmin() then
    return new;
  end if;

  if public.current_role() = 'ClinicAdmin'
     and old.clinic_id is not distinct from public.current_clinic_id()
     and new.clinic_id is not distinct from old.clinic_id
     and new.role is not distinct from old.role
     and new.id is distinct from auth.uid() then
    return new;
  end if;

  if new.id = auth.uid()
     and new.role is not distinct from old.role
     and new.clinic_id is not distinct from old.clinic_id
     and new.is_active is not distinct from old.is_active
     and new.email is not distinct from old.email then
    return new;
  end if;

  raise exception 'Nuk lejohet ndryshimi i këtij profili.';
end;
$$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile();

create or replace function public.touch_case_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.status in ('Finished', 'Mbyllur', 'Completed') and new.completed_at is null then
    new.completed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists patient_cases_touch on public.patient_cases;
create trigger patient_cases_touch
  before update on public.patient_cases
  for each row execute function public.touch_case_updated_at();

create or replace function public.protect_patient_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null then
    if not public.has_role(array['ClinicAdmin', 'Doctor']) then
      raise exception 'Nuk keni leje për të fshirë pacientin.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists patients_protect_delete on public.patients;
create trigger patients_protect_delete
  before update on public.patients
  for each row execute function public.protect_patient_delete();

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------

create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_old jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_action text;
  v_entity text;
  v_display text;
  v_user_name text;
  v_user_role text;
  v_clinic uuid;
begin
  v_entity := case tg_table_name
    when 'patients' then 'Patient'
    when 'patient_cases' then 'PatientCase'
    when 'medical_reports' then 'MedicalRecord'
    when 'case_vitals' then 'Vitals'
    when 'services' then 'Service'
    when 'lab_results' then 'LabResult'
    when 'profiles' then 'ClinicUser'
    else initcap(tg_table_name)
  end;

  v_action := case
    when tg_table_name = 'patients' and tg_op = 'INSERT' then 'PatientCreated'
    when tg_table_name = 'patients' and tg_op = 'DELETE' then 'PatientDeleted'
    when tg_table_name = 'patients' and tg_op = 'UPDATE'
      and v_new->>'deleted_at' is not null and v_old->>'deleted_at' is null then 'PatientDeleted'
    when tg_table_name = 'patients' and tg_op = 'UPDATE' then 'PatientUpdated'
    when tg_table_name in ('medical_reports', 'case_vitals') then 'MedicalRecordUpdated'
    else v_entity || case tg_op when 'INSERT' then 'Created' when 'UPDATE' then 'Updated' else 'Deleted' end
  end;

  v_display := btrim(coalesce(v_row->>'first_name', '') || ' ' || coalesce(v_row->>'last_name', ''));
  if tg_table_name = 'services' then
    v_display := coalesce(v_row->>'name', '');
  elsif tg_table_name = 'profiles' then
    v_display := coalesce(v_row->>'display_name', v_row->>'email', '');
  elsif tg_table_name = 'lab_results' then
    v_display := coalesce(v_row->>'file_name', '');
  end if;

  v_clinic := nullif(v_row->>'clinic_id', '')::uuid;
  select display_name, role::text into v_user_name, v_user_role
  from public.profiles where id = auth.uid();

  insert into public.audit_logs (
    clinic_id, user_id, user_display_name, user_role, action, description,
    entity_name, entity_id, entity_display_name, created_at
  ) values (
    v_clinic,
    auth.uid(),
    v_user_name,
    v_user_role,
    v_action,
    v_action || ' on ' || coalesce(nullif(v_display, ''), v_entity),
    v_entity,
    coalesce(v_row->>'id', v_row->>'patient_case_id', v_row->>'user_id'),
    nullif(v_display, ''),
    now()
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists audit_patients on public.patients;
create trigger audit_patients after insert or update or delete on public.patients
  for each row execute function public.audit_row();

drop trigger if exists audit_cases on public.patient_cases;
create trigger audit_cases after insert or update or delete on public.patient_cases
  for each row execute function public.audit_row();

drop trigger if exists audit_reports on public.medical_reports;
create trigger audit_reports after insert or update or delete on public.medical_reports
  for each row execute function public.audit_row();

drop trigger if exists audit_vitals on public.case_vitals;
create trigger audit_vitals after insert or update or delete on public.case_vitals
  for each row execute function public.audit_row();

drop trigger if exists audit_services on public.services;
create trigger audit_services after insert or update or delete on public.services
  for each row execute function public.audit_row();

drop trigger if exists audit_labs on public.lab_results;
create trigger audit_labs after insert or update or delete on public.lab_results
  for each row execute function public.audit_row();

-- ---------------------------------------------------------------------------
-- Public EMR (capability link). Tables stay closed to anonymous users.
-- ---------------------------------------------------------------------------

create or replace function public.get_public_emr(p_patient_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  patient public.patients%rowtype;
  history jsonb;
begin
  select * into patient
  from public.patients
  where id = p_patient_id and deleted_at is null;

  if not found then
    raise exception 'EMR nuk u gjet ose linku nuk është valid.';
  end if;

  select coalesce(jsonb_agg(item order by item->>'consultDate' desc), '[]'::jsonb)
  into history
  from (
    select jsonb_build_object(
      'patientCaseId', c.id,
      'consultDate', c.created_at,
      'reportCreatedAt', r.created_at,
      'caseStatus', c.status,
      'doctorDisplayName', doc.display_name,
      'anamneza', r.anamneza,
      'ekzaminimi', r.ekzaminimi,
      'diagnosis', r.diagnosis,
      'therapy', r.therapy,
      'notes', c.notes,
      'vitals', coalesce((
        select jsonb_agg(jsonb_build_object(
          'weightKg', v.weight_kg,
          'systolicPressure', v.systolic_pressure,
          'diastolicPressure', v.diastolic_pressure,
          'temperatureC', v.temperature_c,
          'heartRate', v.heart_rate,
          'recordedAt', v.recorded_at
        ) order by v.recorded_at)
        from public.case_vitals v
        where v.patient_case_id = c.id
      ), '[]'::jsonb)
    ) as item
    from public.patient_cases c
    left join public.medical_reports r on r.patient_case_id = c.id
    left join public.profiles doc on doc.id = c.assigned_doctor_user_id
    where c.patient_id = patient.id
  ) s;

  return jsonb_build_object(
    'patientId', patient.id,
    'firstName', patient.first_name,
    'lastName', patient.last_name,
    'gender', patient.gender,
    'phone', patient.phone,
    'dateOfBirth', patient.date_of_birth,
    'history', history
  );
end;
$$;

revoke all on function public.get_public_emr(uuid) from public;
grant execute on function public.get_public_emr(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Import confirm (single transaction)
-- ---------------------------------------------------------------------------

create or replace function public.confirm_patient_migration(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  mig public.patient_migrations%rowtype;
  inserted integer := 0;
begin
  select * into mig from public.patient_migrations where id = p_id;
  if not found then
    raise exception 'Importi nuk u gjet.';
  end if;
  if not public.is_clinic_member(mig.clinic_id) or not public.has_role(array['ClinicAdmin']) then
    raise exception 'Nuk keni leje për këtë import.';
  end if;
  if mig.status = 'imported' then
    raise exception 'Ky import është kryer tashmë.';
  end if;

  insert into public.patients (clinic_id, first_name, last_name, date_of_birth, gender, phone, notes)
  select mig.clinic_id, r.first_name, r.last_name, r.date_of_birth, r.gender, nullif(r.phone, ''), null
  from public.patient_migration_rows r
  where r.migration_id = p_id and r.status = 'valid';

  get diagnostics inserted = row_count;

  update public.patient_migrations
  set status = 'imported', imported_rows = inserted
  where id = p_id;

  return jsonb_build_object(
    'importedRows', inserted,
    'validRows', mig.valid_rows,
    'invalidRows', mig.invalid_rows,
    'duplicateRows', mig.duplicate_rows,
    'totalRows', mig.total_rows
  );
end;
$$;

create or replace function public.confirm_case_migration(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  mig public.case_migrations%rowtype;
  rec public.case_migration_rows%rowtype;
  v_patient uuid;
  inserted integer := 0;
begin
  select * into mig from public.case_migrations where id = p_id;
  if not found then
    raise exception 'Importi nuk u gjet.';
  end if;
  if not public.is_clinic_member(mig.clinic_id) or not public.has_role(array['ClinicAdmin']) then
    raise exception 'Nuk keni leje për këtë import.';
  end if;
  if mig.status = 'imported' then
    raise exception 'Ky import është kryer tashmë.';
  end if;

  for rec in
    select * from public.case_migration_rows
    where migration_id = p_id and status = 'valid'
    order by row_number
  loop
    v_patient := null;
    select p.id into v_patient
    from public.patients p
    where p.clinic_id = mig.clinic_id
      and p.deleted_at is null
      and lower(p.first_name) = lower(rec.first_name)
      and lower(p.last_name) = lower(rec.last_name)
      and (rec.date_of_birth is null or p.date_of_birth = rec.date_of_birth)
    order by p.created_at
    limit 1;

    if v_patient is null then
      insert into public.patients (clinic_id, first_name, last_name, date_of_birth, phone)
      values (mig.clinic_id, rec.first_name, rec.last_name, rec.date_of_birth, nullif(rec.phone, ''))
      returning id into v_patient;
    end if;

    insert into public.patient_cases (
      clinic_id, patient_id, status, notes, assigned_doctor_user_id, service_id,
      protocol_number, created_at, completed_at, created_by
    ) values (
      mig.clinic_id,
      v_patient,
      'Mbyllur',
      rec.notes,
      rec.assigned_doctor_user_id,
      rec.service_id,
      nullif(btrim(coalesce(rec.protocol_number, '')), ''),
      coalesce(rec.case_created_at, now()),
      coalesce(rec.case_completed_at, rec.case_created_at, now()),
      auth.uid()
    );
    inserted := inserted + 1;
  end loop;

  update public.case_migrations
  set status = 'imported', imported_rows = inserted
  where id = p_id;

  return jsonb_build_object(
    'importedRows', inserted,
    'validRows', mig.valid_rows,
    'invalidRows', mig.invalid_rows,
    'duplicateRows', mig.duplicate_rows,
    'totalRows', mig.total_rows
  );
end;
$$;

revoke all on function public.confirm_patient_migration(uuid) from public;
revoke all on function public.confirm_case_migration(uuid) from public;
grant execute on function public.confirm_patient_migration(uuid) to authenticated;
grant execute on function public.confirm_case_migration(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- JWT claims hook (enable under Authentication → Hooks if you want role in the token)
-- ---------------------------------------------------------------------------

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb := coalesce(event->'claims', '{}'::jsonb);
  v_role text;
  v_clinic uuid;
  v_mode text;
  v_name text;
begin
  select p.role::text, p.clinic_id, c.clinic_mode::text, c.name
  into v_role, v_clinic, v_mode, v_name
  from public.profiles p
  left join public.clinics c on c.id = p.clinic_id
  where p.id = (event->>'user_id')::uuid;

  if v_role is not null then
    claims := jsonb_set(claims, '{role}', to_jsonb(v_role));
  end if;
  if v_clinic is not null then
    claims := jsonb_set(claims, '{clinicId}', to_jsonb(v_clinic::text));
    claims := jsonb_set(claims, '{clinic_id}', to_jsonb(v_clinic::text));
  end if;
  if v_mode is not null then
    claims := jsonb_set(claims, '{clinicMode}', to_jsonb(v_mode));
  end if;
  if v_name is not null then
    claims := jsonb_set(claims, '{clinicName}', to_jsonb(v_name));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

revoke all on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
do $$ begin
  grant usage on schema public to supabase_auth_admin;
  grant select on table public.profiles, public.clinics to supabase_auth_admin;
  grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
exception when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.clinic_applications enable row level security;
alter table public.doctor_profiles enable row level security;
alter table public.patients enable row level security;
alter table public.services enable row level security;
alter table public.patient_cases enable row level security;
alter table public.case_vitals enable row level security;
alter table public.medical_reports enable row level security;
alter table public.lab_results enable row level security;
alter table public.audit_logs enable row level security;
alter table public.patient_migrations enable row level security;
alter table public.patient_migration_rows enable row level security;
alter table public.case_migrations enable row level security;
alter table public.case_migration_rows enable row level security;
alter table public.mfa_recovery_codes enable row level security;

drop policy if exists clinics_select on public.clinics;
create policy clinics_select on public.clinics for select to authenticated
  using (public.is_clinic_member(id));

drop policy if exists clinics_update on public.clinics;
create policy clinics_update on public.clinics for update to authenticated
  using (public.is_superadmin() or (public.current_role() = 'ClinicAdmin' and id = public.current_clinic_id()))
  with check (public.is_superadmin() or (public.current_role() = 'ClinicAdmin' and id = public.current_clinic_id()));

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_superadmin()
    or (clinic_id is not null and clinic_id = public.current_clinic_id())
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (
    id = auth.uid()
    or public.is_superadmin()
    or (public.current_role() = 'ClinicAdmin' and clinic_id = public.current_clinic_id())
  )
  with check (
    id = auth.uid()
    or public.is_superadmin()
    or (public.current_role() = 'ClinicAdmin' and clinic_id = public.current_clinic_id())
  );

drop policy if exists applications_select on public.clinic_applications;
create policy applications_select on public.clinic_applications for select to authenticated
  using (public.is_superadmin() or user_id = auth.uid());

drop policy if exists doctor_profiles_all on public.doctor_profiles;
create policy doctor_profiles_all on public.doctor_profiles for all to authenticated
  using (user_id = auth.uid() or public.is_superadmin())
  with check (user_id = auth.uid() or public.is_superadmin());

drop policy if exists doctor_profiles_clinic_read on public.doctor_profiles;
create policy doctor_profiles_clinic_read on public.doctor_profiles
for select to authenticated
using (
  exists (
    select 1 from public.profiles doc
    where doc.id = doctor_profiles.user_id
      and public.is_clinic_member(doc.clinic_id)
  )
);

drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients for select to authenticated
  using (public.is_clinic_member(clinic_id));

drop policy if exists patients_insert on public.patients;
create policy patients_insert on public.patients for insert to authenticated
  with check (
    public.is_clinic_member(clinic_id)
    and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse'])
  );

drop policy if exists patients_update on public.patients;
create policy patients_update on public.patients for update to authenticated
  using (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse']))
  with check (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse']));

drop policy if exists patients_delete on public.patients;
create policy patients_delete on public.patients for delete to authenticated
  using (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin', 'Doctor']));

drop policy if exists services_select on public.services;
create policy services_select on public.services for select to authenticated
  using (public.is_clinic_member(clinic_id));

drop policy if exists services_write on public.services;
create policy services_write on public.services for all to authenticated
  using (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin']))
  with check (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin']));

drop policy if exists cases_select on public.patient_cases;
create policy cases_select on public.patient_cases for select to authenticated
  using (public.is_clinic_member(clinic_id));

drop policy if exists cases_insert on public.patient_cases;
create policy cases_insert on public.patient_cases for insert to authenticated
  with check (
    public.is_clinic_member(clinic_id)
    and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse'])
  );

drop policy if exists cases_update on public.patient_cases;
create policy cases_update on public.patient_cases for update to authenticated
  using (
    public.is_clinic_member(clinic_id)
    and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse'])
  )
  with check (
    public.is_clinic_member(clinic_id)
    and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse'])
  );

drop policy if exists cases_delete on public.patient_cases;
create policy cases_delete on public.patient_cases for delete to authenticated
  using (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin', 'Doctor']));

drop policy if exists vitals_select on public.case_vitals;
create policy vitals_select on public.case_vitals for select to authenticated
  using (public.is_clinic_member(clinic_id));

drop policy if exists vitals_write on public.case_vitals;
create policy vitals_write on public.case_vitals for all to authenticated
  using (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse']))
  with check (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse']));

drop policy if exists reports_select on public.medical_reports;
create policy reports_select on public.medical_reports for select to authenticated
  using (public.is_clinic_member(clinic_id));

drop policy if exists reports_write on public.medical_reports;
create policy reports_write on public.medical_reports for all to authenticated
  using (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin', 'Doctor']))
  with check (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin', 'Doctor']));

drop policy if exists labs_select on public.lab_results;
create policy labs_select on public.lab_results for select to authenticated
  using (public.is_clinic_member(clinic_id));

drop policy if exists labs_write on public.lab_results;
create policy labs_write on public.lab_results for all to authenticated
  using (
    public.is_clinic_member(clinic_id)
    and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse', 'LabTechnician'])
  )
  with check (
    public.is_clinic_member(clinic_id)
    and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse', 'LabTechnician'])
  );

drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs for select to authenticated
  using (
    public.is_superadmin()
    or (public.current_role() = 'ClinicAdmin' and clinic_id = public.current_clinic_id())
  );

drop policy if exists audit_insert on public.audit_logs;
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      public.is_superadmin()
      or clinic_id = public.current_clinic_id()
    )
  );

drop policy if exists patient_mig_all on public.patient_migrations;
create policy patient_mig_all on public.patient_migrations for all to authenticated
  using (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin']))
  with check (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin']));

drop policy if exists patient_mig_rows on public.patient_migration_rows;
create policy patient_mig_rows on public.patient_migration_rows for all to authenticated
  using (
    exists (
      select 1 from public.patient_migrations m
      where m.id = migration_id
        and public.is_clinic_member(m.clinic_id)
        and public.has_role(array['ClinicAdmin'])
    )
  )
  with check (
    exists (
      select 1 from public.patient_migrations m
      where m.id = migration_id
        and public.is_clinic_member(m.clinic_id)
        and public.has_role(array['ClinicAdmin'])
    )
  );

drop policy if exists case_mig_all on public.case_migrations;
create policy case_mig_all on public.case_migrations for all to authenticated
  using (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin']))
  with check (public.is_clinic_member(clinic_id) and public.has_role(array['ClinicAdmin']));

drop policy if exists case_mig_rows on public.case_migration_rows;
create policy case_mig_rows on public.case_migration_rows for all to authenticated
  using (
    exists (
      select 1 from public.case_migrations m
      where m.id = migration_id
        and public.is_clinic_member(m.clinic_id)
        and public.has_role(array['ClinicAdmin'])
    )
  )
  with check (
    exists (
      select 1 from public.case_migrations m
      where m.id = migration_id
        and public.is_clinic_member(m.clinic_id)
        and public.has_role(array['ClinicAdmin'])
    )
  );

drop policy if exists mfa_codes_own on public.mfa_recovery_codes;
create policy mfa_codes_own on public.mfa_recovery_codes for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('clinic-assets', 'clinic-assets', true, 5242880),
  ('doctor-assets', 'doctor-assets', true, 5242880),
  ('lab-results', 'lab-results', false, 20971520)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists clinic_assets_read on storage.objects;
create policy clinic_assets_read on storage.objects for select to public
  using (bucket_id = 'clinic-assets');

drop policy if exists clinic_assets_write on storage.objects;
create policy clinic_assets_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'clinic-assets'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clinic_id()::text
    )
    and public.has_role(array['ClinicAdmin'])
  );

drop policy if exists clinic_assets_update on storage.objects;
create policy clinic_assets_update on storage.objects for update to authenticated
  using (
    bucket_id = 'clinic-assets'
    and public.has_role(array['ClinicAdmin'])
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clinic_id()::text
    )
  );

drop policy if exists doctor_assets_read on storage.objects;
create policy doctor_assets_read on storage.objects for select to public
  using (bucket_id = 'doctor-assets');

drop policy if exists doctor_assets_write on storage.objects;
create policy doctor_assets_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'doctor-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists doctor_assets_update on storage.objects;
create policy doctor_assets_update on storage.objects for update to authenticated
  using (
    bucket_id = 'doctor-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists lab_results_read on storage.objects;
create policy lab_results_read on storage.objects for select to authenticated
  using (
    bucket_id = 'lab-results'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clinic_id()::text
    )
  );

drop policy if exists lab_results_write on storage.objects;
create policy lab_results_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lab-results'
    and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse', 'LabTechnician'])
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clinic_id()::text
    )
  );

drop policy if exists lab_results_delete on storage.objects;
create policy lab_results_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'lab-results'
    and public.has_role(array['ClinicAdmin', 'Doctor', 'LabTechnician'])
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clinic_id()::text
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.patient_cases replica identity full;
alter table public.case_vitals replica identity full;
alter table public.medical_reports replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.patient_cases;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.case_vitals;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.medical_reports;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Demo clinic, users, and a small clinical dataset
-- ---------------------------------------------------------------------------

insert into public.clinics (
  id, name, address, phone, email, description, clinic_mode
) values (
  '11111111-1111-1111-1111-111111111111',
  'Klinika Demo',
  'Rruga e Kavajës, Tiranë',
  '+355 69 000 0000',
  'admin@iklinika.demo',
  'Klinikë demonstruese për versionin demo.',
  'FullTeam'
) on conflict (id) do nothing;

select public._provision_auth_user(
  'superadmin@iklinika.demo',
  'DemoAdmin123!',
  jsonb_build_object('role', 'SuperAdmin', 'displayName', 'Super Admin')
) where not exists (select 1 from auth.users where lower(email) = 'superadmin@iklinika.demo');

select public._provision_auth_user(
  'admin@iklinika.demo',
  'DemoClinic123!',
  jsonb_build_object(
    'role', 'ClinicAdmin',
    'displayName', 'Administrator Demo',
    'clinicId', '11111111-1111-1111-1111-111111111111'
  )
) where not exists (select 1 from auth.users where lower(email) = 'admin@iklinika.demo');

select public._provision_auth_user(
  'doctor@iklinika.demo',
  'DemoDoctor123!',
  jsonb_build_object(
    'role', 'Doctor',
    'displayName', 'Dr. Elira Kola',
    'clinicId', '11111111-1111-1111-1111-111111111111'
  )
) where not exists (select 1 from auth.users where lower(email) = 'doctor@iklinika.demo');

select public._provision_auth_user(
  'nurse@iklinika.demo',
  'DemoNurse123!',
  jsonb_build_object(
    'role', 'Nurse',
    'displayName', 'Infermiere Ana Duka',
    'clinicId', '11111111-1111-1111-1111-111111111111'
  )
) where not exists (select 1 from auth.users where lower(email) = 'nurse@iklinika.demo');

select public._provision_auth_user(
  'lab@iklinika.demo',
  'DemoLab123!',
  jsonb_build_object(
    'role', 'LabTechnician',
    'displayName', 'Teknik Laboratori',
    'clinicId', '11111111-1111-1111-1111-111111111111'
  )
) where not exists (select 1 from auth.users where lower(email) = 'lab@iklinika.demo');

insert into public.services (id, clinic_id, name, price)
values
  ('51111111-1111-4111-8111-111111111111', '11111111-1111-1111-1111-111111111111', 'Konsultë mjekësore', 20.00),
  ('52222222-2222-4222-8222-222222222222', '11111111-1111-1111-1111-111111111111', 'EKG', 15.00)
on conflict (id) do nothing;

insert into public.patients (id, clinic_id, first_name, last_name, date_of_birth, gender, phone, notes)
values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Arta', 'Berisha', '1992-04-12', 'Female', '+355 68 111 1111', 'Pacient demonstrues'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Besnik', 'Hoxha', '1984-11-03', 'Male', '+355 69 222 2222', null)
on conflict (id) do nothing;

insert into public.patient_cases (
  id, clinic_id, patient_id, status, notes, assigned_doctor_user_id, service_id, protocol_number, created_at
)
select
  'c1111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'Waiting',
  'Kontroll rutinë',
  p.id,
  '51111111-1111-4111-8111-111111111111',
  'P-1001',
  now()
from public.profiles p
where p.email = 'doctor@iklinika.demo'
on conflict (id) do nothing;

insert into public.patient_cases (
  id, clinic_id, patient_id, status, notes, assigned_doctor_user_id, service_id,
  protocol_number, created_at, completed_at
)
select
  'c2222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'Finished',
  'Vizita e përfunduar',
  p.id,
  '52222222-2222-4222-8222-222222222222',
  'P-1002',
  now() - interval '2 hours',
  now() - interval '1 hour'
from public.profiles p
where p.email = 'doctor@iklinika.demo'
on conflict (id) do nothing;

insert into public.case_vitals (
  patient_case_id, clinic_id, weight_kg, systolic_pressure, diastolic_pressure, temperature_c, heart_rate
)
select
  'c2222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  78.5, 120, 80, 36.6, 72
where not exists (
  select 1 from public.case_vitals
  where patient_case_id = 'c2222222-2222-2222-2222-222222222222'
);

insert into public.medical_reports (
  patient_case_id, clinic_id, anamneza, ekzaminimi, diagnosis, therapy, doctor_user_id
)
select
  'c2222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Dhimbje koke prej dy ditësh.',
  'Pacient i qetë, pa shenja neurologjike fokale.',
  'Cefale tensionale',
  'Pushim dhe hidrim. Rikontroll nëse simptomat vazhdojnë.',
  p.id
from public.profiles p
where p.email = 'doctor@iklinika.demo'
on conflict (patient_case_id) do nothing;
