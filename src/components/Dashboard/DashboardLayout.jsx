import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./TopBar";
import { useDashboardPanel } from "../../context/DashboardPanelContext";

function DashboardLayoutInner() {
  const location = useLocation();
  const { requiresPanel, activePanel, initialized } = useDashboardPanel();
  const isPanelRoute = location.pathname === "/dashboard/panel";

  if (!initialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin h-10 w-10 border-2 border-[#81a2c5] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (requiresPanel && !activePanel && !isPanelRoute) {
    return <Navigate to="/dashboard/panel" replace />;
  }

  if (isPanelRoute) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const DashboardLayout = () => {
  return <DashboardLayoutInner />;
};

export default DashboardLayout;
