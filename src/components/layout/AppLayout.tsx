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
  const { currentUser, isSupplier } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 flex flex-col border-r border-zinc-800/80 bg-[#0c0c0e] transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        {/* Brand */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-zinc-800/60">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm text-zinc-100 tracking-tight">
                CatalogForge
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="mx-auto">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
            </Link>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-3 p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Supplier Banner */}
        {isSupplier && !collapsed && (
          <div className="mx-3 mt-3 px-2.5 py-2 rounded-lg bg-amber-500/8 border border-amber-500/20 text-amber-400 text-xs">
            <div className="font-medium flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              Supplier Portal
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((i) => i.group === group.key);
            if (items.length === 0) return null;
            return (
              <div key={group.key}>
                {!collapsed && (
                  <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                    {group.label}
                  </div>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        title={collapsed ? item.name : undefined}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                          isActive
                            ? "bg-indigo-500/12 text-indigo-400"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                        } ${collapsed ? "justify-center px-0" : ""}`}
                      >
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? "text-indigo-400" : ""
                          }`}
                        />
                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom status */}
        {!collapsed && (
          <div className="p-3 border-t border-zinc-800/60">
            <div className="flex items-center gap-2 px-1 text-xs text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span>AI Engine Online</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-5 border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search products, SKUs, suppliers..."
                className="w-full pl-9 pr-12 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:bg-zinc-900/80 transition-colors"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-2 rounded-lg transition-colors ${
                chatOpen
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
              }`}
              title="AI Assistant"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </button>

            <div className="w-px h-6 bg-zinc-800 mx-1" />

            <PersonaSwitcher />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#09090b]">
          <div className="p-6 animate-fadeIn">{children}</div>
        </main>
      </div>

      {/* AI Chat Panel */}
      {chatOpen && <AIChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  );
}
