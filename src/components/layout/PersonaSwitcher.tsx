"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ChevronDown, LogOut, User, Shield, LogIn, UserPlus } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-indigo-500",
  EDITOR: "bg-emerald-500",
  SUPPLIER: "bg-amber-500",
  VIEWER: "bg-zinc-500",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  EDITOR: "Editor",
  SUPPLIER: "Supplier",
  VIEWER: "Viewer",
};

export function PersonaSwitcher() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors text-sm"
      >
        <div className="relative">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-xs font-semibold text-white border border-indigo-400/30">
            {currentUser.avatar || "U"}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#09090b] ${
              ROLE_COLORS[currentUser.role] || "bg-indigo-500"
            }`}
          />
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-zinc-200 font-medium text-xs leading-tight">
            {currentUser.name}
          </div>
          <div className="text-[10px] text-zinc-500 leading-tight font-mono">
            {ROLE_LABELS[currentUser.role] || currentUser.role}
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/40 p-2 z-50 animate-scaleIn origin-top-right space-y-2">
            {/* User Details */}
            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">
                  {currentUser.avatar || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-zinc-200 truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Role:</span>
                <span className="text-indigo-400 font-medium font-mono">
                  {ROLE_LABELS[currentUser.role] || currentUser.role}
                </span>
              </div>
              {currentUser.supplierName && (
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Supplier:</span>
                  <span className="text-amber-400 font-medium truncate max-w-[120px]">
                    {currentUser.supplierName}
                  </span>
                </div>
              )}
            </div>

            {/* Auth Actions */}
            <div className="space-y-1">
              {!isAuthenticated && (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Register New Account</span>
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
