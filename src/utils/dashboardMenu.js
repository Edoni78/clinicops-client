import { PANEL_NURSE, PANEL_DOCTOR, PANEL_SUPERADMIN } from "./dashboardPanels";
import { CLINIC_MODE_SOLO_DOCTOR } from "./clinicMode";

export const MENU = {
  home: { key: "home", label: "Paneli", path: "/dashboard" },
  emrs: { key: "emrs", label: "EMRs", path: "/dashboard/emrs" },
  history: { key: "history", label: "Historia", path: "/dashboard/history" },
  patients: { key: "patients", label: "Pacientët", path: "/dashboard/patients" },
  patientsList: {
    key: "patientsList",
    label: "Lista e pacientëve",
    path: "/dashboard/patients-list",
  },
  cases: { key: "cases", label: "Rastet", path: "/dashboard/cases" },
  reports: { key: "reports", label: "Raportet", path: "/dashboard/reports" },
  laboratory: { key: "laboratory", label: "Laboratori", path: "/dashboard/laboratory" },
  services: { key: "services", label: "Shërbimet", path: "/dashboard/services" },
  payments: { key: "payments", label: "Pagesat", path: "/dashboard/payments" },
  staff: { key: "staff", label: "Stafi", path: "/dashboard/staff" },
  applies: { key: "applies", label: "Aplikimet", path: "/dashboard/applies" },
  auditLogs: {
    key: "auditLogs",
    label: "Audit Logs",
    path: "/dashboard/audit-logs",
  },
  clinicProfile: {
    key: "clinicProfile",
    label: "Profili i klinikës",
    path: "/dashboard/clinic-profile",
  },
  doctorProfile: {
    key: "doctorProfile",
    label: "Profili i mjekut",
    path: "/dashboard/doctor-profile",
  },
};

function pick(...items) {
  return items.filter(Boolean);
}

const DOCTOR_MENU = pick(
  MENU.home,
  MENU.emrs,
  MENU.history,
  MENU.patientsList,
  MENU.cases,
  MENU.reports,
  MENU.doctorProfile
);

const NURSE_MENU = pick(
  MENU.home,
  MENU.emrs,
  MENU.patients,
  MENU.patientsList,
  MENU.cases,
  MENU.reports
);

const LAB_TECHNICIAN_MENU = pick(MENU.home, MENU.emrs, MENU.laboratory, MENU.cases);

const CLINIC_ADMIN_MENU = (hasClinic, soloDoctor) =>
  pick(
    MENU.home,
    MENU.emrs,
    MENU.history,
    MENU.patients,
    MENU.patientsList,
    MENU.cases,
    MENU.reports,
    soloDoctor ? null : MENU.laboratory,
    MENU.services,
    MENU.payments,
    soloDoctor ? null : MENU.staff,
    MENU.auditLogs,
    soloDoctor ? MENU.doctorProfile : null,
    hasClinic ? MENU.clinicProfile : null
  );

/** Map backend role strings to menu role keys */
export function normalizeRole(roleLower) {
  const r = String(roleLower || "").toLowerCase().replace(/[\s_-]/g, "");
  if (r === "clinicadmin" || r === "admin") return "clinicadmin";
  if (r === "labtechnician" || r === "labtech" || r === "lab") return "labtechnician";
  return r;
}

export function isClinicAdminRole(role) {
  return normalizeRole(role) === "clinicadmin";
}

const SUPERADMIN_MENU = pick(
  MENU.home,
  MENU.emrs,
  MENU.applies,
  MENU.patients,
  MENU.patientsList,
  MENU.cases,
  MENU.reports,
  MENU.laboratory,
  MENU.services,
  MENU.payments,
  MENU.staff
);

const MENU_SECTIONS = {
  nurse: [
    { label: "Puna e ditës", keys: ["home", "cases", "reports"] },
    { label: "Pacientët", keys: ["patients", "patientsList", "emrs"] },
  ],
  doctor: [
    { label: "Konsultimet", keys: ["home", "cases", "reports"] },
    { label: "Kartela", keys: ["emrs", "history", "patientsList"] },
    { label: "Profili", keys: ["doctorProfile"] },
  ],
  labtechnician: [
    { label: "Laboratori", keys: ["home", "laboratory", "cases", "emrs"] },
  ],
  clinicadmin: [
    { label: "Puna e ditës", keys: ["home", "cases", "reports"] },
    { label: "Pacientët", keys: ["patients", "patientsList", "emrs", "history"] },
    { label: "Klinika", keys: ["laboratory", "services", "payments"] },
    { label: "Administrimi", keys: ["staff", "auditLogs", "doctorProfile", "clinicProfile"] },
  ],
  superadmin: [
    { label: "Puna e ditës", keys: ["home", "cases", "reports"] },
    { label: "Pacientët", keys: ["patients", "patientsList", "emrs"] },
    { label: "Klinika", keys: ["laboratory", "services", "payments", "staff", "applies"] },
  ],
};

function sectionRole(role, activePanel) {
  if (role !== "superadmin") return role;
  if (activePanel === PANEL_DOCTOR) return "doctor";
  if (activePanel === PANEL_NURSE) return "nurse";
  return "superadmin";
}

/**
 * Same items as the role menu, grouped for the sidebar.
 * Items that do not match a group stay visible at the end.
 */
export function getSidebarSections({ roleLower, activePanel, hasClinic, clinicMode }) {
  const items = getSidebarMenuItems({ roleLower, activePanel, hasClinic, clinicMode });
  const role = sectionRole(normalizeRole(roleLower), activePanel);
  const sections = MENU_SECTIONS[role] || [{ label: null, keys: items.map((item) => item.key) }];
  const used = new Set();
  const grouped = sections
    .map((section) => {
      const sectionItems = section.keys
        .map((key) => items.find((item) => item.key === key))
        .filter(Boolean);
      sectionItems.forEach((item) => used.add(item.key));
      return { label: section.label, items: sectionItems };
    })
    .filter((section) => section.items.length > 0);
  const rest = items.filter((item) => !used.has(item.key));
  if (rest.length) grouped.push({ label: null, items: rest });
  return grouped;
}

/**
 * Sidebar items by role.
 * Doctor: cases + reports only. Clinic admin: full clinic menu. Superadmin: + applies.
 */
export function getSidebarMenuItems({ roleLower, activePanel, hasClinic, clinicMode }) {
  const role = normalizeRole(roleLower);
  const soloDoctor = clinicMode === CLINIC_MODE_SOLO_DOCTOR;

  if (role === "doctor") return DOCTOR_MENU;

  if (role === "nurse") return NURSE_MENU;

  if (role === "labtechnician") return LAB_TECHNICIAN_MENU;

  if (role === "clinicadmin") return CLINIC_ADMIN_MENU(hasClinic, soloDoctor);

  if (role === "superadmin") {
    if (activePanel === PANEL_SUPERADMIN) return SUPERADMIN_MENU;
    if (activePanel === PANEL_DOCTOR) return DOCTOR_MENU;
    if (activePanel === PANEL_NURSE) return NURSE_MENU;
    return [];
  }

  return [];
}

export function getDefaultPanelForRole(roleLower) {
  const role = String(roleLower || "").toLowerCase();
  if (role === "doctor") return PANEL_DOCTOR;
  if (role === "nurse") return PANEL_NURSE;
  return null;
}

export function requiresPanelSelection(roleLower) {
  return String(roleLower || "").toLowerCase() === "superadmin";
}

export function isDashboardPathAllowed(pathname, ctx) {
  const path = pathname.replace(/\/+$/, "") || "/dashboard";

  if (path === "/dashboard/panel") {
    return requiresPanelSelection(ctx.roleLower);
  }

  const allowed = getSidebarMenuItems(ctx).map((i) => i.path);
  if (allowed.includes(path)) return true;
  if (allowed.includes(MENU.cases.path) && path.startsWith("/dashboard/cases/")) {
    return true;
  }
  if (path === "/dashboard/patients-import") {
    return isClinicAdminRole(ctx.roleLower);
  }
  if (path === "/dashboard/cases-import") {
    return isClinicAdminRole(ctx.roleLower);
  }
  return false;
}
