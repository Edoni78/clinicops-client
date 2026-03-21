import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiRefreshCw } from "react-icons/fi";
import { getJwtPayload } from "../../utils/jwt";
import { useAuth } from "../../context/AuthContext";
import { useDashboardPanel } from "../../context/DashboardPanelContext";
import { getDoctorProfile } from "../../api/doctorProfile";

const Topbar = () => {
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
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 gap-4 flex-wrap">
      <span className="text-slate-600">
        Mirë se vini 👋{" "}
        {displayLabel && (
          <span className="font-semibold text-slate-800">
            {displayLabel}
          </span>
        )}
        {isDoctor && displayLabel && (
          <Link
            to="/dashboard/doctor-profile"
            className="ml-2 text-xs text-[#81a2c5] hover:underline"
          >
            (Profili)
          </Link>
        )}
      </span>

      <div className="flex items-center gap-3">
        {requiresPanel && (
          <button
            type="button"
            onClick={handleSwitchPanel}
            className="flex items-center gap-1.5 text-sm text-[#81a2c5] hover:text-[#6b8fa8] font-medium"
            title="Zgjidhni panel tjetër"
          >
            <FiRefreshCw size={16} />
            Ndërro panelin
          </button>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-600"
        >
          Dilni
        </button>
      </div>
    </header>
  );
};

export default Topbar;
