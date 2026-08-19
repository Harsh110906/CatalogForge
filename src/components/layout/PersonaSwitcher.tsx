"use client";

import React, { useState } from "react";
import { useAuth, PRESET_PERSONAS } from "@/lib/auth-context";
import { ChevronDown, Check } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-indigo-500",
  EDITOR: "bg-emerald-500",
  SUPPLIER: "bg-amber-500",
  VIEWER: "bg-zinc-500",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  SUPPLIER: "Supplier",
  VIEWER: "Viewer",
};

export function PersonaSwitcher() {
  const { currentUser, setCurrentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors text-sm"
      >
        <div className="relative">
          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300 border border-zinc-700">
            {currentUser.avatar}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#09090b] ${
              ROLE_COLORS[currentUser.role]
            }`}
          />
        </div>
        <span className="text-zinc-300 font-medium text-[13px] hidden sm:inline">
          {currentUser.name.split(" ")[0]}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-500 transition-transform ${
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
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/40 p-1.5 z-50 animate-scaleIn origin-top-right">
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-medium text-zinc-400">
                Switch persona
              </p>
            </div>

            {PRESET_PERSONAS.map((p) => {
              const isSelected = p.id === currentUser.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setCurrentUser(p);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                    isSelected
                      ? "bg-indigo-500/10"
                      : "hover:bg-zinc-800/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300 border border-zinc-700">
                        {p.avatar}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${
                          ROLE_COLORS[p.role]
                        }`}
                      />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-zinc-200">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {ROLE_LABELS[p.role]}
                        {p.supplierName && ` · ${p.supplierName}`}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
