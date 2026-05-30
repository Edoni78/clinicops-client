import React, { useState, useEffect, useMemo } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FiRefreshCw,
  FiLogOut,
  FiMenu,
  FiX,
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
  FiShield,
} from "react-icons/fi";
import { getJwtPayload } from "../../utils/jwt";
import { useAuth } from "../../context/AuthContext";
import { useDashboardPanel } from "../../context/DashboardPanelContext";
import { getClinicProfile, getLogoFullUrl } from "../../api/clinic";
import { getSidebarMenuItems } from "../../utils/dashboardMenu";

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

function getClinicInitials(name) {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function NavLinkItem({ label, icon: Icon, path, onClick, mobile = false }) {
  const activeCls = mobile ? "topnav-link-mobile-active" : "topnav-link-active";
  const inactiveCls = mobile ? "topnav-link-mobile-inactive" : "topnav-link-inactive";

  return (
    <NavLink
      to={path}
      end={path === "/dashboard"}
      onClick={onClick}
      className={({ isActive }) => (isActive ? activeCls : inactiveCls)}
    >
      <Icon size={mobile ? 18 : 16} className="shrink-0 opacity-90" strokeWidth={1.75} />
      {label}
    </NavLink>
  );
}

function DesktopNav({ items }) {
  return (
    <nav
      className="hidden lg:flex items-center gap-1 flex-1 min-w-0 flex-wrap px-2"
      aria-label="Navigimi kryesor"
    >
      {items.map((item) => (
        <NavLinkItem key={`${item.path}-${item.label}`} {...item} />
      ))}
    </nav>
  );
}

function MobileNav({ items, open, onClose }) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Mbyll menunë"
      />
      <div className="lg:hidden relative z-50 border-t border-slate-200 bg-white shadow-lg max-h-[min(75vh,32rem)] overflow-y-auto">
        <nav className="p-3 space-y-1" aria-label="Navigimi mobil">
          {items.map((item) => (
            <NavLinkItem key={`${item.path}-${item.label}`} {...item} mobile onClick={onClose} />
          ))}
        </nav>
      </div>
    </>
  );
}

const Topbar = () => {
  const location = useLocation();
  const payload = getJwtPayload();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { requiresPanel, clearActivePanel, activePanel, roleLower } = useDashboardPanel();
  const hasClinic = !!(user?.clinicId ?? user?.ClinicId);
  const [clinicProfile, setClinicProfile] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!hasClinic) {
      setClinicProfile(null);
      return;
    }
    getClinicProfile()
      .then(setClinicProfile)
      .catch(() => setClinicProfile(null));
  }, [hasClinic]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const clinicDisplayName =
    clinicProfile?.name ??
    clinicProfile?.Name ??
    payload?.clinicName ??
    payload?.ClinicName ??
    user?.clinicName ??
    user?.ClinicName ??
    null;
  const clinicLogoUrl = getLogoFullUrl(clinicProfile?.logoUrl ?? clinicProfile?.LogoUrl);

  const navItems = useMemo(() => {
    const menu = getSidebarMenuItems({ roleLower, activePanel, hasClinic });
    return menu.map(({ key, label, path }) => ({
      label,
      path,
      icon: MENU_ICONS[key] || FiHome,
    }));
  }, [roleLower, activePanel, hasClinic]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSwitchPanel = () => {
    clearActivePanel();
    navigate("/dashboard/panel", { replace: true });
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <header className="bg-white shrink-0 sticky top-0 z-30 shadow-sm shadow-slate-900/[0.04] border-b border-slate-200/90">
      <div className="flex items-center gap-3 lg:gap-4 min-h-[4rem] sm:min-h-[4.25rem] px-4 sm:px-6 lg:px-8 py-2">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 shrink-0 min-w-0 max-w-[11rem] sm:max-w-[13rem] group"
        >
          {hasClinic ? (
            <>
              {clinicLogoUrl ? (
                <img
                  src={clinicLogoUrl}
                  alt=""
                  className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg object-contain bg-slate-50 border border-slate-200/80"
                />
              ) : (
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-clinic-500 text-white font-bold text-xs">
                  {getClinicInitials(clinicDisplayName || "K")}
                </span>
              )}
              <span className="font-semibold text-sm sm:text-base text-slate-900 truncate hidden sm:block">
                {clinicDisplayName || "Klinika"}
              </span>
            </>
          ) : (
            <>
              <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-clinic-500 text-white font-bold text-xs">
                CO
              </span>
              <span className="font-semibold text-sm sm:text-base text-slate-900 truncate hidden sm:block">
                ClinicOps
              </span>
            </>
          )}
        </Link>

        <div className="hidden lg:block h-8 w-px bg-slate-200 shrink-0" aria-hidden />

        <DesktopNav items={navItems} />

        {/* Tablet: same row, wrap */}
        <nav
          className="hidden md:flex lg:hidden items-center gap-1 flex-1 min-w-0 flex-wrap"
          aria-label="Navigimi kryesor"
        >
          {navItems.map((item) => (
            <NavLinkItem key={`md-${item.path}-${item.label}`} {...item} />
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
          {requiresPanel && (
            <button
              type="button"
              onClick={handleSwitchPanel}
              className="topnav-action-ghost hidden sm:inline-flex"
              title="Zgjidhni panel tjetër"
            >
              <FiRefreshCw size={16} />
              <span className="hidden xl:inline">Ndërro panelin</span>
            </button>
          )}

          <button type="button" onClick={handleLogout} className="topnav-action-danger">
            <FiLogOut size={16} />
            <span className="hidden sm:inline">Dilni</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileNavOpen((o) => !o)}
            className={`md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
              mobileNavOpen
                ? "bg-clinic-50 border-clinic-200 text-clinic-700"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
            aria-label={mobileNavOpen ? "Mbyll menunë" : "Hap menunë"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      <MobileNav items={navItems} open={mobileNavOpen} onClose={closeMobileNav} />
    </header>
  );
};

export default Topbar;
