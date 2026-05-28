import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiFolder,
  FiFileText,
  FiActivity,
  FiDollarSign,
  FiUserPlus,
  FiCalendar,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useDashboardPanel } from "../../context/DashboardPanelContext";
import { getSidebarMenuItems } from "../../utils/dashboardMenu";
import api from "../../api/axios";
import { getPatientCases } from "../../api/patientCase";
import { isSameDay, isTerminalCaseStatus } from "../../utils/caseListFilters";
import PageHeader from "../../components/ui/PageHeader";

function StatFigure({ value, loading }) {
  if (loading) {
    return <div className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse" aria-hidden />;
  }
  if (value === null || value === undefined) {
    return <p className="text-3xl font-bold text-slate-400">—</p>;
  }
  return <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>;
}

const DashboardHome = () => {
  const { user, role } = useAuth();
  const { activePanel } = useDashboardPanel();
  const roleLower = String(role || "").toLowerCase();
  const hasClinic = !!(user?.clinicId ?? user?.ClinicId);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: null,
    activeCases: null,
    todayAppointments: null,
  });

  const loadDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [patientRes, caseList] = await Promise.all([api.get("/api/Patient"), getPatientCases()]);
      const patients = Array.isArray(patientRes.data) ? patientRes.data : [];
      const cases = Array.isArray(caseList) ? caseList : [];
      const nowIso = new Date().toISOString();
      let active = 0;
      let today = 0;
      cases.forEach((c) => {
        const status = c.status ?? c.Status;
        if (!isTerminalCaseStatus(status)) active += 1;
        const created = c.createdAt ?? c.CreatedAt;
        if (isSameDay(created, nowIso)) today += 1;
      });
      setStats({
        totalPatients: patients.length,
        activeCases: active,
        todayAppointments: today,
      });
    } catch {
      setStats({ totalPatients: null, activeCases: null, todayAppointments: null });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const quickActions = [
    {
      title: "Regjistro pacient të ri",
      description: "Shto një pacient të ri në sistem",
      icon: FiUserPlus,
      link: "/dashboard/patients",
      accent: "bg-sky-500 text-white",
    },
    {
      title: "Shiko pacientët",
      description: "Shiko dhe menaxho të dhënat e pacientëve",
      icon: FiUsers,
      link: "/dashboard/patients-list",
      accent: "bg-emerald-500 text-white",
    },
    {
      title: "Rastet",
      description: "Menaxho rastet dhe trajtimin e pacientëve",
      icon: FiFolder,
      link: "/dashboard/cases",
      accent: "bg-violet-500 text-white",
    },
    {
      title: "Raportet",
      description: "Shiko dhe shkarko raportet e vizitave të përfunduara",
      icon: FiFileText,
      link: "/dashboard/reports",
      accent: "bg-indigo-500 text-white",
    },
    {
      title: "Laboratori",
      description: "Shiko rezultatet dhe testet e laboratorit",
      icon: FiActivity,
      link: "/dashboard/laboratory",
      accent: "bg-amber-500 text-white",
    },
    {
      title: "Pagesat",
      description: "Menaxho faturimin dhe pagesat",
      icon: FiDollarSign,
      link: "/dashboard/payments",
      accent: "bg-teal-500 text-white",
    },
  ];
  const allowedPaths = new Set(
    getSidebarMenuItems({ roleLower, activePanel, hasClinic }).map((i) => i.path)
  );
  const visibleQuickActions = quickActions.filter((a) => allowedPaths.has(a.link));

  return (
    <div className="page-shell">
      <PageHeader
        title="Përmbledhja e panelit"
        subtitle="Mirë se vini në iKlinika. Menaxhoni operacionet e klinikës në mënyrë efikase."
      />

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link to="/dashboard/patients-list" className="stat-card group">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 group-hover:bg-emerald-500/15 transition-colors">
              <FiUsers size={22} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-slate-600 mb-2">Totali i pacientëve</h3>
              <StatFigure value={stats.totalPatients} loading={statsLoading} />
              <p className="text-xs text-slate-500 mt-2">Të regjistruar në klinikë</p>
            </div>
          </div>
        </Link>
        <Link to="/dashboard/cases" className="stat-card group">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-700 group-hover:bg-violet-500/15 transition-colors">
              <FiFolder size={22} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-slate-600 mb-2">Rastet aktive</h3>
              <StatFigure value={stats.activeCases} loading={statsLoading} />
              <p className="text-xs text-slate-500 mt-2">Jo përfunduar / jo të mbyllura</p>
            </div>
          </div>
        </Link>
        <Link to="/dashboard/cases" className="stat-card group sm:col-span-2 lg:col-span-1">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-700 group-hover:bg-sky-500/15 transition-colors">
              <FiCalendar size={22} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-slate-600 mb-2">Takimet e sotme</h3>
              <StatFigure value={stats.todayAppointments} loading={statsLoading} />
              <p className="text-xs text-slate-500 mt-2">Raste të hapur sot (data e krijimit)</p>
            </div>
          </div>
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-4">Veprime të shpejta</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {visibleQuickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.link}
              className="card p-5 sm:p-6 hover:shadow-card-md hover:border-clinic-300/40 transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`${action.accent} p-3 rounded-xl transition-transform duration-200 group-hover:scale-105 shadow-sm`}
                >
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{action.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHome;
