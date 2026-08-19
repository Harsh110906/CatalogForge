"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "ADMIN" | "EDITOR" | "SUPPLIER" | "VIEWER";

export interface PersonaUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  supplierId?: string;
  supplierName?: string;
  avatar: string;
}

export const PRESET_PERSONAS: PersonaUser[] = [
  {
    id: "user-admin-1",
    name: "Sarah Chen",
    email: "sarah.chen@global-industrial.com",
    role: "ADMIN",
    avatar: "SC",
  },
  {
    id: "user-editor-1",
    name: "Marcus Vance",
    email: "marcus.vance@global-industrial.com",
    role: "EDITOR",
    avatar: "MV",
  },
  {
    id: "user-supplier-1",
    name: "Elena Rostova",
    email: "elena@acme-electro.de",
    role: "SUPPLIER",
    supplierId: "ACME-ELEC", // Match code or ID
    supplierName: "Acme Electrical Components",
    avatar: "ER",
  },
  {
    id: "user-viewer-1",
    name: "David Kim",
    email: "david.kim@compliance-audit.org",
    role: "VIEWER",
    avatar: "DK",
  },
];

interface AuthContextType {
  currentUser: PersonaUser;
  setCurrentUser: (user: PersonaUser) => void;
  isSupplier: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canPublish: boolean;
  activeOrg: { id: string; name: string; slug: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<PersonaUser>(PRESET_PERSONAS[0]);
  const [activeOrg] = useState({
    id: "org-global-industrial",
    name: "Global Industrial Automation & Controls",
    slug: "global-industrial",
  });

  // Load persona from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem("catalog_workspace_persona");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = PRESET_PERSONAS.find((p) => p.email === parsed.email);
        if (match) setCurrentUser(match);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSetUser = (user: PersonaUser) => {
    setCurrentUser(user);
    localStorage.setItem("catalog_workspace_persona", JSON.stringify(user));
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
        isSupplier,
        canEdit,
        canApprove,
        canPublish,
        activeOrg,
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
