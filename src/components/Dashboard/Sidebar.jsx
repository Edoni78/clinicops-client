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
  FiClock,
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
  history: FiClock,
  clinicProfile: FiBriefcase,
  doctorProfile: FiUserCheck,
};

function NavItems({ items, onNavigate }) {
  return (
    <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto" aria-label="Navigimi kryesor">
      {items.map(({ label, icon: Icon, path, tourId }) => (
        <NavLink
          key={`${path}-${label}`}
          to={path}
          end={path === "/dashboard"}
          onClick={onNavigate}
          data-tour={tourId || undefined}
          className={({ isActive }) => (isActive ? "sidebar-link-active" : "sidebar-link-inactive")}
        >
          <Icon size={16} className="shrink-0" strokeWidth={1.75} />
          <span className="truncate">{label}</span>
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
  const clinicLogoUrl = getLogoFullUrl(clinicProfile?.logoUrl ?? clinicProfile?.LogoUrl);

  const items = useMemo(() => {
    const menu = getSidebarMenuItems({ roleLower, activePanel, hasClinic });
    return menu.map(({ key, label, path }) => ({
      label,
      path,
      icon: MENU_ICONS[key] || FiHome,
      tourId: key === "clinicProfile" ? "clinic-profile" : key,
    }));
  }, [roleLower, activePanel, hasClinic]);

  const sidebarContent = (
    <>
      <div className="px-3 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {hasClinic ? (
            <>
              {clinicLogoUrl ? (
                <img
                  src={clinicLogoUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-md object-contain bg-slate-50 border border-slate-200"
                />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white font-semibold text-[11px]">
                  {getClinicInitials(clinicDisplayName || "K")}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Klinika</p>
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {clinicDisplayName || "Klinika"}
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white font-semibold text-[11px]">
                iK
              </span>
              <span className="text-sm font-semibold text-slate-900 truncate">iKlinika</span>
            </>
          )}
        </div>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
            aria-label="Mbyll menunë"
          >
            <FiX size={18} />
          </button>
        )}
      </div>
      <NavItems items={items} onNavigate={onMobileClose} />
    </>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={onMobileClose}
          aria-label="Mbyll menunë"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 max-w-[85vw] bg-white border-r border-slate-200
          flex flex-col transform transition-transform duration-150 ease-out md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>

      <aside className="hidden md:flex w-56 lg:w-60 bg-white border-r border-slate-200 flex-col shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
