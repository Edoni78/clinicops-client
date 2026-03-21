import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiFolder,
  FiFileText,
  FiActivity,
  FiDollarSign,
  FiUserCheck,
  FiClipboard,
  FiBriefcase,
  FiPackage,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import {
  useDashboardPanel,
  PANEL_NURSE,
  PANEL_DOCTOR,
  PANEL_SUPERADMIN,
} from "../../context/DashboardPanelContext";

const menuItems = [
  { label: "Paneli", icon: FiHome, path: "/dashboard" },
  { label: "Pacientët", icon: FiUsers, path: "/dashboard/patients" },
  { label: "Rastet", icon: FiFolder, path: "/dashboard/cases" },
  { label: "Raportet", icon: FiFileText, path: "/dashboard/reports" },
  { label: "Laboratori", icon: FiActivity, path: "/dashboard/laboratory" },
  { label: "Shërbimet", icon: FiPackage, path: "/dashboard/services" },
  { label: "Pagesat", icon: FiDollarSign, path: "/dashboard/payments" },
  { label: "Stafi", icon: FiUserCheck, path: "/dashboard/staff" },
];

const patientsListItem = {
  label: "Lista e pacientëve",
  icon: FiUsers,
  path: "/dashboard/patients-list",
};

const Sidebar = () => {
  const { user, role } = useAuth();
  const { requiresPanel, activePanel } = useDashboardPanel();
  const isSuperAdmin = role && role.toString().toLowerCase() === "superadmin";
  const isDoctor = role && role.toString().toLowerCase() === "doctor";
  const hasClinic = !!(user?.clinicId ?? user?.ClinicId);

  const items = useMemo(() => {
    if (!requiresPanel) {
      const base = [
        ...(isSuperAdmin ? [{ label: "Aplikimet", icon: FiClipboard, path: "/dashboard/applies" }] : []),
        ...menuItems,
        ...(hasClinic ? [{ label: "Profili i klinikës", icon: FiBriefcase, path: "/dashboard/clinic-profile" }] : []),
        ...(isDoctor ? [{ label: "Profili i mjekut", icon: FiUserCheck, path: "/dashboard/doctor-profile" }] : []),
      ];
      return base;
    }

    if (!activePanel) return [];

    if (activePanel === PANEL_NURSE) {
      return [
        { label: "Paneli", icon: FiHome, path: "/dashboard" },
        { label: "Pacientët", icon: FiUsers, path: "/dashboard/patients" },
        patientsListItem,
        { label: "Rastet", icon: FiFolder, path: "/dashboard/cases" },
        { label: "Laboratori", icon: FiActivity, path: "/dashboard/laboratory" },
      ];
    }

    if (activePanel === PANEL_DOCTOR) {
      return [
        { label: "Paneli", icon: FiHome, path: "/dashboard" },
        { label: "Rastet", icon: FiFolder, path: "/dashboard/cases" },
        { label: "Raportet", icon: FiFileText, path: "/dashboard/reports" },
        ...(isDoctor ? [{ label: "Profili i mjekut", icon: FiUserCheck, path: "/dashboard/doctor-profile" }] : []),
        { label: "Laboratori", icon: FiActivity, path: "/dashboard/laboratory" },
      ];
    }

    if (activePanel === PANEL_SUPERADMIN) {
      return [
        { label: "Paneli", icon: FiHome, path: "/dashboard" },
        { label: "Aplikimet", icon: FiClipboard, path: "/dashboard/applies" },
        { label: "Pacientët", icon: FiUsers, path: "/dashboard/patients" },
        patientsListItem,
        { label: "Rastet", icon: FiFolder, path: "/dashboard/cases" },
        { label: "Raportet", icon: FiFileText, path: "/dashboard/reports" },
        { label: "Laboratori", icon: FiActivity, path: "/dashboard/laboratory" },
        { label: "Shërbimet", icon: FiPackage, path: "/dashboard/services" },
        { label: "Stafi", icon: FiUserCheck, path: "/dashboard/staff" },
      ];
    }

    return [];
  }, [requiresPanel, activePanel, isSuperAdmin, isDoctor, hasClinic]);

  return (
    <aside className="w-64 bg-white border-r hidden md:flex flex-col">
      <div className="p-6 font-bold text-xl text-[#81a2c5] border-b">
        iKlinika
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {items.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={`${path}-${label}`}
            to={path}
            end={path === "/dashboard"}
            className={({ isActive }) =>
              `
              flex items-center gap-3
              px-4 py-2 rounded-lg
              text-sm font-medium
              transition
              ${
                isActive
                  ? "bg-slate-200 text-slate-900"
                  : "text-slate-600 hover:bg-slate-100"
              }
            `
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
