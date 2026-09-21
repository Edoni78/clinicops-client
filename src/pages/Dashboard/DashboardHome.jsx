import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { normalizeCaseStatus } from "./Cases/caseStatus";
import { formatDurationSince, formatUpdatedBy } from "../../utils/relativeTime";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";

function StatFigure({ value, loading }) {
  if (loading) {
    return <div className="h-6 w-16 bg-slate-200 rounded-md animate-pulse" aria-hidden />;
  }
  if (value === null || value === undefined) {
    return <p className="text-lg font-semibold text-slate-400 tabular-nums">—</p>;
  }
  return <p className="text-lg font-semibold text-slate-900 tabular-nums">{value}</p>;
}

function caseIdOf(c) {
  return c?.id ?? c?.Id;
}

function caseNameOf(c) {
  return `${c?.patientFirstName ?? c?.PatientFirstName ?? ""} ${c?.patientLastName ?? c?.PatientLastName ?? ""}`.trim();
}

function doctorOf(c) {
  return c?.assignedDoctorName ?? c?.AssignedDoctorName ?? "";
}

const DashboardHome = () => {
  const { user, role } = useAuth();
  const { activePanel } = useDashboardPanel();
  const roleLower = String(role || "").toLowerCase();
  const hasClinic = !!(user?.clinicId ?? user?.ClinicId);
  const [statsLoading, setStatsLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
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
      const list = Array.isArray(caseList) ? caseList : [];
      const nowIso = new Date().toISOString();
      let active = 0;
      let today = 0;
      list.forEach((c) => {
        const status = c.status ?? c.Status;
        if (!isTerminalCaseStatus(status)) active += 1;
        const created = c.createdAt ?? c.CreatedAt;
        if (isSameDay(created, nowIso)) today += 1;
      });
      setCases(list);
      setStats({
        totalPatients: patients.length,
        activeCases: active,
        todayAppointments: today,
      });
    } catch {
      setCases([]);
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
  const canOpenCases = allowedPaths.has("/dashboard/cases");

  const todayQueue = useMemo(() => {
    const nowIso = new Date().toISOString();
    return cases
      .filter((c) => isSameDay(c.createdAt ?? c.CreatedAt, nowIso))
      .sort((a, b) => new Date(a.createdAt ?? a.CreatedAt ?? 0) - new Date(b.createdAt ?? b.CreatedAt ?? 0));
  }, [cases]);

  const groupedQueue = useMemo(() => {
    const groups = new Map();
    todayQueue.forEach((c) => {
      const doctor = doctorOf(c) || "Pa mjek të caktuar";
      if (!groups.has(doctor)) groups.set(doctor, []);
      groups.get(doctor).push(c);
    });
    return Array.from(groups.entries());
  }, [todayQueue]);

  const selected = todayQueue.find((c) => caseIdOf(c) === selectedId) || todayQueue[0] || null;

  useEffect(() => {
    if (selected && caseIdOf(selected) !== selectedId) {
      setSelectedId(caseIdOf(selected));
    }
  }, [selected, selectedId]);

  const getCaseOpenPath = (c) => {
    const caseId = caseIdOf(c);
    if (!caseId) return "/dashboard/cases";
    if (roleLower === "doctor") return `/dashboard/cases/${caseId}/doctor`;
    if (roleLower === "nurse") return `/dashboard/cases/${caseId}/nurse`;
    const status = String(c?.status ?? c?.Status ?? "").trim().toLowerCase();
    if (["inconsultation", "completed", "finished"].includes(status)) {
      return `/dashboard/cases/${caseId}/doctor`;
    }
    return `/dashboard/cases/${caseId}/nurse`;
  };

  const statCards = [
    {
      key: "patients",
      label: "Pacientë",
      hint: "Të regjistruar",
      value: stats.totalPatients,
      link: "/dashboard/patients-list",
      icon: FiUsers,
    },
    {
      key: "cases",
      label: "Raste aktive",
      hint: "Jo të mbyllura",
      value: stats.activeCases,
      link: "/dashboard/cases",
      icon: FiFolder,
    },
    {
      key: "today",
      label: "Sot",
      hint: "Raste të hapura sot",
      value: stats.todayAppointments,
      link: "/dashboard/cases",
      icon: FiCalendar,
    },
  ];

  const latestUpdated = cases.reduce((latest, c) => {
    const t = new Date(c.updatedAt ?? c.UpdatedAt ?? c.createdAt ?? c.CreatedAt ?? 0).getTime();
    return t > latest ? t : latest;
  }, 0);

  return (
    <div className="page-shell">
      <PageHeader
        title="Sot / Radha"
        subtitle="Radha e rasteve të ditës dhe konteksti i pacientit aktiv."
        meta={latestUpdated ? formatUpdatedBy(latestUpdated) : null}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.85fr)_minmax(280px,1fr)] gap-3 items-start">
        <section className="table-shell min-h-[28rem]">
          <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Radha e sotme</h2>
            <span className="text-xs text-slate-500 tabular-nums">{todayQueue.length} raste</span>
          </div>

          {statsLoading ? (
            <div className="p-6">
              <div className="h-6 w-40 bg-slate-200 rounded-md animate-pulse mb-3" />
              <div className="h-8 w-full bg-slate-100 rounded-md animate-pulse" />
            </div>
          ) : todayQueue.length === 0 ? (
            <EmptyState
              icon={FiCalendar}
              title="Nuk ka raste për sot"
              description="Hapni një rast të ri për pacientin e parë të ditës."
              action={
                allowedPaths.has("/dashboard/patients") ? (
                  <Link to="/dashboard/patients" className="btn-primary btn-md">
                    Regjistro pacient
                  </Link>
                ) : canOpenCases ? (
                  <Link to="/dashboard/cases" className="btn-primary btn-md">
                    Shiko rastet
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className="table-scroll">
              {groupedQueue.map(([doctor, rows]) => (
                <div key={doctor}>
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {doctor}
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="table-head-row">
                        <th className="table-th">Pacienti</th>
                        <th className="table-th">Statusi</th>
                        <th className="table-th">Kohëzgjatja</th>
                        <th className="table-th text-right">Veprim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((c) => {
                        const id = caseIdOf(c);
                        const status = normalizeCaseStatus(c.status ?? c.Status);
                        const created = c.createdAt ?? c.CreatedAt;
                        const active = id === caseIdOf(selected);
                        return (
                          <tr
                            key={id}
                            className={`table-row cursor-pointer ${active ? "bg-sky-50/70" : ""}`}
                            onClick={() => setSelectedId(id)}
                          >
                            <td className="table-td">
                              <span className="font-medium text-slate-900">{caseNameOf(c) || "—"}</span>
                            </td>
                            <td className="table-td">
                              <StatusBadge status={status} />
                            </td>
                            <td className="table-td tabular-nums text-xs text-slate-500">
                              {formatDurationSince(created) || "—"}
                            </td>
                            <td className="table-td text-right">
                              {canOpenCases ? (
                                <Link
                                  to={getCaseOpenPath(c)}
                                  className="btn-secondary btn-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Hap
                                </Link>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-3 xl:sticky xl:top-0">
          <div className="grid grid-cols-3 gap-2">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link key={stat.key} to={stat.link} className="stat-card">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 truncate">
                      {stat.label}
                    </p>
                    <Icon size={12} className="text-slate-400 shrink-0" aria-hidden />
                  </div>
                  <StatFigure value={stat.value} loading={statsLoading} />
                </Link>
              );
            })}
          </div>

          <div className="card p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Pacienti aktiv
            </h3>
            {selected ? (
              <div>
                <p className="text-sm font-semibold text-slate-900">{caseNameOf(selected) || "—"}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge status={selected.status ?? selected.Status} />
                  {doctorOf(selected) ? (
                    <span className="badge-neutral">{doctorOf(selected)}</span>
                  ) : null}
                </div>
                <p className="audit-meta mt-2">
                  {formatUpdatedBy(
                    selected.updatedAt ?? selected.UpdatedAt ?? selected.createdAt ?? selected.CreatedAt,
                    doctorOf(selected)
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  Kohëzgjatja: {formatDurationSince(selected.createdAt ?? selected.CreatedAt) || "—"}
                </p>
                {canOpenCases && (
                  <Link to={getCaseOpenPath(selected)} className="btn-primary btn-sm mt-3 inline-flex">
                    Hap kartelën
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Zgjidhni një rast nga radha për të parë kontekstin.</p>
            )}
          </div>

          {visibleQuickActions.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-200">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Veprime të shpejta
                </h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {visibleQuickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <li key={action.title}>
                      <Link
                        to={action.link}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                      >
                        <Icon size={14} className="text-slate-400 shrink-0" aria-hidden />
                        <span className="flex-1 truncate">{action.title}</span>
                        <FiChevronRight size={14} className="text-slate-300" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default DashboardHome;
