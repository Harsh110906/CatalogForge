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

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          </div>
          <p className="text-sm text-zinc-500">Loading workspace metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center max-w-sm">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Unable to load metrics</h3>
          <p className="text-xs text-zinc-500">{error || "Could not retrieve catalog statistics."}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">
            {getGreeting()}, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Your catalog has{" "}
            <span className="text-zinc-300 font-medium">{metrics.totalSkus} products</span> across 6
            categories.{" "}
            {metrics.unresolvedIssuesCount > 0 ? (
              <span className="text-amber-400">{metrics.unresolvedIssuesCount} issues need attention.</span>
            ) : (
              <span className="text-emerald-400">All checks passing.</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/report"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-sm font-medium text-zinc-300 border border-zinc-700/60 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Executive Report
          </a>
          <Link
            href="/ingestion"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-sm font-medium text-zinc-300 border border-zinc-700/60 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </Link>
          <Link
            href="/compliance"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Bot className="w-4 h-4" />
            Compliance Center
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 stagger-children">
        {/* Total SKUs */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 card-hover">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Products</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <Boxes className="w-3.5 h-3.5 text-indigo-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
            {metrics.totalSkus}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
            <span>
              <span className="text-emerald-400 font-medium">{statusDistribution.published}</span> published
            </span>
            <span>
              <span className="text-zinc-400 font-medium">{statusDistribution.approved}</span> approved
            </span>
          </div>
        </div>

        {/* Completeness */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 card-hover">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Completeness</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono tracking-tight">
            {formatPercent(metrics.avgCompletenessScore)}
          </div>
          <div className="mt-3 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${metrics.avgCompletenessScore}%` }}
            />
          </div>
        </div>

        {/* Agent Visibility */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 card-hover">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">AI Visibility</span>
            <div className="p-1.5 rounded-lg bg-violet-500/10">
              <Bot className="w-3.5 h-3.5 text-violet-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-violet-400 font-mono tracking-tight">
            {formatPercent(metrics.avgAgentVisibilityScore)}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
            <span>
              ACP <span className="text-zinc-400 font-medium">{formatPercent(metrics.avgAcpFillRate)}</span>
            </span>
            <span>
              UCP <span className="text-zinc-400 font-medium">{formatPercent(metrics.avgUcpFillRate)}</span>
            </span>
          </div>
        </div>

        {/* Issues */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 card-hover">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Open Issues</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
            {metrics.unresolvedIssuesCount}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
            <span>
              <span className="text-red-400 font-medium">{issuesBySeverity.CRITICAL}</span> critical
            </span>
            <span>
              <span className="text-amber-400 font-medium">{issuesBySeverity.WARNING}</span> warnings
            </span>
          </div>
        </div>
      </div>

      {/* Agent Visibility Tier Bar */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">2026 Agent Commerce Readiness</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Distribution across ACP & UCP visibility tiers
            </p>
          </div>
          <Link
            href="/compliance"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Segmented bar */}
        <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
          {trustedPct > 0 && (
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${trustedPct}%` }}
              title={`Trusted: ${visibilityTiers.trusted}`}
            />
          )}
          {penalizedPct > 0 && (
            <div
              className="h-full bg-amber-500 transition-all duration-700"
              style={{ width: `${penalizedPct}%` }}
              title={`Penalized: ${visibilityTiers.penalized}`}
            />
          )}
          {invisiblePct > 0 && (
            <div
              className="h-full bg-red-500 transition-all duration-700"
              style={{ width: `${invisiblePct}%` }}
              title={`Invisible: ${visibilityTiers.invisible}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-400">
              Trusted <span className="font-medium text-zinc-200">{visibilityTiers.trusted}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-zinc-400">
              Penalized <span className="font-medium text-zinc-200">{visibilityTiers.penalized}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs text-zinc-400">
              Invisible <span className="font-medium text-zinc-200">{visibilityTiers.invisible}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Two Column: Issues + Suppliers */}
      <div className="grid grid-cols-12 gap-5">
        {/* Issues */}
        <div className="col-span-7 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Priority Issues</h2>
            <Link
              href="/validation"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-2">
            {recentIssues && recentIssues.length > 0 ? (
              recentIssues.slice(0, 5).map((iss: any) => (
                <Link
                  key={iss.id}
                  href={`/products/${iss.productId}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                >
                  <div
                    className={`w-1 h-full min-h-[40px] rounded-full flex-shrink-0 ${
                      iss.severity === "CRITICAL"
                        ? "bg-red-500"
                        : iss.severity === "ERROR"
                        ? "bg-orange-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-400">{iss.product.sku}</span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          iss.severity === "CRITICAL"
                            ? "bg-red-500/10 text-red-400"
                            : iss.severity === "ERROR"
                            ? "bg-orange-500/10 text-orange-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {iss.severity}
                      </span>
                    </div>
                    <p className="text-[13px] text-zinc-300 mt-0.5 line-clamp-1">{iss.message}</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-1" />
                </Link>
              ))
            ) : (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No open issues. Catalog is clean!</p>
              </div>
            )}
          </div>
        </div>

        {/* Suppliers */}
        <div className="col-span-5 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Supplier Quality</h2>
            <Link
              href="/suppliers"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {supplierLeaderboard.map((s: any, idx: number) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-600 w-4">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-zinc-300 truncate">{s.name}</span>
                    <span className="text-xs font-mono text-zinc-400">{s.qualityScore.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${
                        s.qualityScore >= 90
                          ? "bg-emerald-500"
                          : s.qualityScore >= 75
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${s.qualityScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Link
          href="/products"
          className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all group"
        >
          <Boxes className="w-5 h-5 text-indigo-400 mb-3" />
          <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
            Browse Catalog
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Search, filter, and manage all {metrics.totalSkus} products
          </p>
        </Link>
        <Link
          href="/feeds"
          className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all group"
        >
          <Zap className="w-5 h-5 text-violet-400 mb-3" />
          <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
            Push Commerce Feeds
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Export ACP & UCP feeds to agent registries
          </p>
        </Link>
        <Link
          href="/settings"
          className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all group"
        >
          <Sparkles className="w-5 h-5 text-amber-400 mb-3" />
          <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
            MCP & Schema.org Tools
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            JSON-RPC endpoint tester and structured data diff
          </p>
        </Link>
      </div>
    </div>
  );
}
