import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { getJwtPayload } from "../utils/jwt";

const PANEL_STORAGE_KEY = "clinicops_active_panel";

export const PANEL_NURSE = "nurse";
export const PANEL_DOCTOR = "doctor";
export const PANEL_SUPERADMIN = "superadmin";

const DashboardPanelContext = createContext(null);

function getEffectiveUserId(user) {
  const fromUser = user?.id ?? user?.Id ?? user?.sub;
  if (fromUser != null && fromUser !== "") return String(fromUser);
  const p = getJwtPayload();
  if (!p) return null;
  return (
    p.sub ??
    p.nameid ??
    p["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
    null
  );
}

function readStoredPanel(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(PANEL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.userId !== userId) return null;
    if (![PANEL_NURSE, PANEL_DOCTOR, PANEL_SUPERADMIN].includes(parsed.panel)) return null;
    return parsed.panel;
  } catch {
    return null;
  }
}

function validatePanelForRole(panel, roleLower) {
  if (!panel) return false;
  if (roleLower === "nurse") return panel === PANEL_NURSE;
  if (roleLower === "doctor") return panel === PANEL_DOCTOR;
  if (roleLower === "superadmin") return true;
  return false;
}

export function DashboardPanelProvider({ children }) {
  const { user, role } = useAuth();
  const userId = getEffectiveUserId(user);
  const roleLower = String(role || "").toLowerCase();

  const requiresPanel = useMemo(
    () => ["nurse", "doctor", "superadmin"].includes(roleLower),
    [roleLower]
  );

  const [activePanel, setActivePanelState] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!userId) {
      setActivePanelState(null);
      setInitialized(true);
      return;
    }

    if (!requiresPanel) {
      setActivePanelState(null);
      setInitialized(true);
      return;
    }

    const stored = readStoredPanel(userId);
    if (stored && validatePanelForRole(stored, roleLower)) {
      setActivePanelState(stored);
    } else {
      setActivePanelState(null);
      if (stored) localStorage.removeItem(PANEL_STORAGE_KEY);
    }
    setInitialized(true);
  }, [userId, roleLower, requiresPanel]);

  const setActivePanel = useCallback(
    (panel) => {
      if (!userId) return;
      if (![PANEL_NURSE, PANEL_DOCTOR, PANEL_SUPERADMIN].includes(panel)) return;
      if (!validatePanelForRole(panel, roleLower)) return;
      setActivePanelState(panel);
      localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify({ panel, userId }));
    },
    [userId, roleLower]
  );

  const clearActivePanel = useCallback(() => {
    setActivePanelState(null);
    localStorage.removeItem(PANEL_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      activePanel,
      setActivePanel,
      clearActivePanel,
      requiresPanel,
      initialized,
      roleLower,
      PANEL_NURSE,
      PANEL_DOCTOR,
      PANEL_SUPERADMIN,
    }),
    [activePanel, setActivePanel, clearActivePanel, requiresPanel, initialized, roleLower]
  );

  return <DashboardPanelContext.Provider value={value}>{children}</DashboardPanelContext.Provider>;
}

export function useDashboardPanel() {
  const ctx = useContext(DashboardPanelContext);
  if (!ctx) {
    throw new Error("useDashboardPanel must be used within DashboardPanelProvider");
  }
  return ctx;
}
