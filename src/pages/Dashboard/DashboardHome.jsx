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
import { CLINIC_MODE_SOLO_DOCTOR } from "../../utils/clinicMode";
import api from "../../api/axios";
import { getPatientCases } from "../../api/patientCase";
import { isSameDay, isTerminalCaseStatus } from "../../utils/caseListFilters";

function StatFigure({ value, loading }) {
  if (loading) {
    return <div className="h-9 w-24 bg-slate-200 rounded-md animate-pulse" aria-hidden />;
  }
  if (value === null || value === undefined) {
    return <p className="text-3xl font-bold text-slate-400">—</p>;
  }
  return <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>;
}

const DashboardHome = () => {
  const { clinicMode } = useAuth();
  const isSoloDoctorClinic = clinicMode === CLINIC_MODE_SOLO_DOCTOR;
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
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
    },
    {
      title: "Shiko pacientët",
      description: "Shiko dhe menaxho të dhënat e pacientëve",
      icon: FiUsers,
      link: "/dashboard/patients-list",
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
    },
    {
      title: "Rastet",
      description: "Menaxho rastet dhe trajtimin e pacientëve",
      icon: FiFolder,
      link: "/dashboard/cases",
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
    },
    {
      title: "Raportet",
      description: "Shiko dhe shkarko raportet e vizitave të përfunduara",
      icon: FiFileText,
      link: "/dashboard/reports",
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600",
    },
    {
      title: "Laboratori",
      description: "Shiko rezultatet dhe testet e laboratorit",
      icon: FiActivity,
      link: "/dashboard/laboratory",
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
    },
    {
      title: "Pagesat",
      description: "Menaxho faturimin dhe pagesat",
      icon: FiDollarSign,
      link: "/dashboard/payments",
      color: "bg-emerald-500",
      hoverColor: "hover:bg-emerald-600",
    },
  ];
  const visibleQuickActions = isSoloDoctorClinic
    ? quickActions.filter((a) => a.link !== "/dashboard/laboratory")
    : quickActions;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Përmbledhja e panelit
        </h1>
        <p className="text-slate-600">
          Mirë se vini në iKlinika. Menaxhoni operacionet e klinikës në mënyrë efikase.
        </p>
      </div>

      {/* Live stats */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/dashboard/patients-list"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-[#81a2c5]/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-green-500/10 text-green-700 group-hover:bg-green-500/15 transition-colors">
              <FiUsers size={22} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-slate-600 mb-2">Totali i pacientëve</h3>
              <StatFigure value={stats.totalPatients} loading={statsLoading} />
              <p className="text-xs text-slate-500 mt-2">Të regjistruar në klinikë</p>
            </div>
          </div>
        </Link>
        <Link
          to="/dashboard/cases"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-[#81a2c5]/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-700 group-hover:bg-purple-500/15 transition-colors">
              <FiFolder size={22} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-slate-600 mb-2">Rastet aktive</h3>
              <StatFigure value={stats.activeCases} loading={statsLoading} />
              <p className="text-xs text-slate-500 mt-2">Jo përfunduar / jo të mbyllura</p>
            </div>
          </div>
        </Link>
        <Link
          to="/dashboard/cases"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-[#81a2c5]/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-700 group-hover:bg-sky-500/15 transition-colors">
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

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleQuickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.link}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6
                hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`${action.color} ${action.hoverColor} p-3 rounded-lg
                    text-white transition-colors duration-200 group-hover:scale-110`}
                >
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-600">{action.description}</p>
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
