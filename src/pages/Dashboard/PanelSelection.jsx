import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiActivity, FiFileText, FiShield, FiLogOut } from "react-icons/fi";
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
    accent: "from-teal-500 to-teal-600",
    border: "border-teal-400",
  },
  {
    panel: PANEL_DOCTOR,
    title: "Paneli i mjekut",
    subtitle: "Rastet, raportet, profili i mjekut, laboratori",
    icon: FiFileText,
    accent: "from-violet-500 to-violet-600",
    border: "border-violet-400",
  },
  {
    panel: PANEL_SUPERADMIN,
    title: "Paneli i super administratorit",
    subtitle: "Aplikimet, stafi, shërbimet, menaxhim i plotë",
    icon: FiShield,
    accent: "from-slate-700 to-slate-900",
    border: "border-slate-500",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col">
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <span className="font-bold text-xl tracking-tight text-[#81a2c5]">iKlinika</span>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600"
        >
          <FiLogOut size={18} />
          Dilni
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-2">
          Zgjidhni panelin
        </h1>
        <p className="text-slate-600 text-center max-w-lg mb-10 text-sm sm:text-base">
          Hapni panelin që përputhet me rolin tuaj. Vetëm paneli i duhur është i aktivizuar për llogarinë
          tuaj.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {cards.map(({ panel, title, subtitle, icon: Icon, accent, border }) => {
            const allowed = canEnterPanel(panel);
            return (
              <button
                key={panel}
                type="button"
                onClick={() => handleSelect(panel)}
                className={`
                  text-left rounded-2xl border-2 p-6 transition-all shadow-sm
                  ${allowed
                    ? `bg-white ${border} hover:shadow-lg hover:scale-[1.02] cursor-pointer`
                    : "bg-slate-50 border-slate-200 opacity-80 hover:bg-slate-100 cursor-pointer"
                  }
                `}
              >
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${accent} text-white mb-4`}
                >
                  <Icon size={28} />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">{title}</h2>
                <p className="text-sm text-slate-600">{subtitle}</p>
                {!allowed && (
                  <p className="mt-4 text-xs text-amber-700 font-medium">
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
