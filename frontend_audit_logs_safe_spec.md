# Frontend: Add Clinic Admin Audit Logs Page Safely

Goal: add a professional Audit Logs page for clinic admins in the existing React frontend without breaking current working SaaS functionality.

Important rule for Cursor:
Do not rewrite the existing frontend architecture.
Do not break existing routes, layouts, authentication, axios setup, sidebar, dashboard, patient flows, appointment flows, EMR flows, or role-based access.

This feature should be added incrementally.

---

## 1. What This Page Is For

The Audit Logs page allows the Clinic Admin to see important activity inside their clinic, especially actions related to patients and medical records.

It is mainly for:

- GDPR traceability
- security review
- clinic accountability
- checking who accessed or changed patient data

Only ClinicAdmin should access this page.

---

## 2. Backend Data Expected

Assume the backend has or will have an endpoint like:

```txt
GET /api/audit-logs
```

Optional query parameters:

```txt
?page=1
&pageSize=20
&action=PatientViewed
&entityName=Patient
&userId=...
&fromDate=2026-01-01
&toDate=2026-01-31
&search=patient name or user name
```

Expected response shape:

```json
{
  "items": [
    {
      "id": 1,
      "clinicId": 2,
      "userId": "abc123",
      "userFullName": "Doctor Name",
      "action": "PatientViewed",
      "entityName": "Patient",
      "entityId": "45",
      "ipAddress": "192.168.1.1",
      "userAgent": "Chrome / Windows",
      "createdAtUtc": "2026-01-01T12:30:00Z"
    }
  ],
  "totalCount": 100,
  "page": 1,
  "pageSize": 20
}
```

If the backend response has slightly different field names, adapt the frontend mapping without changing backend contracts.

---

## 3. Do Not Break Existing Frontend

Follow these rules strictly:

- Do not change existing working components unless only adding a link.
- Do not rename existing routes.
- Do not change existing axios interceptor.
- Do not change existing auth token storage.
- Do not change existing user roles logic unless needed only for showing this page.
- Do not modify patient, appointment, EMR, or billing pages.
- Do not change existing API response handling.
- Add this as a new isolated feature.

---

## 4. Suggested Folder Structure

Use the existing project structure. If similar folders already exist, follow them.

Suggested files:

```txt
src/pages/admin/AuditLogsPage.jsx
src/services/auditLogsService.js
src/components/audit-logs/AuditLogFilters.jsx
src/components/audit-logs/AuditLogTable.jsx
src/components/audit-logs/AuditLogDetailsModal.jsx
```

If the project uses another structure, follow the existing convention.

---

## 5. Add Audit Logs Service

Create a small service that uses the existing axios instance.

Example:

```js
import api from "../api/axios";

export const getAuditLogs = async (params) => {
  const response = await api.get("/audit-logs", { params });
  return response.data;
};
```

Important:
Use the existing configured axios instance so JWT token handling remains unchanged.

Do not create a second axios setup.

---

## 6. Add Route Safely

Add a new route only for admin users.

Suggested route:

```txt
/admin/audit-logs
```

If the app already has an admin route structure, follow that.

The page must be protected by the existing auth/role guard.

Only allow:

```txt
ClinicAdmin
Admin
```

If only `ClinicAdmin` exists, use only that.

Do not expose this page to doctors, nurses, receptionists, or patients.

---

## 7. Add Sidebar/Menu Link

Add one new sidebar menu item:

```txt
Audit Logs
```

Suggested icon:
Use the existing icon library. Good options:

- Shield
- ClipboardList
- Activity
- History

Only show the menu item for ClinicAdmin/Admin.

Do not change existing sidebar styling.
Follow the current UI pattern.

---

## 8. Page Layout

The page should look professional and simple.

Top section:

```txt
Title: Audit Logs
Subtitle: Track sensitive activity and patient data access inside your clinic.
```

Summary cards:

```txt
Total Logs
Patient Access Events
Data Changes
Exports / Anonymizations
```

Main area:

- filters
- audit logs table
- pagination

---

## 9. Filters To Add

Add safe filters:

- Search input
- Action dropdown
- Entity dropdown
- From date
- To date
- Clear filters button

Action dropdown options:

```txt
All actions
PatientViewed
PatientCreated
PatientUpdated
PatientDeleted
PatientAnonymized
PatientExported
MedicalRecordViewed
MedicalRecordUpdated
Login
Logout
```

Entity dropdown options:

```txt
All entities
Patient
MedicalRecord
Appointment
Visit
File
User
```

Filters should update the API query params.

Use debounce for search if the project already uses debounce.
If not, only search when pressing Enter or clicking Apply.

---

## 10. Table Columns

Show these columns:

```txt
Date / Time
User
Action
Entity
Entity ID
IP Address
Details
```

Date should be formatted in local time.

Example:

```txt
28 May 2026, 14:35
```

User should show:

```txt
userFullName
```

Fallback:

```txt
userId
```

Action should use professional badges.

Examples:

- PatientViewed -> blue/info badge
- PatientUpdated -> yellow/warning badge
- PatientDeleted -> red/danger badge
- PatientExported -> purple/security badge
- PatientAnonymized -> dark/security badge
- Login -> green/success badge

Do not use aggressive styling.
Keep it clean and enterprise-like.

---

## 11. Details Modal

When clicking Details, show a modal or side panel.

Show:

```txt
Action
User
Entity
Entity ID
IP Address
User Agent
Created At
```

If backend later adds metadata/diff information, show it safely:

```json
metadata
```

Do not require metadata now.

---

## 12. Empty, Loading, and Error States

Add professional states:

Loading:

```txt
Loading audit logs...
```

Empty:

```txt
No audit logs found for the selected filters.
```

Error:

```txt
Could not load audit logs. Please try again.
```

Do not crash the page if fields are null.

Use fallbacks:

```txt
Unknown user
Unknown IP
Unknown entity
```

---

## 13. Pagination

Use backend pagination.

State:

```js
page
pageSize
totalCount
```

Default:

```txt
page = 1
pageSize = 20
```

Show:

```txt
Previous
Next
```

Disable Previous on first page.
Disable Next when there are no more results.

---

## 14. Security Rules In Frontend

Frontend security is only UI-level. Backend must still enforce real security.

But frontend should:

- hide page from non-admin roles
- not show audit logs link to non-admins
- redirect unauthorized users
- never store audit logs in localStorage
- never expose logs publicly
- never show data from another clinic

Do not rely only on frontend role checks.

---

## 15. Optional Export Button

Do not implement export now unless backend supports it.

If added later, add button:

```txt
Export Audit Logs
```

Only enable it if backend endpoint exists.

For now, avoid adding broken buttons.

---

## 16. Definition of Done

Frontend task is done when:

- Audit Logs page exists
- Page uses existing axios/auth setup
- Route is protected for ClinicAdmin/Admin
- Sidebar link appears only for admin role
- Logs are displayed in a professional table
- Filters work with backend query params
- Pagination works
- Details modal works
- Loading, empty, and error states exist
- Existing SaaS pages still work
- No existing route or API integration is broken

---

## 17. Very Important

Implement this as a new isolated feature.

Do not refactor the whole frontend.
Do not modify existing patient/appointment/EMR workflows.
Do not change existing auth behavior.
Do not change existing styling system.

Add only what is needed for the Audit Logs admin page.
