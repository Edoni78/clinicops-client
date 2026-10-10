-- Solo-doctor clinic for Edon Aliu.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).
-- The main schema migration must already be applied, because this uses
-- public._provision_auth_user.
--
-- Login after it succeeds:
--   email:    edonaliu10@gmail.com
--   password: EdonAliu2004.

do $$
declare
  v_clinic uuid := '22222222-2222-4222-8222-222222222222';
  v_service uuid := '23333333-3333-4333-8333-333333333333';
  v_user uuid;
  v_email text := 'edonaliu10@gmail.com';
  v_password text := 'EdonAliu2004.';
begin
  insert into public.clinics (
    id, name, email, description, clinic_mode, is_active
  ) values (
    v_clinic,
    'Ordinanca Edon Aliu',
    v_email,
    'Ordinancë solo. Mjeku është edhe administratori i klinikës.',
    'SoloDoctor',
    true
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        description = excluded.description,
        clinic_mode = 'SoloDoctor',
        is_active = true;

  select id into v_user
  from auth.users
  where lower(email) = v_email;

  if v_user is null then
    v_user := public._provision_auth_user(
      v_email,
      v_password,
      jsonb_build_object(
        'role', 'ClinicAdmin',
        'displayName', 'Edon Aliu',
        'clinicId', v_clinic::text,
        'clinicMode', 'SoloDoctor'
      )
    );
  else
    update auth.users
    set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = v_user;
  end if;

  -- The profile-protect trigger blocks role changes unless a signed-in
  -- super admin makes them. The SQL editor has no auth.uid(), so skip
  -- user triggers for this one update.
  perform set_config('session_replication_role', 'replica', true);
  update public.profiles
  set role = 'ClinicAdmin',
      clinic_id = v_clinic,
      is_active = true,
      display_name = 'Edon Aliu',
      email = v_email
  where id = v_user;
  perform set_config('session_replication_role', 'origin', true);

  insert into public.doctor_profiles (user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  insert into public.services (id, clinic_id, name, price, is_active)
  values (v_service, v_clinic, 'Konsultë mjekësore', 20.00, true)
  on conflict (id) do update
    set name = excluded.name,
        price = excluded.price,
        is_active = true;

  update public.clinic_applications
  set status = 'Approved',
      clinic_id = v_clinic,
      reviewed_at = coalesce(reviewed_at, now())
  where user_id = v_user
    and status = 'Pending';
end $$;
