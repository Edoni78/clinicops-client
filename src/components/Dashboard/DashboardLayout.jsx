import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Topbar from "./TopBar";
import ClinicAdminOnboardingTour from "../onboarding/ClinicAdminOnboardingTour";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useDashboardPanel } from "../../context/DashboardPanelContext";
import { useAuth } from "../../context/AuthContext";
import { isDashboardPathAllowed } from "../../utils/dashboardMenu";

function DashboardLayoutInner() {
  const location = useLocation();
  const { user } = useAuth();
  const { requiresPanel, activePanel, initialized, roleLower } = useDashboardPanel();
  const isPanelRoute = location.pathname === "/dashboard/panel";
  const hasClinic = !!(user?.clinicId ?? user?.ClinicId);

  if (!initialized) {
    return (
      <div className="h-screen flex items-center justify-center dashboard-bg">
        <LoadingSpinner size="lg" label="Duke ngarkuar panelin…" />
      </div>
    );
  }

  if (requiresPanel && !activePanel && !isPanelRoute) {
    return <Navigate to="/dashboard/panel" replace />;
  }

  const menuCtx = { roleLower, activePanel, hasClinic };
  if (!isPanelRoute && !isDashboardPathAllowed(location.pathname, menuCtx)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isPanelRoute) {
    return (
      <div className="min-h-screen dashboard-bg">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col dashboard-bg overflow-hidden">
      <Topbar />
      <ClinicAdminOnboardingTour />

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

const DashboardLayout = () => {
  return <DashboardLayoutInner />;
};

export default DashboardLayout;
