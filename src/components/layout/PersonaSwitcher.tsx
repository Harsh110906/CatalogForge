"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ChevronDown, LogOut, User, Shield, LogIn, UserPlus } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-[#0052ff]",
  EDITOR: "bg-emerald-500",
  SUPPLIER: "bg-amber-500",
  VIEWER: "bg-slate-500",
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
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full hover:bg-slate-100 transition-colors text-sm border border-slate-200/60 bg-white"
      >
        <div className="relative">
          <div className="w-7 h-7 rounded-full bg-[#0052ff] flex items-center justify-center text-xs font-bold text-white shadow-2xs">
            {currentUser.avatar || "U"}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
              ROLE_COLORS[currentUser.role] || "bg-[#0052ff]"
            }`}
          />
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-slate-900 font-semibold text-xs leading-tight">
            {currentUser.name}
          </div>
          <div className="text-[10px] text-slate-500 leading-tight font-mono">
            {ROLE_LABELS[currentUser.role] || currentUser.role}
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
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
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2.5 z-50 animate-scaleIn origin-top-right space-y-2">
            {/* User Details */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0052ff] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                  {currentUser.avatar || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Role:</span>
                <span className="text-[#0052ff] font-semibold font-mono">
                  {ROLE_LABELS[currentUser.role] || currentUser.role}
                </span>
              </div>
              {currentUser.supplierName && (
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Supplier:</span>
                  <span className="text-amber-600 font-semibold truncate max-w-[120px]">
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
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#0052ff]" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
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
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
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
