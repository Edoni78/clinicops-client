import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiRefreshCw, FiLogOut, FiMenu } from "react-icons/fi";
import { getJwtPayload } from "../../utils/jwt";
import { useAuth } from "../../context/AuthContext";
import { useDashboardPanel } from "../../context/DashboardPanelContext";
import { getDoctorProfile } from "../../api/doctorProfile";

const Topbar = ({ onMenuClick }) => {
  const payload = getJwtPayload();
  const clinicName = payload?.clinicName;
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const { requiresPanel, clearActivePanel } = useDashboardPanel();
  const isDoctor = role && String(role).toLowerCase() === "doctor";
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    if (!isDoctor) return;
    getDoctorProfile()
      .then((data) => setDoctorProfile(data))
      .catch(() => setDoctorProfile(null));
  }, [isDoctor]);

  const displayLabel = isDoctor
    ? (doctorProfile?.displayName ?? doctorProfile?.DisplayName ?? doctorProfile?.email ?? doctorProfile?.Email ?? user?.email ?? user?.Email ?? "Mjek")
    : clinicName || null;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSwitchPanel = () => {
    clearActivePanel();
    navigate("/dashboard/panel", { replace: true });
  };

  return (
    <header className="h-14 sm:h-16 bg-white/95 backdrop-blur border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 gap-3 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Hap menunë"
        >
          <FiMenu size={22} />
        </button>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 hidden sm:block">Mirë se vini</p>
          <p className="text-sm sm:text-base text-slate-800 truncate">
            {displayLabel ? (
              <>
                <span className="font-semibold">{displayLabel}</span>
                {isDoctor && (
                  <Link
                    to="/dashboard/doctor-profile"
                    className="ml-2 text-xs font-medium text-clinic-500 hover:text-clinic-600 hover:underline"
                  >
                    Profili
                  </Link>
                )}
              </>
            ) : (
              <span className="font-medium">iKlinika</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {requiresPanel && (
          <button
            type="button"
            onClick={handleSwitchPanel}
            className="btn-ghost btn-sm text-clinic-600"
            title="Zgjidhni panel tjetër"
          >
            <FiRefreshCw size={16} />
            <span className="hidden sm:inline">Ndërro panelin</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="btn-danger btn-sm"
        >
          <FiLogOut size={16} />
          <span className="hidden xs:inline sm:inline">Dilni</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
