"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  AlertTriangle,
  Bot,
  ArrowUpRight,
  TrendingUp,
  Building2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  FileSpreadsheet,
  ShieldCheck,
  Upload,
  Zap,
  ArrowRight,
} from "lucide-react";
import { formatPercent } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { PublicLandingPage } from "@/components/landing/PublicLandingPage";

export default function DashboardPage() {
  const { currentUser, isAuthenticated } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <PublicLandingPage />;
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "Failed to load metrics");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Network connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-[#0052ff]" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading workspace metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center max-w-sm">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">Unable to load metrics</h3>
          <p className="text-xs text-slate-500">{error || "Could not retrieve catalog statistics."}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const { metrics, visibilityTiers, statusDistribution, issuesBySeverity, supplierLeaderboard, recentIssues } = data;
  const totalVisibility = (visibilityTiers.trusted || 0) + (visibilityTiers.penalized || 0) + (visibilityTiers.invisible || 0);
  const trustedPct = totalVisibility > 0 ? ((visibilityTiers.trusted / totalVisibility) * 100) : 0;
  const penalizedPct = totalVisibility > 0 ? ((visibilityTiers.penalized / totalVisibility) * 100) : 0;
  const invisiblePct = totalVisibility > 0 ? ((visibilityTiers.invisible / totalVisibility) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">
            Your catalog has{" "}
            <span className="text-slate-900 font-semibold">{metrics.totalSkus} products</span> across 6
            categories.{" "}
            {metrics.unresolvedIssuesCount > 0 ? (
              <span className="text-amber-600 font-semibold">{metrics.unresolvedIssuesCount} issues need attention.</span>
            ) : (
              <span className="text-emerald-600 font-semibold">All checks passing cleanly.</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/export/report"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Executive Report
          </a>
          <Link
            href="/ingestion"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Import Data
          </Link>
          <Link
            href="/compliance"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Bot className="w-3.5 h-3.5 text-white" />
            Compliance Center
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total SKUs */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Products</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Boxes className="w-4 h-4 text-[#0052ff]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {metrics.totalSkus}
          </div>
          <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>
              <span className="text-emerald-600 font-bold">{statusDistribution.published}</span> published
            </span>
            <span>
              <span className="text-slate-700 font-bold">{statusDistribution.approved}</span> approved
            </span>
          </div>
        </div>

        {/* Completeness */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completeness</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">
            {formatPercent(metrics.avgCompletenessScore)}
          </div>
          <div className="mt-3.5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${metrics.avgCompletenessScore}%` }}
            />
          </div>
        </div>

        {/* Agent Visibility */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Visibility</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#0052ff]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0052ff] font-mono tracking-tight">
            {formatPercent(metrics.avgAgentVisibilityScore)}
          </div>
          <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>ACP: <span className="text-slate-900 font-bold">{formatPercent(metrics.avgAcpFillRate)}</span></span>
            <span>UCP: <span className="text-slate-900 font-bold">{formatPercent(metrics.avgUcpFillRate)}</span></span>
          </div>
        </div>

        {/* Unresolved Issues */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priority Issues</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
            {metrics.unresolvedIssuesCount}
          </div>
          <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="text-rose-600 font-bold">{issuesBySeverity.CRITICAL || 0} critical</span>
            <span className="text-amber-600 font-bold">{issuesBySeverity.WARNING || 0} warning</span>
          </div>
        </div>
      </div>

      {/* Visibility Breakdown */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm">2026 Agent Commerce Readiness</div>
          <Link href="/compliance" className="text-xs font-semibold text-[#0052ff] hover:underline flex items-center gap-1">
            Details <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
          <div className="bg-emerald-500 h-3" style={{ width: `${trustedPct}%` }} title={`Trusted: ${visibilityTiers.trusted}`} />
          <div className="bg-amber-400 h-3" style={{ width: `${penalizedPct}%` }} title={`Penalized: ${visibilityTiers.penalized}`} />
          <div className="bg-rose-500 h-3" style={{ width: `${invisiblePct}%` }} title={`Invisible: ${visibilityTiers.invisible}`} />
        </div>
        <div className="flex items-center gap-6 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Trusted ({visibilityTiers.trusted || 0})
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Penalized ({visibilityTiers.penalized || 0})
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Invisible ({visibilityTiers.invisible || 0})
          </span>
        </div>
      </div>

      {/* Main Grid: Issues & Supplier Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Issues List */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Priority Issues</h3>
            <Link href="/validation" className="text-xs font-semibold text-[#0052ff] hover:underline">
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {recentIssues.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No active validation issues</div>
            ) : (
              recentIssues.map((issue: any) => (
                <div
                  key={issue.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{issue.product?.sku}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          issue.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-700"
                            : issue.severity === "WARNING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-[#0052ff]"
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 font-medium">{issue.message}</p>
                  </div>
                  <Link
                    href={`/validation`}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors flex-shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Supplier Quality Leaderboard */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Supplier Quality</h3>
            <Link href="/suppliers" className="text-xs font-semibold text-[#0052ff] hover:underline">
              View all →
            </Link>
          </div>

          <div className="space-y-4">
            {supplierLeaderboard.map((sup: any, idx: number) => (
              <div key={sup.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 truncate max-w-[180px]">
                    {idx + 1}. {sup.name}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{sup.qualityScore}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      sup.qualityScore >= 85
                        ? "bg-emerald-500"
                        : sup.qualityScore >= 70
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${sup.qualityScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link
          href="/products"
          className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0052ff] flex items-center justify-center font-bold text-lg group-hover:bg-[#0052ff] group-hover:text-white transition-all">
            📦
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">Browse Catalog</div>
            <div className="text-xs text-slate-500 mt-1">Search, filter, and manage all {metrics.totalSkus} products</div>
          </div>
        </Link>

        <Link
          href="/feeds"
          className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
            ⚡
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">Push Commerce Feeds</div>
            <div className="text-xs text-slate-500 mt-1">Export ACP & UCP feeds to agent registries</div>
          </div>
        </Link>

        <Link
          href="/settings"
          className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-200 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
            🔌
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">MCP & Schema.org Tools</div>
            <div className="text-xs text-slate-500 mt-1">JSON-RPC endpoint tester and structured data diff</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
