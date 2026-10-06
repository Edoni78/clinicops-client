-- Doctors read and write clinical notes only on cases assigned to them.
-- Nurses and clinic admins keep clinic-wide access.
-- Write policies are split off SELECT so a broad FOR ALL policy cannot
-- leak another doctor's report or vitals.

drop policy if exists reports_select on public.medical_reports;
drop policy if exists reports_write on public.medical_reports;
drop policy if exists reports_insert on public.medical_reports;
drop policy if exists reports_update on public.medical_reports;
drop policy if exists reports_delete on public.medical_reports;

create policy reports_select on public.medical_reports for select to authenticated
  using (
    public.is_clinic_member(clinic_id)
    and (
      public.current_role() is distinct from 'Doctor'
      or exists (
        select 1
        from public.patient_cases c
        where c.id = medical_reports.patient_case_id
          and c.assigned_doctor_user_id = auth.uid()
      )
    )
  );

create policy reports_insert on public.medical_reports for insert to authenticated
  with check (
    public.is_clinic_member(clinic_id)
    and (
      public.has_role(array['ClinicAdmin'])
      or (
        public.has_role(array['Doctor'])
        and exists (
          select 1
          from public.patient_cases c
          where c.id = medical_reports.patient_case_id
            and c.assigned_doctor_user_id = auth.uid()
        )
      )
    )
  );

create policy reports_update on public.medical_reports for update to authenticated
  using (
    public.is_clinic_member(clinic_id)
    and (
      public.has_role(array['ClinicAdmin'])
      or (
        public.has_role(array['Doctor'])
        and exists (
          select 1
          from public.patient_cases c
          where c.id = medical_reports.patient_case_id
            and c.assigned_doctor_user_id = auth.uid()
        )
      )
    )
  )
  with check (
    public.is_clinic_member(clinic_id)
    and (
      public.has_role(array['ClinicAdmin'])
      or (
        public.has_role(array['Doctor'])
        and exists (
          select 1
          from public.patient_cases c
          where c.id = medical_reports.patient_case_id
            and c.assigned_doctor_user_id = auth.uid()
        )
      )
    )
  );

create policy reports_delete on public.medical_reports for delete to authenticated
  using (
    public.is_clinic_member(clinic_id)
    and (
      public.has_role(array['ClinicAdmin'])
      or (
        public.has_role(array['Doctor'])
        and exists (
          select 1
          from public.patient_cases c
          where c.id = medical_reports.patient_case_id
            and c.assigned_doctor_user_id = auth.uid()
        )
      )
    )
  );

drop policy if exists vitals_select on public.case_vitals;
drop policy if exists vitals_write on public.case_vitals;
drop policy if exists vitals_insert on public.case_vitals;
drop policy if exists vitals_update on public.case_vitals;
drop policy if exists vitals_delete on public.case_vitals;

create policy vitals_select on public.case_vitals for select to authenticated
  using (
    public.is_clinic_member(clinic_id)
    and (
      public.current_role() is distinct from 'Doctor'
      or exists (
        select 1
        from public.patient_cases c
        where c.id = case_vitals.patient_case_id
          and c.assigned_doctor_user_id = auth.uid()
      )
    )
  );

create policy vitals_insert on public.case_vitals for insert to authenticated
  with check (
    public.is_clinic_member(clinic_id)
    and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse'])
  );

create policy vitals_update on public.case_vitals for update to authenticated
  using (
    public.is_clinic_member(clinic_id)
    and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse'])
  )
  with check (
    public.is_clinic_member(clinic_id)
    and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse'])
  );

create policy vitals_delete on public.case_vitals for delete to authenticated
  using (
    public.is_clinic_member(clinic_id)
    and public.has_role(array['ClinicAdmin', 'Doctor', 'Nurse'])
  );
