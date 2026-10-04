-- Clinic staff (nurse, admin, doctor) can read the assigned doctor's
-- signature and stamp paths so visit PDFs can print them.
-- Writes stay limited to the doctor who owns the profile.

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
