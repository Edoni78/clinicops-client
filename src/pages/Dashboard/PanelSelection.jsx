import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiActivity, FiFileText, FiShield, FiLogOut, FiChevronRight } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import {
  useDashboardPanel,
  PANEL_NURSE,
  PANEL_DOCTOR,
  PANEL_SUPERADMIN,
} from "../../context/DashboardPanelContext";
import Notification from "../../components/ui/Notification";

const cards = [
  {
    panel: PANEL_NURSE,
    title: "Paneli i infermierit",
    subtitle: "Pacientët, rastet, shenjat jetësore, laboratori",
    icon: FiActivity,
  },
  {
    panel: PANEL_DOCTOR,
    title: "Paneli i mjekut",
    subtitle: "Rastet, raportet, profili i mjekut, laboratori",
    icon: FiFileText,
  },
  {
    panel: PANEL_SUPERADMIN,
    title: "Paneli i super administratorit",
    subtitle: "Aplikimet, stafi, shërbimet, menaxhim i plotë",
    icon: FiShield,
  },
];

export default function PanelSelection() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { setActivePanel, roleLower } = useDashboardPanel();
  const [notif, setNotif] = useState({ visible: false, type: "error", message: "" });

  const canEnterPanel = (panel) => {
    if (roleLower === "superadmin") return true;
    if (roleLower === "nurse") return panel === PANEL_NURSE;
    if (roleLower === "doctor") return panel === PANEL_DOCTOR;
    return false;
  };

  const handleSelect = (panel) => {
    if (canEnterPanel(panel)) {
      setActivePanel(panel);
      navigate("/dashboard", { replace: true });
      return;
    }
    let message = "Nuk keni akses në këtë panel.";
    if (roleLower === "nurse") {
      if (panel === PANEL_DOCTOR) {
        message = "Nuk keni hyrë në sistem si mjek. Përdorni panelin e infermierit.";
      } else if (panel === PANEL_SUPERADMIN) {
        message = "Nuk keni hyrë në sistem si super administrator.";
      }
    } else if (roleLower === "doctor") {
      if (panel === PANEL_NURSE) {
        message = "Nuk keni hyrë në sistem si infermier. Përdorni panelin e mjekut.";
      } else if (panel === PANEL_SUPERADMIN) {
        message = "Nuk keni hyrë në sistem si super administrator.";
      }
    }
    setNotif({ visible: true, type: "error", message });
  };

  return (
    <div className="min-h-screen dashboard-bg flex flex-col">
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-10 shadow-topbar">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-clinic-600 text-white font-semibold text-sm shadow-sm">
            iK
          </span>
          <span className="font-semibold text-base text-slate-900 tracking-tight">iKlinika</span>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="btn-danger btn-sm"
        >
          <FiLogOut size={16} />
          Dilni
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 text-center mb-2">
          Zgjidhni panelin
        </h1>
        <p className="text-slate-500 text-center max-w-lg mb-8 text-sm leading-relaxed">
          Hapni panelin që përputhet me rolin tuaj. Vetëm paneli i duhur është i aktivizuar për llogarinë
          tuaj.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
          {cards
            .filter(({ panel }) => roleLower === "superadmin" || canEnterPanel(panel))
            .map(({ panel, title, subtitle, icon: Icon }) => {
              const allowed = canEnterPanel(panel);
              return (
                <button
                  key={panel}
                  type="button"
                  onClick={() => handleSelect(panel)}
                  className={`
                    text-left card p-5 transition-all group
                    ${allowed
                      ? "hover:shadow-card-md hover:border-slate-300/80 cursor-pointer"
                      : "opacity-75 hover:bg-slate-50 cursor-pointer"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className="icon-chip-lg">
                      <Icon size={20} aria-hidden />
                    </span>
                    {allowed && (
                      <FiChevronRight
                        size={18}
                        className="text-slate-300 group-hover:text-clinic-600 transition-colors shrink-0 mt-1"
                        aria-hidden
                      />
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>
                  {!allowed && (
                    <p className="mt-3 text-xs text-slate-600 font-medium bg-slate-100 rounded-lg px-3 py-2">
                      Klikoni për mesazh — nuk keni akses me këtë rol
                    </p>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
