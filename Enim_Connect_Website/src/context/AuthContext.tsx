import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api/client";

interface AuthContextValue {
  isAuthenticated: boolean;
  role: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [role, setRole] = useState<string | null>(api.getRole());

  const login = useCallback(async (email: string, password: string) => {
    await api.login(email, password);
    setIsAuthenticated(true);
    setRole(api.getRole());
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setIsAuthenticated(false);
    setRole(null);
  }, []);

  const register = useCallback(
    async (email: string, password: string, role: string) => {
      await api.register(email, password, role);
    },
    []
  );

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
