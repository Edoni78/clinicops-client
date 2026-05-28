import React, { useMemo, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiFolder,
  FiFileText,
  FiBookOpen,
  FiActivity,
  FiDollarSign,
  FiUserCheck,
  FiClipboard,
  FiBriefcase,
  FiPackage,
  FiX,
  FiShield,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useDashboardPanel } from "../../context/DashboardPanelContext";
import { getClinicProfile, getLogoFullUrl } from "../../api/clinic";
import { getJwtPayload } from "../../utils/jwt";
import { getSidebarMenuItems } from "../../utils/dashboardMenu";

function getClinicInitials(name) {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const MENU_ICONS = {
  home: FiHome,
  patients: FiUsers,
  patientsList: FiUsers,
  cases: FiFolder,
  reports: FiFileText,
  emrs: FiBookOpen,
  laboratory: FiActivity,
  services: FiPackage,
  payments: FiDollarSign,
  staff: FiUserCheck,
  applies: FiClipboard,
  auditLogs: FiShield,
  clinicProfile: FiBriefcase,
  doctorProfile: FiUserCheck,
};

function NavItems({ items, onNavigate }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {items.map(({ label, icon: Icon, path }) => (
        <NavLink
          key={`${path}-${label}`}
          to={path}
          end={path === "/dashboard"}
          onClick={onNavigate}
          className={({ isActive }) =>
            isActive ? "sidebar-link-active" : "sidebar-link-inactive"
          }
        >
          <Icon size={18} className="shrink-0 opacity-90" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

const Sidebar = ({ mobileOpen = false, onMobileClose }) => {
  const { user } = useAuth();
  const { activePanel, roleLower } = useDashboardPanel();
  const hasClinic = !!(user?.clinicId ?? user?.ClinicId);
  const [clinicProfile, setClinicProfile] = useState(null);

  useEffect(() => {
    if (!hasClinic) {
      setClinicProfile(null);
      return;
    }
    getClinicProfile()
      .then(setClinicProfile)
      .catch(() => setClinicProfile(null));
  }, [hasClinic]);

  const jwtPayload = getJwtPayload();
  const clinicDisplayName =
    clinicProfile?.name ??
    clinicProfile?.Name ??
    jwtPayload?.clinicName ??
    jwtPayload?.ClinicName ??
    user?.clinicName ??
    user?.ClinicName ??
    null;
  const clinicLogoUrl = getLogoFullUrl(
    clinicProfile?.logoUrl ?? clinicProfile?.LogoUrl
  );

  const items = useMemo(() => {
    const menu = getSidebarMenuItems({ roleLower, activePanel, hasClinic });
    return menu.map(({ key, label, path }) => ({
      label,
      path,
      icon: MENU_ICONS[key] || FiHome,
    }));
  }, [roleLower, activePanel, hasClinic]);

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {hasClinic ? (
            <>
              {clinicLogoUrl ? (
                <img
                  src={clinicLogoUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-xl object-contain bg-slate-50 border border-slate-100"
                />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clinic-400 text-white font-bold text-xs shadow-sm">
                  {getClinicInitials(clinicDisplayName || "K")}
                </span>
              )}
              <span className="font-bold text-lg text-slate-900 tracking-tight truncate">
                {clinicDisplayName || "Klinika"}
              </span>
            </>
          ) : (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clinic-400 text-white font-bold text-sm shadow-sm">
                CO
              </span>
              <span className="font-bold text-lg text-slate-900 tracking-tight truncate">
                ClinicOps
              </span>
            </>
          )}
        </div>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Mbyll menunë"
          >
            <FiX size={20} />
          </button>
        )}
      </div>
      <NavItems items={items} onNavigate={onMobileClose} />
      <div className="px-4 py-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">Platformë për klinika</p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] md:hidden"
          onClick={onMobileClose}
          aria-label="Mbyll menunë"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200
          flex flex-col shadow-sidebar transform transition-transform duration-200 ease-out md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-white border-r border-slate-200/80 flex-col shrink-0 shadow-sm">
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
