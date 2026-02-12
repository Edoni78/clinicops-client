import React from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiFolder,
  FiFileText,
  FiActivity,
  FiDollarSign,
  FiUserPlus,
} from "react-icons/fi";

const DashboardHome = () => {
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Përmbledhja e panelit
        </h1>
        <p className="text-slate-600">
          Mirë se vini në ClinicOps. Menaxhoni operacionet e klinikës në mënyrë efikase.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action) => {
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

      {/* Stats Section (Placeholder for future) */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Totali i pacientëve
          </h3>
          <p className="text-3xl font-bold text-slate-900">-</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Rastet aktive
          </h3>
          <p className="text-3xl font-bold text-slate-900">-</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-2">
            Takimet e sotme
          </h3>
          <p className="text-3xl font-bold text-slate-900">-</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
