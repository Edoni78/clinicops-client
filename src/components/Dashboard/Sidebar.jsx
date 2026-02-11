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
} from "react-icons/fi";

const menuItems = [
  { label: "Dashboard", icon: FiHome, path: "/dashboard" },
  { label: "Patients", icon: FiUsers, path: "/dashboard/patients" },
  { label: "Cases", icon: FiFolder, path: "/dashboard/cases" },
  { label: "Reports", icon: FiFileText, path: "/dashboard/reports" },
  { label: "Laboratory", icon: FiActivity, path: "/dashboard/laboratory" },
  { label: "Payments", icon: FiDollarSign, path: "/dashboard/payments" },
  { label: "Staff", icon: FiUserCheck, path: "/dashboard/staff" },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r hidden md:flex flex-col">
      <div className="p-6 font-bold text-xl text-[#81a2c5] border-b">
        ClinicOps
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map(({ label, icon: Icon, path }) => (
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
