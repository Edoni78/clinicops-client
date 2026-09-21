import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiRefreshCw, FiLogOut, FiMenu, FiSearch } from "react-icons/fi";
import { getJwtPayload } from "../../utils/jwt";
import { useAuth } from "../../context/AuthContext";
import { useDashboardPanel } from "../../context/DashboardPanelContext";
import { useUiDensity } from "../../context/UiDensityContext";
import { getClinicProfile, getLogoFullUrl } from "../../api/clinic";
import { getSearchShortcutLabel } from "../ui/CommandPalette";

function getClinicInitials(name) {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const Topbar = ({ onOpenMobileNav, onOpenSearch }) => {
  const payload = getJwtPayload();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { requiresPanel, clearActivePanel } = useDashboardPanel();
  const { density, toggleDensity } = useUiDensity();
  const hasClinic = !!(user?.clinicId ?? user?.ClinicId);
  const [clinicProfile, setClinicProfile] = useState(null);
  const shortcut = getSearchShortcutLabel();

  useEffect(() => {
    if (!hasClinic) {
      setClinicProfile(null);
      return;
    }
    getClinicProfile()
      .then(setClinicProfile)
      .catch(() => setClinicProfile(null));
  }, [hasClinic]);

  const clinicDisplayName =
    clinicProfile?.name ??
    clinicProfile?.Name ??
    payload?.clinicName ??
    payload?.ClinicName ??
    user?.clinicName ??
    user?.ClinicName ??
    null;
  const clinicLogoUrl = getLogoFullUrl(clinicProfile?.logoUrl ?? clinicProfile?.LogoUrl);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSwitchPanel = () => {
    clearActivePanel();
    navigate("/dashboard/panel", { replace: true });
  };

  return (
    <header className="bg-white shrink-0 sticky top-0 z-30 border-b border-slate-200">
      <div className="flex items-center gap-2 min-h-12 px-3 sm:px-4 py-1.5">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Hap menunë"
        >
          <FiMenu size={18} />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2 shrink-0 min-w-0 md:hidden">
          {hasClinic && clinicLogoUrl ? (
            <img
              src={clinicLogoUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-md object-contain bg-white border border-slate-200"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white font-semibold text-[11px]">
              {getClinicInitials(clinicDisplayName || "iK")}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={onOpenSearch}
          className="flex-1 max-w-md inline-flex items-center gap-2 h-8 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-left text-xs text-slate-500 hover:bg-white hover:border-slate-300"
          aria-label={`Kërko (${shortcut})`}
        >
          <FiSearch size={14} className="shrink-0" />
          <span className="flex-1 truncate">Kërko pacientë, raste, faqe…</span>
          <kbd className="kbd hidden sm:inline-flex">{shortcut}</kbd>
        </button>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={toggleDensity}
            className="topnav-action-ghost"
            title={density === "compact" ? "Kaloni në pamje të rehatshme" : "Kaloni në pamje kompakte"}
            aria-pressed={density === "compact"}
          >
            {density === "compact" ? "Kompakte" : "E rehatshme"}
          </button>

          {requiresPanel && (
            <button
              type="button"
              onClick={handleSwitchPanel}
              className="topnav-action-ghost hidden sm:inline-flex"
              title="Zgjidhni panel tjetër"
            >
              <FiRefreshCw size={14} />
              <span className="hidden xl:inline">Ndërro panelin</span>
            </button>
          )}

          <button type="button" onClick={handleLogout} className="topnav-action-danger">
            <FiLogOut size={14} />
            <span className="hidden sm:inline">Dilni</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
