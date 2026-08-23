"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  Building2,
  CheckSquare,
  Rss,
  Settings,
  Search,
  Bot,
  Zap,
  PanelLeftClose,
  PanelLeft,
  Bell,
  GitCompare,
  MessageSquare,
} from "lucide-react";
import { PersonaSwitcher } from "./PersonaSwitcher";
import { useAuth } from "@/lib/auth-context";
import { AIChatPanel } from "./AIChatPanel";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "core" | "quality" | "commerce" | "system";
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, group: "core" },
  { name: "Products", href: "/products", icon: Boxes, group: "core" },
  { name: "Ingestion", href: "/ingestion", icon: FileSpreadsheet, group: "core" },
  { name: "Validation", href: "/validation", icon: AlertTriangle, group: "quality" },
  { name: "Approvals", href: "/approvals", icon: CheckSquare, group: "quality" },
  { name: "Suppliers", href: "/suppliers", icon: Building2, group: "quality" },
  { name: "Compliance", href: "/compliance", icon: Bot, group: "commerce" },
  { name: "Feeds", href: "/feeds", icon: Rss, group: "commerce" },
  { name: "Compare", href: "/products/compare", icon: GitCompare, group: "commerce" },
  { name: "Settings", href: "/settings", icon: Settings, group: "system" },
];

const GROUPS: { key: string; label: string }[] = [
  { key: "core", label: "Catalog" },
  { key: "quality", label: "Quality" },
  { key: "commerce", label: "Commerce" },
  { key: "system", label: "System" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isAuthenticated, isSupplier } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Unauthenticated or standalone landing/auth pages do not render sidebar
  if (pathname === "/landing" || pathname === "/login" || pathname === "/register" || (!isAuthenticated && pathname === "/")) {
    return <main className="min-h-screen bg-white text-slate-900">{children}</main>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0052ff] flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-base">
                ⚡
              </div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">
                Catalog<span className="text-[#0052ff]">Forge</span>
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="mx-auto">
              <div className="w-8 h-8 rounded-full bg-[#0052ff] flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-base">
                ⚡
              </div>
            </Link>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Supplier Banner */}
        {isSupplier && !collapsed && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
            <div className="font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Supplier Portal
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((item) => item.group === group.key);
            const filteredItems = isSupplier
              ? items.filter((i) => ["/", "/products", "/ingestion", "/validation"].includes(i.href))
              : items;

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.key} className="space-y-1">
                {!collapsed && (
                  <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {group.label}
                  </div>
                )}
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-[#0052ff] text-white shadow-md shadow-blue-500/20"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Engine Online</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Top Header Bar */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between gap-4">
          {/* Global Search Bar */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, SKUs, suppliers..."
              className="w-full pl-9 pr-12 py-2 rounded-full bg-slate-100 border border-slate-200/80 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0052ff] focus:bg-white transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs">
              ⌘K
            </kbd>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* AI Assistant Chat Trigger */}
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0052ff] border border-blue-100 text-xs font-semibold transition-all shadow-2xs"
            >
              <Bot className="w-4 h-4 text-[#0052ff]" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>

            {/* Notifications */}
            <button className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0052ff]" />
            </button>

            <div className="h-4 w-px bg-slate-200" />

            {/* User Profile Menu */}
            <PersonaSwitcher />
          </div>
        </header>

        {/* Page Main View */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Floating AI Chat Assistant Panel */}
      <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
