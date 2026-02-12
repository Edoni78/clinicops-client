import React from "react";
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
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
  { label: "Paneli", icon: FiHome, path: "/dashboard" },
  { label: "Pacientët", icon: FiUsers, path: "/dashboard/patients" },
  { label: "Rastet", icon: FiFolder, path: "/dashboard/cases" },
  { label: "Raportet", icon: FiFileText, path: "/dashboard/reports" },
  { label: "Laboratori", icon: FiActivity, path: "/dashboard/laboratory" },
  { label: "Pagesat", icon: FiDollarSign, path: "/dashboard/payments" },
  { label: "Stafi", icon: FiUserCheck, path: "/dashboard/staff" },
];

const Sidebar = () => {
  const { user, role } = useAuth();
  const isSuperAdmin = role && role.toString().toLowerCase() === "superadmin";
  const hasClinic = !!(user?.clinicId ?? user?.ClinicId);

  const items = [
    ...(isSuperAdmin ? [{ label: "Aplikimet", icon: FiClipboard, path: "/dashboard/applies" }] : []),
    ...menuItems,
    ...(hasClinic ? [{ label: "Profili i klinikës", icon: FiBriefcase, path: "/dashboard/clinic-profile" }] : []),
  ];

  return (
    <aside className="w-64 bg-white border-r hidden md:flex flex-col">
      <div className="p-6 font-bold text-xl text-[#81a2c5] border-b">
        ClinicOps
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {items.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={label}
            to={path}
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
