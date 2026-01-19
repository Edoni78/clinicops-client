import React from "react";
import {
  FiHome,
  FiUsers,
  FiFolder,
  FiActivity,
  FiDollarSign,
  FiUserCheck,
} from "react-icons/fi";

const menuItems = [
  {
    label: "Dashboard",
    icon: FiHome,
  },
  {
    label: "Patients",
    icon: FiUsers,
  },
  {
    label: "Cases",
    icon: FiFolder,
  },
  {
    label: "Laboratory",
    icon: FiActivity,
  },
  {
    label: "Payments",
    icon: FiDollarSign,
  },
  {
    label: "Staff",
    icon: FiUserCheck,
  },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r hidden md:flex flex-col">
      {/* LOGO / TITLE */}
      <div className="p-6 font-bold text-xl text-[#81a2c5] border-b">
        ClinicOps
      </div>

      {/* NAV */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="
              flex items-center gap-3
              px-4 py-2
              rounded-lg
              cursor-pointer
              text-slate-600
              hover:bg-slate-100
              hover:text-slate-900
              transition
            "
          >
            <Icon size={18} />
            <span className="text-sm font-medium">
              {label}
            </span>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
