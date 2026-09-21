import React, { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Topbar from "./TopBar";
import Sidebar from "./Sidebar";
import ClinicAdminOnboardingTour from "../onboarding/ClinicAdminOnboardingTour";
import LoadingSpinner from "../ui/LoadingSpinner";
import CommandPalette from "../ui/CommandPalette";
import { useDashboardPanel } from "../../context/DashboardPanelContext";
import { useAuth } from "../../context/AuthContext";
import { isDashboardPathAllowed } from "../../utils/dashboardMenu";

function DashboardLayoutInner() {
  const location = useLocation();
  const { user } = useAuth();
  const { requiresPanel, activePanel, initialized, roleLower } = useDashboardPanel();
  const isPanelRoute = location.pathname === "/dashboard/panel";
  const hasClinic = !!(user?.clinicId ?? user?.ClinicId);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      const isK = e.key === "k" || e.key === "K";
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    <div className="h-screen flex overflow-hidden dashboard-bg">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <ClinicAdminOnboardingTour />
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

const DashboardLayout = () => {
  return <DashboardLayoutInner />;
};

export default DashboardLayout;
