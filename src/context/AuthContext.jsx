import React, { createContext, useContext, useEffect, useState } from "react";
import { getClinicModeFromUser } from "../utils/clinicMode";
import { getRoleFromJwt } from "../utils/jwt";
import { supabase } from "../lib/supabaseClient";
import {
  clearProfileCache,
  fetchCurrentProfile,
  mapProfileToUser,
  persistAccessToken,
} from "../lib/sessionUser";
import { logout as endSupabaseSession } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      window.setTimeout(async () => {
        if (!active) return;
        try {
          if (!session) {
            if (event === "SIGNED_OUT") {
              clearProfileCache();
              setUser(null);
              localStorage.removeItem("accessToken");
              localStorage.removeItem("token_expires");
              localStorage.removeItem("user");
            }
            return;
          }

          persistAccessToken(session);
          if (event === "TOKEN_REFRESHED") return;

          try {
            const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
              setUser(null);
              return;
            }
          } catch {
            // Continue when the project has not enabled MFA.
          }

          const profile = await fetchCurrentProfile(true);
          if (!profile?.is_active || !profile?.role) {
            await supabase.auth.signOut();
            clearProfileCache();
            setUser(null);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            return;
          }

          const mapped = mapProfileToUser(profile);
          localStorage.setItem("user", JSON.stringify(mapped));
          setUser(mapped);
        } catch {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              setUser(JSON.parse(stored));
            } catch {
              setUser(null);
            }
          }
        } finally {
          if (active) setLoading(false);
        }
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = (userData) => {
    const normalized = userData && typeof userData === "object"
      ? { ...userData, role: userData.role ?? userData.Role }
      : userData;
    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token_expires");
    localStorage.removeItem("user");
    localStorage.removeItem("clinicops_active_panel");
    endSupabaseSession().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? user?.Role ?? getRoleFromJwt() ?? null,
        clinicMode: getClinicModeFromUser(user),
        isAuthenticated: !!user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
