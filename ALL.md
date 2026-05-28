# ClinicOps (iKlinika) — Full feature overview

This document lists **everything implemented** in the ClinicOps system as used by this project. It is based on the **React frontend** (`clinicops-client`) and the **REST + SignalR API** the frontend calls.

> **Note:** The .NET backend repository was not in the same workspace when this file was written. Backend sections describe **endpoints and behavior inferred from the client** and `BACKEND-API-NOTES.md`. If your API differs, compare with your server controllers.

---

## Table of contents

1. [What the system does](#1-what-the-system-does)
2. [Tech stack](#2-tech-stack)
3. [User roles and menu access](#3-user-roles-and-menu-access)
4. [Public (unauthenticated) pages](#4-public-unauthenticated-pages)
5. [Authentication and session](#5-authentication-and-session)
6. [Dashboard layout and navigation](#6-dashboard-layout-and-navigation)
7. [Feature modules (by screen)](#7-feature-modules-by-screen)
8. [Patient case workflow](#8-patient-case-workflow)
9. [Real-time updates (SignalR)](#9-real-time-updates-signalr)
10. [PDF reports](#10-pdf-reports)
11. [Clinic modes](#11-clinic-modes)
12. [Backend API reference](#12-backend-api-reference)
13. [Configuration](#13-configuration)
14. [Gaps and notes](#14-gaps-and-notes)

---

## 1. What the system does

ClinicOps is a **clinic management web app** for:

- Onboarding new clinics (application → super admin approval)
- Managing clinic profile, logo, and staff users
- Registering patients and opening **cases** (one visit episode)
- Nurse vitals → doctor consultation → medical report → case closure
- Lab PDF uploads per case
- Service catalog and prices linked to cases
- Payments overview (completed/closed visits with amounts)
- PDF visit reports (backend-generated, includes lab attachments when configured)

Primary UI language: **Albanian** (sidebar labels, statuses, messages).

---

## 2. Tech stack

| Layer | Technology |
|--------|------------|
| Frontend | React 19, React Router 7, Tailwind CSS |
| HTTP | Axios (`REACT_APP_API_BASE_URL`) |
| Auth | JWT in `localStorage` (`accessToken`, `user`) |
| Real-time | SignalR (`@microsoft/signalr`) — hub `/hubs/clinic` |
| PDF (client) | jsPDF + html2canvas (optional client-side path); main flow uses **backend PDF** |

---

## 3. User roles and menu access

Roles come from login (`user.role` / JWT). The sidebar and route guard use `src/utils/dashboardMenu.js`.

| Role | Sidebar (main items) | Notes |
|------|----------------------|--------|
| **Doctor** | Paneli, Rastet, Raportet, Profili i mjekut | No Lab, Payments, Patients, Staff, Services |
| **Nurse** | Paneli, Pacientët, Lista e pacientëve, Rastet, Raportet | No Lab in menu (lab still on case detail if reachable) |
| **LabTechnician** | Paneli, Laboratori, Rastet | Upload/download lab PDFs |
| **ClinicAdmin** | Full clinic menu: patients, cases, reports, lab, services, **payments**, staff, clinic profile | No “Aplikimet” |
| **SuperAdmin** | Depends on **active panel** (see below) | Platform-wide |

**SuperAdmin panels** (`/dashboard/panel`):

| Panel chosen | Menu |
|--------------|------|
| Super administrator | Aplikimet, patients, cases, reports, lab, services, payments, staff |
| Doctor panel | Same as Doctor role |
| Nurse panel | Same as Nurse role |

- Only **SuperAdmin** must pick a panel at login.
- **Doctor** / **Nurse** are auto-assigned to their panel (no picker).
- **Ndërro panelin** in the top bar (SuperAdmin only) clears panel and returns to panel selection.

Direct URLs to disallowed routes redirect to `/dashboard`.

---

## 4. Public (unauthenticated) pages

| Route | Purpose |
|-------|---------|
| `/` | Marketing / home landing |
| `/apply` | New clinic application (name, email, password, clinic mode) |
| `/login` | Clinic user login (email + password) |

---

## 5. Authentication and session

### Login

- **POST** `/api/Auth/login` — body: `{ email, password }`
- Response: `accessToken`, optional `expiresAtUtc`, `user` (`id`, `email`, `clinicId`, `clinicName`, `role`, …)
- Frontend stores token + user; redirects to `/dashboard`

### Apply for clinic (public)

- **POST** `/api/Auth/apply` — body: `clinicName`, `email`, `password`, `clinicMode` (0 = SoloDoctor, 1 = FullTeam)
- Creates a **pending** application; SuperAdmin approves later

### Session

- `AuthContext`: `user`, `role`, `clinicMode`, `login()`, `logout()`, `loading`
- Role also read from JWT if missing on stored user (`getRoleFromJwt`)
- Protected routes: `/dashboard/*` requires login (`ProtectedRoute`)

### Logout

- Clears `accessToken`, `user`, `token_expires`, `clinicops_active_panel`

---

## 6. Dashboard layout and navigation

| Route | Screen |
|-------|--------|
| `/dashboard` | Home — stats + quick actions (filtered by role) |
| `/dashboard/panel` | Panel picker (SuperAdmin only) |
| `/dashboard/patients` | Register new patient |
| `/dashboard/patients-list` | Search/list patients |
| `/dashboard/cases` | Case list |
| `/dashboard/cases/:id` | Case detail |
| `/dashboard/cases/:id/:view` | Case detail (`nurse` / `doctor` view hint) |
| `/dashboard/reports` | Completed visits + PDF |
| `/dashboard/laboratory` | All cases — lab PDF per case |
| `/dashboard/services` | Service catalog CRUD |
| `/dashboard/payments` | Payments / billing overview |
| `/dashboard/staff` | Clinic users CRUD |
| `/dashboard/applies` | Clinic applications (SuperAdmin) |
| `/dashboard/clinic-profile` | Clinic profile + logo |
| `/dashboard/doctor-profile` | Doctor signature/stamp/display name |

**Layout:** Sidebar (clinic logo + name when logged in with clinic), top bar (welcome, switch panel, logout), main content.

---

## 7. Feature modules (by screen)

### 7.1 Dashboard home (`/dashboard`)

- Stats: total patients, active cases, today’s cases (from `GET /api/Patient` + `GET /api/PatientCase`)
- Quick action cards — **only links allowed for current role** (same rules as sidebar)

### 7.2 Register patient (`/dashboard/patients`)

- Form: first name, last name, date of birth, gender, phone, notes
- **POST** `/api/Patient/register` — creates patient + opens a new case (`patientCaseId` in response)
- Redirects to case detail after success
- `clinicId` from JWT (SuperAdmin fallback GUID if missing)

### 7.3 Patients list (`/dashboard/patients-list`)

- **GET** `/api/Patient` — list all patients for clinic
- Search by name or phone
- Link to register new patient

### 7.4 Cases list (`/dashboard/cases`)

- **GET** `/api/PatientCase` — optional `?status=` filter
- Tabs: active vs completed/closed
- Filters: quick date (today/yesterday/week), custom day/month/year, name search
- Real-time refresh on vitals/report/status events (SignalR)
- Role-aware navigation (e.g. doctor vs nurse entry to case)
- Highlights if another case is already `InConsultation`

### 7.5 Case detail (`/dashboard/cases/:id`)

**Shared**

- Patient info card (name, DOB, gender, phone, status)
- Lab results section: list, upload PDF, download PDF
- Attach **service** to case (dropdown from clinic services)
- Download / print case report PDF (backend)

**Nurse** (hidden for Doctor role and in SoloDoctor mode)

- Vitals form: weight, blood pressure, temperature, heart rate
- **POST** `/api/PatientCase/{id}/vitals`
- Status transitions (e.g. send toward consultation)

**Doctor**

- View latest vitals
- Medical report: anamneza, diagnosis, therapy
- **POST** `/api/PatientCase/{id}/report`
- Status buttons: InConsultation → Completed → Finished (and related)
- **PATCH** `/api/PatientCase/{id}/status?status=...`
- Only one case `InConsultation` at a time (UI lock)
- Doctor profile images used in report UI when available

**Views**

- `?view=nurse` / `?view=doctor` or route param `:view` controls which sections show

### 7.6 Reports (`/dashboard/reports`)

- Lists cases with statuses Completed / Finished
- Date filters: today, yesterday, this week, all; name search; custom date
- Service name/price enrichment when missing on list API
- **Download** and **print** PDF per case (backend `GET .../pdf`)

### 7.7 Laboratory (`/dashboard/laboratory`)

- Lists all cases with per-case lab file list
- Upload PDF per case, download files
- Filters: all / today / yesterday, date picker
- Hidden redirect on **SoloDoctor** clinic mode (page redirects to dashboard)

### 7.8 Services (`/dashboard/services`)

- **GET/POST** `/api/Service` — list, create (name, price)
- **PUT/DELETE** `/api/Service/{id}` — update, soft-delete
- SuperAdmin must use **super admin panel** and pass `clinicId` query when needed
- Modal edit, delete confirmation

### 7.9 Payments (`/dashboard/payments`)

- Read-only overview of **Completed** and **Finished** cases
- Shows service price totals, filters (today, yesterday, week, all), status tabs, name search
- Aggregates revenue-style stats from case + service data (no separate payment API in client)

### 7.10 Staff (`/dashboard/staff`)

- **ClinicAdmin** or **SuperAdmin** (super admin panel)
- **GET** `/api/ClinicUser` — list users; filter by role; `clinicId` for SuperAdmin
- **POST** `/api/ClinicUser` — create user: email, password, role (`Doctor`, `Nurse`, `LabTechnician`)
- SoloDoctor clinics: only **Doctor** role in create form

### 7.11 Applies (`/dashboard/applies`)

- **SuperAdmin** only (super admin panel)
- **GET** `/api/ClinicApplication` — filter Pending / Approved / Rejected
- **POST** `/api/ClinicApplication/{id}/approve` — optional `ReviewNote`; creates clinic + ClinicAdmin
- **POST** `/api/ClinicApplication/{id}/reject` — optional `ReviewNote`

### 7.12 Clinic profile (`/dashboard/clinic-profile`)

- **GET/PUT** `/api/Clinic/profile` — name, address, phone, description
- **POST** `/api/Clinic/profile/logo` — multipart logo image
- Sidebar shows clinic logo + name when profile loads

### 7.13 Doctor profile (`/dashboard/doctor-profile`)

- **Doctor** role only
- **GET/PUT** `/api/DoctorProfile/profile` — display name
- **POST** signature and stamp images (multipart)
- Top bar can show doctor display name + link to profile

---

## 8. Patient case workflow

### Statuses (Albanian labels in UI)

| Status | Label | Typical next |
|--------|--------|----------------|
| `Waiting` | Në pritje | InProgress |
| `InProgress` | Në progres | InConsultation |
| `InConsultation` | Në konsultim | Completed |
| `Completed` | Përfunduar | Finished |
| `Finished` | Mbyllur | — |

### Happy path (FullTeam clinic)

1. Nurse/admin registers patient → new case created  
2. Nurse records vitals, advances status  
3. Doctor opens case, starts consultation (`InConsultation`)  
4. Doctor writes report (diagnosis, therapy, anamneza)  
5. Doctor completes visit → `Completed` → optionally `Finished` for archive/billing  
6. Lab tech may upload PDFs anytime on case or Laboratory page  
7. Admin views **Payments** / **Reports** for closed visits  

### SoloDoctor mode

- No nurse vitals section on case detail  
- Laboratory page disabled  
- Staff creation limited to Doctor role  

---

## 9. Real-time updates (SignalR)

| Item | Value |
|------|--------|
| Hub URL | `{API_BASE}/hubs/clinic` |
| Auth | JWT via `accessTokenFactory` |
| Join clinic | `JoinClinic(clinicId)` |
| Join case room | `JoinPatientCase(patientCaseId)` |

**Server → client events (subscribed in UI)**

| Event | Used for |
|--------|----------|
| `VitalsUpdated` | Refresh case list / detail vitals |
| `ReportUpdated` | Refresh report section |
| `CaseStatusChanged` | Refresh status badges and lists |

Provider: `SignalRContext` (wraps app in `index.js`).

---

## 10. PDF reports

### Backend PDF (primary)

- **GET** `/api/PatientCase/{id}/pdf` — returns PDF blob (report + merged lab PDFs per backend)
- Used on Reports, Case detail, Payments-related flows
- `downloadCaseReportPdfFromBackend` / `printCaseReportPdfFromBackend` in `src/utils/caseReportPdf.js`

### Client-side PDF (secondary)

- `caseReportPdf.js` can build PDF with jsPDF using clinic header + doctor info + vitals (when clinic logo fetched as base64)

---

## 11. Clinic modes

| Mode | Value | Behavior |
|------|--------|----------|
| **SoloDoctor** | `0` on apply / JWT | No nurse UI, no Laboratory page |
| **FullTeam** | `1` on apply / JWT | Nurse + lab + full workflow |

Source: `clinicMode` on user or JWT (`src/utils/clinicMode.js`).

---

## 12. Backend API reference

Base URL: `REACT_APP_API_BASE_URL`  
Auth: `Authorization: Bearer {accessToken}` on protected routes (except apply/login).

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/Auth/login` | No | Login |
| POST | `/api/Auth/apply` | No | Clinic application |

### Patients

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/Patient` | List patients (clinic scoped) |
| POST | `/api/Patient/register` | Register patient + create case |

### Patient cases

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/PatientCase` | List cases; `?status=` optional |
| GET | `/api/PatientCase/{id}` | Case detail (patient, vitals, report, …) |
| POST | `/api/PatientCase/{id}/vitals` | Nurse vitals (PascalCase body) |
| POST | `/api/PatientCase/{id}/report` | Doctor report |
| PATCH | `/api/PatientCase/{id}/status` | `?status=` query param |
| PATCH/POST | `/api/PatientCase/{id}/service` | Attach service (client tries several shapes) |
| GET | `/api/PatientCase/{id}/pdf` | Download visit PDF |
| GET | `/api/PatientCase/{id}/labresults` | List lab files |
| POST | `/api/PatientCase/{id}/labresults` | Upload lab PDF (`file` field) |
| GET | `/api/PatientCase/{caseId}/labresults/{labId}/file` | Download lab file (via `downloadUrl`) |

**Case detail DTO (expected fields used by UI)**  
Patient: first/last name, DOB, phone, **gender** (backend should expose `PatientGender` — see `BACKEND-API-NOTES.md`), status, timestamps, `latestVitals`, `medicalReport`, service id/name/price.

### Clinic

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/Clinic/profile` | Clinic profile |
| PUT | `/api/Clinic/profile` | Update profile |
| POST | `/api/Clinic/profile/logo` | Upload logo |

### Clinic users (staff)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ClinicUser` | List; `?role=`, `?clinicId=` (SuperAdmin) |
| POST | `/api/ClinicUser` | Create user; `?clinicId=` (SuperAdmin) |

### Clinic applications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ClinicApplication` | List; `?status=` |
| POST | `/api/ClinicApplication/{id}/approve` | Approve; body `{ ReviewNote }` optional |
| POST | `/api/ClinicApplication/{id}/reject` | Reject; body `{ ReviewNote }` optional |

### Services

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/Service` | List active services; `?clinicId=` |
| GET | `/api/Service/{id}` | Get one |
| POST | `/api/Service` | Create `{ name, price }` |
| PUT | `/api/Service/{id}` | Update |
| DELETE | `/api/Service/{id}` | Soft-delete |

### Doctor profile

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/DoctorProfile/profile` | Doctor-only |
| PUT | `/api/DoctorProfile/profile` | Update display name |
| POST | `/api/DoctorProfile/profile/signature` | Upload signature image |
| POST | `/api/DoctorProfile/profile/stamp` | Upload stamp image |

### SignalR

| Hub | Methods | Events |
|-----|---------|--------|
| `/hubs/clinic` | `JoinClinic`, `JoinPatientCase` | `VitalsUpdated`, `ReportUpdated`, `CaseStatusChanged` |

### Static uploads

Logo/doctor images often returned as paths like `/uploads/clinics/...`, `/uploads/doctors/...` — loaded with auth or full URL via API base.

---

## 13. Configuration

| Variable | Purpose |
|----------|---------|
| `REACT_APP_API_BASE_URL` | Backend root URL (no trailing slash) |

**Local storage keys**

| Key | Purpose |
|-----|---------|
| `accessToken` | JWT |
| `user` | JSON user object |
| `token_expires` | Optional expiry |
| `clinicops_active_panel` | SuperAdmin panel choice |

---

## 14. Gaps and notes

| Topic | Status |
|-------|--------|
| Backend repo | Not documented from source here; verify controllers against section 12 |
| `PatientGender` on case detail | Documented in `BACKEND-API-NOTES.md` as required for full UI/PDF |
| Payments | UI only — aggregates cases; no dedicated payment transaction API in client |
| Nurse + Laboratory menu | Nurse role menu does not include Laboratori link; lab work via case detail or LabTechnician account |
| 401 handling | Axios interceptor does not auto-redirect to login (commented out) |
| `PROJECT_DONE.md` | Older checklist; some items outdated (e.g. payments are implemented in UI) |

---

## Quick checklist — “Do we have X?”

| Feature | Frontend | Backend (via API) |
|---------|----------|-------------------|
| Clinic apply / approve | Yes | Yes |
| Login / JWT | Yes | Yes |
| Role-based menus | Yes | Roles from auth |
| Register patient + auto case | Yes | Yes |
| Case vitals (nurse) | Yes | Yes |
| Case report (doctor) | Yes | Yes |
| Case status workflow | Yes | Yes |
| Lab PDF upload/download | Yes | Yes |
| Services CRUD | Yes | Yes |
| Staff users CRUD | Yes | Yes |
| Clinic profile + logo | Yes | Yes |
| Doctor signature/stamp | Yes | Yes |
| Visit PDF download | Yes | Yes |
| Payments overview | Yes | Uses case + service data |
| Real-time case updates | Yes | SignalR hub |
| Solo vs full team clinic | Yes | Yes (apply + JWT) |

---

*Generated for ClinicOps client. Update this file when you add routes, roles, or API modules.*
