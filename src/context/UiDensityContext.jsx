import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "clinicops_ui_density";
const DENSITIES = ["compact", "comfortable"];

function readStoredDensity() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return DENSITIES.includes(raw) ? raw : "compact";
  } catch {
    return "compact";
  }
}

const UiDensityContext = createContext(null);

export function UiDensityProvider({ children }) {
  const [density, setDensityState] = useState(readStoredDensity);

  useEffect(() => {
    document.documentElement.dataset.density = density;
    try {
      localStorage.setItem(STORAGE_KEY, density);
    } catch {
      /* ignore */
    }
  }, [density]);

  const setDensity = useCallback((next) => {
    setDensityState(DENSITIES.includes(next) ? next : "compact");
  }, []);

  const toggleDensity = useCallback(() => {
    setDensityState((prev) => (prev === "compact" ? "comfortable" : "compact"));
  }, []);

  return (
    <UiDensityContext.Provider value={{ density, setDensity, toggleDensity }}>
      {children}
    </UiDensityContext.Provider>
  );
}

export function useUiDensity() {
  const ctx = useContext(UiDensityContext);
  if (!ctx) {
    throw new Error("useUiDensity must be used within UiDensityProvider");
  }
  return ctx;
}
