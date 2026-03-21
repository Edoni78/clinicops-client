# ClinicOps Client – What’s Done (Notion / Todo Notes)

Use this as a checklist or Notion-style notes for what is implemented. Not full docs.

---

## Auth & entry

- [x] Login page (`/login`) – email + password, JWT stored
- [x] Auth context – user, role, login, logout, isAuthenticated
- [x] Protected routes – dashboard requires auth
- [x] Apply for clinic – public apply flow (clinic name, email, password)
- [x] Home/landing – Navbar + Entry component
- [x] JWT in localStorage – accessToken, user, role normalization (Role → role)
- [x] After login – navigate to `/dashboard` (panel selection for Nurse / Doctor / SuperAdmin)

---

## Dashboard layout & nav

- [x] Dashboard layout – sidebar + main content area
- [x] **Role panels** – Nurse, Doctor, SuperAdmin must pick a panel at `/dashboard/panel` first; choice stored in localStorage (`clinicops_active_panel`)
- [x] Wrong panel for role – e.g. Nurse clicks Doctor or SuperAdmin card → error notification (not logged in for that role)
- [x] SuperAdmin – can open any of the three panels; sidebar matches panel (infermier / mjek / super admin)
- [x] ClinicAdmin & LabTechnician – no panel chooser; full sidebar as before (all clinic items)
- [x] **Ndërro panelin** (TopBar) – clears panel and goes back to `/dashboard/panel`
- [x] Panel selection screen – no sidebar; own header + Dilni (uses AuthContext logout)
- [x] Sidebar (nurse panel) – Paneli, Pacientët, Lista e pacientëve, Rastet, Laboratori
- [x] Sidebar (doctor panel) – Paneli, Rastet, Raportet, Profili i mjekut (if Doctor), Laboratori
- [x] Sidebar (superadmin panel) – Paneli, Aplikimet, Pacientët, Lista, Rastet, Raportet, Laboratori, Shërbimet, Stafi
- [x] Sidebar (clinic roles, no panel) – Aplikimet if SuperAdmin (N/A here), full menu + Profili i klinikës + Profili i mjekut if Doctor
- [x] Route guards – Applies & Staff (SuperAdmin) and Services require **SuperAdmin panel** when user is SuperAdmin; otherwise redirect to `/dashboard`
- [x] TopBar – doctor display name, Profili link, Ndërro panelin (if panel user), Dilni via `logout()`
- [x] Dashboard home – quick action cards (register patient, patients, cases, reports, laboratory, payments)

---

## Patients

- [x] Register patient page (`/dashboard/patients`) – form: first name, last name, DOB, gender, phone, notes
- [x] Patient registration API – POST with clinicId (from JWT or default for SuperAdmin)
- [x] Patients list page (`/dashboard/patients-list`) – list/view patients (if implemented in your app)

---

## Cases

- [x] Cases list (`/dashboard/cases`) – table: patient, date, status, link to detail
- [x] Case status labels – Në pritje, Në progres, Në konsultim, Përfunduar, Mbyllur
- [x] Case detail (`/dashboard/cases/:id`) – full case view
- [x] Nurse section (when role nurse) – vitals form (weight, blood pressure, temp, heart rate), submit vitals, send to doctor
- [x] Doctor section (when role doctor) – live vitals, status buttons, medical report form (anamneza, diagnosis, therapy), submit report, finish/close visit
- [x] Case status updates – InProgress, InConsultation, Completed, Finished
- [x] Real-time updates – SignalR for vitals, report, status (list and detail refresh)
- [x] Download case report PDF – button calls backend GET case PDF (report + merged lab PDFs)

---

## Lab results

- [x] Lab results API – list, upload PDF, download single file
- [x] Case detail – “Rezultatet e laboratorit” section: list labs, upload PDF, download per file
- [x] Laboratory page (`/dashboard/laboratory`) – all cases listed with lab section per case
- [x] Laboratory – add PDF per case from this page
- [x] Laboratory – date filter: Të gjitha, Sot, Dje
- [x] Laboratory – date search (date picker) to filter cases by date
- [x] Empty state when no labs; success/error notifications

---

## Reports

- [x] Reports page (`/dashboard/reports`) – list completed cases (e.g. by date filter)
- [x] Date filters – Sot, Këtë javë, Të gjitha
- [x] Download report PDF per case – from backend (report + labs merged)

---

## Services (clinic services & prices)

- [x] Services API – list, get, create, update, delete (optional clinicId for SuperAdmin)
- [x] Services page (`/dashboard/services`) – list all services (name, price, created date)
- [x] Add service – form (name max 300, price ≥ 0), validation, POST
- [x] Edit service – modal, PUT, refresh list
- [x] Delete service – confirm modal, DELETE (soft-delete), refresh list
- [x] Empty state; only for users with clinic (or SuperAdmin with clinicId)

---

## Clinic profile

- [x] Clinic profile page (`/dashboard/clinic-profile`) – for users with clinic
- [x] Get/update clinic profile – name, address, phone, description
- [x] Upload clinic logo – image upload, display
- [x] Redirect to dashboard if no clinic

---

## Doctor profile

- [x] Doctor profile page (`/dashboard/doctor-profile`) – for Doctor role
- [x] Get/update doctor profile – display name etc.
- [x] Upload signature image
- [x] Upload stamp image
- [x] TopBar can show “Logged in as {displayName}” for doctors

---

## Staff (clinic users)

- [x] Staff page (`/dashboard/staff`) – ClinicAdmin / SuperAdmin
- [x] List clinic users – GET with optional role filter, clinicId for SuperAdmin
- [x] Create clinic user – email, password, role (Doctor, Nurse, LabTechnician), POST with clinicId for SuperAdmin
- [x] Role filter – Mjek, Infermier, Teknikian laboratori
- [x] No access message if not ClinicAdmin/SuperAdmin

---

## Applies (clinic applications – SuperAdmin)

- [x] Applies page (`/dashboard/applies`) – SuperAdmin only
- [x] List applications – by status
- [x] Approve application – with optional review note
- [x] Reject application – with optional review note
- [x] Redirect or hide if not SuperAdmin

---

## API modules (what’s used)

- [x] auth – login, applyForClinic
- [x] axios – base URL, Bearer token, FormData Content-Type fix for uploads
- [x] clinic – getClinicProfile, updateClinicProfile, uploadClinicLogo, getLogoFullUrl, getLogoAsBase64
- [x] clinicUser – listClinicUsers, createClinicUser (params: role, clinicId for SuperAdmin)
- [x] clinicApplication – listApplications, approveApplication, rejectApplication
- [x] patientCase – getPatientCases, getPatientCase, submitVitals, submitReport, updateCaseStatus, getCaseReportPdf, getLabResults, uploadLabResult, downloadLabResultFile
- [x] service – listServices, getService, createService, updateService, deleteService (clinicId for SuperAdmin)
- [x] doctorProfile – getDoctorProfile, updateDoctorProfile, uploadDoctorSignature, uploadDoctorStamp, getDoctorImageFullUrl, getDoctorImageAsBase64

---

## Utils & infra

- [x] JWT – getJwtPayload, token expiry if used
- [x] clinicId – getClinicId() from JWT, fallback default for SuperAdmin
- [x] caseReportPdf – downloadCaseReportPdfFromBackend (GET case PDF, trigger download)
- [x] SignalR – join clinic, onVitalsUpdated, onReportUpdated, onCaseStatusChanged
- [x] Notification – toast-style success/error/info

---

## Not done / commented

- [ ] Payments – route and page commented (`/dashboard/payments`)
- [ ] CreateClinic (old) – CreateClinic.jsx deleted; ClinicApply.jsx exists for apply flow

---

## Roles (used in UI)

- SuperAdmin – Aplikimet, clinicId query for Staff/Services when no clinic in JWT
- ClinicAdmin – Staff management, clinic profile
- Doctor – Doctor profile, case report (diagnosis, therapy), status flow
- Nurse – Vitals, send case to doctor
- LabTechnician – (same dashboard; lab results usable by any role with case access)
- hasClinic – Profili i klinikës, Services (and clinic-scoped APIs)

---

*Copy-paste sections into Notion or use as a todo checklist. Update as you add features.*
