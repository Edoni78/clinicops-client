import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Normalize so role is always available (backend may send Role)
        if (parsed && !parsed.role && parsed.Role != null) {
          parsed.role = parsed.Role;
        }
        setUser(parsed);
      } catch {
        setUser(null);
      }
    }

    setLoading(false);
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
  };

  return (
    <AuthContext.Provider
        value={{
        user,
        role: user?.role ?? user?.Role ?? null,
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
