import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getClinicProfile } from "../api/clinic";
import { useAuth } from "./AuthContext";
import {
  applyColorTheme,
  applyColorThemeFromProfile,
  DEFAULT_COLOR_THEME_ID,
  normalizeThemeId,
  parseColorThemePreferences,
  readStoredThemeId,
  writeStoredThemeId,
} from "../utils/colorThemePreferences";

const ClinicThemeContext = createContext(null);

export function ClinicThemeProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const clinicId = user?.clinicId ?? user?.ClinicId ?? null;
  const [themeId, setThemeId] = useState(DEFAULT_COLOR_THEME_ID);
  const [ready, setReady] = useState(false);

  const applyFromProfile = useCallback(
    (profile) => {
      const id = clinicId
        ? applyColorThemeFromProfile(profile, clinicId)
        : applyColorTheme(parseColorThemePreferences(profile).themeId);
      setThemeId(id);
      return id;
    },
    [clinicId]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      applyColorTheme(DEFAULT_COLOR_THEME_ID);
      setThemeId(DEFAULT_COLOR_THEME_ID);
      setReady(true);
      return;
    }

    if (!clinicId) {
      applyColorTheme(DEFAULT_COLOR_THEME_ID);
      setThemeId(DEFAULT_COLOR_THEME_ID);
      setReady(true);
      return;
    }

    const cached = readStoredThemeId(clinicId);
    if (cached) {
      applyColorTheme(cached);
      setThemeId(cached);
    }

    let cancelled = false;
    (async () => {
      try {
        const profile = await getClinicProfile();
        if (!cancelled) applyFromProfile(profile);
      } catch {
        if (!cancelled && cached) applyColorTheme(cached);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, clinicId, applyFromProfile]);

  const setTheme = useCallback(
    (nextThemeId) => {
      const id = normalizeThemeId(nextThemeId);
      applyColorTheme(id);
      if (clinicId) writeStoredThemeId(clinicId, id);
      setThemeId(id);
    },
    [clinicId]
  );

  const refreshFromProfile = useCallback(
    (profile) => {
      if (profile) applyFromProfile(profile);
    },
    [applyFromProfile]
  );

  return (
    <ClinicThemeContext.Provider
      value={{ themeId, ready, setTheme, refreshFromProfile }}
    >
      {children}
    </ClinicThemeContext.Provider>
  );
}

export function useClinicTheme() {
  const ctx = useContext(ClinicThemeContext);
  if (!ctx) {
    throw new Error("useClinicTheme must be used within ClinicThemeProvider");
  }
  return ctx;
}
