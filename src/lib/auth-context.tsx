"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "ADMIN" | "EDITOR" | "SUPPLIER" | "VIEWER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  supplierId?: string;
  supplierName?: string;
  avatar?: string;
}

interface AuthContextType {
  currentUser: AuthUser;
  setCurrentUser: (user: AuthUser) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSupplier: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canPublish: boolean;
  activeOrg: { id: string; name: string; slug: string };
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; role?: string; organizationName?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const DEFAULT_USER: AuthUser = {
  id: "user-admin",
  name: "Workspace Administrator",
  email: "admin@catalogforge.com",
  role: "ADMIN",
  organizationName: "Global Industrial Automation",
  avatar: "WA",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeOrg, setActiveOrg] = useState({
    id: "org-global-industrial",
    name: "Global Industrial Automation & Controls",
    slug: "global-industrial",
  });

  const getInitials = (name: string) => {
    if (!name) return "CF";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/me");
      const json = await res.json();

      if (json.success && json.user) {
        const u = json.user;
        const formattedUser: AuthUser = {
          ...u,
          avatar: getInitials(u.name),
        };
        setCurrentUser(formattedUser);
        setIsAuthenticated(true);
        if (u.organizationName) {
          setActiveOrg({
            id: u.organizationId || "org-1",
            name: u.organizationName,
            slug: u.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          });
        }
      } else if (json.fallbackUser) {
        const u = json.fallbackUser;
        const formattedUser: AuthUser = {
          ...u,
          avatar: getInitials(u.name),
        };
        setCurrentUser(formattedUser);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error("Failed to load authenticated user:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success && json.user) {
        const u = json.user;
        const formattedUser: AuthUser = {
          ...u,
          avatar: getInitials(u.name),
        };
        setCurrentUser(formattedUser);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: json.error || "Login failed" };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error during login" };
    }
  };

  const register = async (data: { name: string; email: string; password: string; role?: string; organizationName?: string }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.user) {
        const u = json.user;
        const formattedUser: AuthUser = {
          ...u,
          avatar: getInitials(u.name),
        };
        setCurrentUser(formattedUser);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: json.error || "Registration failed" };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error during registration" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    setIsAuthenticated(false);
    setCurrentUser(DEFAULT_USER);
    router.push("/login");
  };

  const handleSetUser = (user: AuthUser) => {
    setCurrentUser({
      ...user,
      avatar: getInitials(user.name),
    });
  };

  const isSupplier = currentUser.role === "SUPPLIER";
  const canEdit = currentUser.role === "ADMIN" || currentUser.role === "EDITOR" || currentUser.role === "SUPPLIER";
  const canApprove = currentUser.role === "ADMIN" || currentUser.role === "EDITOR";
  const canPublish = currentUser.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetUser,
        isAuthenticated,
        isLoading,
        isSupplier,
        canEdit,
        canApprove,
        canPublish,
        activeOrg,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
