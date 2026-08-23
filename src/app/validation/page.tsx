"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, RefreshCw, GitCompare, Wrench } from "lucide-react";

export default function ValidationPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [benchmarkDiff, setBenchmarkDiff] = useState<any>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      const res = await fetch(`/api/validation/issues?${params.toString()}`);
      const json = await res.json();
      if (json.success) setIssues(json.issues || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const res = await fetch("/api/products?limit=100");
    const json = await res.json();
    if (json.success) {
      setProducts(json.products || []);
      const nonBench = json.products.find((p: any) => !p.isBenchmark);
      if (nonBench && !selectedTargetId) setSelectedTargetId(nonBench.id);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchProducts();
  }, [severityFilter, typeFilter]);

  const handleResolve = async (issueId: string) => {
    setResolvingId(issueId);
    await fetch("/api/validation/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId, applyFix: true }),
    });
    await fetchIssues();
    setResolvingId(null);
  };

  const handleBenchmarkDiff = async () => {
    if (!selectedTargetId) return;
    setDiffLoading(true);
    const res = await fetch(`/api/products/${selectedTargetId}/validate`, { method: "POST" });
    const json = await res.json();
    if (json.success && json.benchmarkDiff) setBenchmarkDiff(json.benchmarkDiff);
    setDiffLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Validation Engine</h1>
          <p className="text-sm text-slate-500 mt-1">Cross-field engineering checks and category benchmark diffing</p>
        </div>
        <button
          onClick={fetchIssues}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Re-Run Rules
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0052ff] transition-all"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="ERROR">Error</option>
            <option value="WARNING">Warning</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0052ff] transition-all"
          >
            <option value="ALL">All Types</option>
            <option value="MISSING">Missing Fields</option>
            <option value="CROSS_FIELD">Cross-Field</option>
            <option value="ANOMALY">Anomaly</option>
            <option value="MISMATCH">Mismatch</option>
          </select>
        </div>
        <span className="text-xs font-bold text-slate-500">{issues.length} issue(s) detected</span>
      </div>

      {/* Issue List Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0052ff]" />
            Running validation engine...
          </div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-900">No validation issues found</p>
            <p className="text-xs text-slate-500">All cross-field engineering checks are passing cleanly.</p>
          </div>
        ) : (
          issues.map((iss) => (
            <div
              key={iss.id}
              className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/products/${iss.productId}`} className="font-mono text-xs font-bold text-[#0052ff] hover:underline">
                    {iss.product?.sku}
                  </Link>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      iss.severity === "CRITICAL"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : iss.severity === "ERROR"
                        ? "bg-orange-50 text-orange-700 border border-orange-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {iss.severity}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-semibold">{iss.type}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">{iss.message}</p>
                {iss.suggestedFix && (
                  <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[#0052ff]" /> Suggested Fix: {iss.suggestedFix}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleResolve(iss.id)}
                  disabled={resolvingId === iss.id}
                  className="px-5 py-2 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  Auto-Fix
                </button>
                <Link
                  href={`/products/${iss.productId}`}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all"
                >
                  Inspect
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Golden Benchmark Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-amber-500" /> Golden Benchmark Explorer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Compare any product against its category benchmark standard</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0052ff] flex-1 sm:flex-none max-w-xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.title.slice(0, 35)}...
                </option>
              ))}
            </select>
            <button
              onClick={handleBenchmarkDiff}
              disabled={diffLoading}
              className="px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {diffLoading ? "Computing..." : "Run Diff"}
            </button>
          </div>
        </div>

        {benchmarkDiff && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 animate-fadeInUp space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Category</span>
                <div className="text-slate-900 mt-0.5">{benchmarkDiff.category}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Benchmark</span>
                <div className="text-amber-600 font-mono mt-0.5">{benchmarkDiff.benchmarkSku}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Missing</span>
                <div className="text-rose-600 font-mono mt-0.5">{benchmarkDiff.missingCount} fields</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Matching</span>
                <div className="text-emerald-600 font-mono mt-0.5">{benchmarkDiff.matchingCount} fields</div>
              </div>
            </div>

            {benchmarkDiff.missingAttributes?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {benchmarkDiff.missingAttributes.map((g: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex justify-between">
                    <span className="font-mono font-bold text-slate-900">{g.field}</span>
                    <span className="text-slate-500">Benchmark: <strong className="text-slate-900">{g.benchmarkValue}</strong></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
