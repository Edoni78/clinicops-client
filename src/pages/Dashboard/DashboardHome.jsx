import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiFolder,
  FiFileText,
  FiBookOpen,
  FiActivity,
  FiDollarSign,
  FiUserPlus,
  FiCalendar,
  FiChevronRight,
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
    return <div className="h-8 w-20 bg-slate-200/80 rounded-md animate-pulse" aria-hidden />;
  }
  if (value === null || value === undefined) {
    return <p className="text-2xl font-semibold text-slate-400 tabular-nums">—</p>;
  }
  return <p className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>;
}

const STAT_ICONS = {
  patients: FiUsers,
  cases: FiFolder,
  today: FiCalendar,
};

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
    },
    {
      title: "Shiko pacientët",
      description: "Shiko dhe menaxho të dhënat e pacientëve",
      icon: FiUsers,
      link: "/dashboard/patients-list",
    },
    {
      title: "Rastet",
      description: "Menaxho rastet dhe trajtimin e pacientëve",
      icon: FiFolder,
      link: "/dashboard/cases",
    },
    {
      title: "Raportet",
      description: "Shiko dhe shkarko raportet e vizitave të përfunduara",
      icon: FiFileText,
      link: "/dashboard/reports",
    },
    {
      title: "EMRs",
      description: "Historiku i konsultave për secilin pacient",
      icon: FiBookOpen,
      link: "/dashboard/emrs",
    },
    {
      title: "Laboratori",
      description: "Shiko rezultatet dhe testet e laboratorit",
      icon: FiActivity,
      link: "/dashboard/laboratory",
    },
    {
      title: "Pagesat",
      description: "Menaxho faturimin dhe pagesat",
      icon: FiDollarSign,
      link: "/dashboard/payments",
    },
  ];
  const allowedPaths = new Set(
    getSidebarMenuItems({ roleLower, activePanel, hasClinic }).map((i) => i.path)
  );
  const visibleQuickActions = quickActions.filter((a) => allowedPaths.has(a.link));

  const statCards = [
    {
      key: "patients",
      label: "Totali i pacientëve",
      hint: "Të regjistruar në klinikë",
      value: stats.totalPatients,
      link: "/dashboard/patients-list",
      icon: STAT_ICONS.patients,
    },
    {
      key: "cases",
      label: "Rastet aktive",
      hint: "Jo përfunduar / jo të mbyllura",
      value: stats.activeCases,
      link: "/dashboard/cases",
      icon: STAT_ICONS.cases,
    },
    {
      key: "today",
      label: "Takimet e sotme",
      hint: "Raste të hapur sot",
      value: stats.todayAppointments,
      link: "/dashboard/cases",
      icon: STAT_ICONS.today,
    },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title="Përmbledhja e panelit"
        subtitle="Mirë se vini. Menaxhoni operacionet e klinikës nga një vend i vetëm."
      />

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.key}
              to={stat.link}
              className={`stat-card group ${idx === 2 ? "sm:col-span-2 lg:col-span-1" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                    {stat.label}
                  </p>
                  <StatFigure value={stat.value} loading={statsLoading} />
                  <p className="text-xs text-slate-500 mt-2">{stat.hint}</p>
                </div>
                <span className="icon-chip group-hover:bg-clinic-100 transition-colors">
                  <Icon size={18} aria-hidden />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <h2 className="section-title">Veprime të shpejta</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleQuickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.link}
              className="card p-5 hover:shadow-card-md hover:border-slate-300/80 transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                <span className="icon-chip group-hover:bg-clinic-100 transition-colors">
                  <Icon size={18} aria-hidden />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{action.title}</h3>
                    <FiChevronRight
                      size={16}
                      className="text-slate-300 group-hover:text-clinic-500 shrink-0 mt-0.5 transition-colors"
                      aria-hidden
                    />
                  </div>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{action.description}</p>
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
