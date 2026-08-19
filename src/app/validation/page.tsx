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
    } catch (e) { console.error(e); } finally { setLoading(false); }
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

  useEffect(() => { fetchIssues(); fetchProducts(); }, [severityFilter, typeFilter]);

  const handleResolve = async (issueId: string) => {
    setResolvingId(issueId);
    await fetch("/api/validation/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ issueId, applyFix: true }) });
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

  const severityColor = (s: string) => {
    if (s === "CRITICAL") return "bg-red-500";
    if (s === "ERROR") return "bg-orange-500";
    return "bg-amber-500";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Validation</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Cross-field engineering checks and category benchmark diffing</p>
        </div>
        <button onClick={fetchIssues} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-sm text-zinc-300 border border-zinc-700/60 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Re-Run Rules
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600">
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="ERROR">Error</option>
          <option value="WARNING">Warning</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600">
          <option value="ALL">All Types</option>
          <option value="MISSING">Missing Fields</option>
          <option value="CROSS_FIELD">Cross-Field</option>
          <option value="ANOMALY">Anomaly</option>
          <option value="MISMATCH">Mismatch</option>
        </select>
        <span className="text-sm text-zinc-500 ml-auto">{issues.length} issues</span>
      </div>

      {/* Issue List */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-12 text-center text-zinc-500"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />Running validation...</div>
        ) : issues.length === 0 ? (
          <div className="py-12 text-center"><CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" /><p className="text-sm text-zinc-500">No validation issues found. All checks passing!</p></div>
        ) : (
          issues.map((iss) => (
            <div key={iss.id} className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/60 transition-colors">
              <div className={`w-1 min-h-[48px] rounded-full flex-shrink-0 ${severityColor(iss.severity)}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/products/${iss.productId}`} className="font-mono text-xs text-indigo-400 hover:underline">{iss.product?.sku}</Link>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${iss.severity === "CRITICAL" ? "bg-red-500/10 text-red-400" : iss.severity === "ERROR" ? "bg-orange-500/10 text-orange-400" : "bg-amber-500/10 text-amber-400"}`}>{iss.severity}</span>
                  <span className="text-[10px] text-zinc-600 font-mono">{iss.type}</span>
                </div>
                <p className="text-sm text-zinc-300">{iss.message}</p>
                {iss.suggestedFix && (
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1"><Wrench className="w-3 h-3 text-indigo-400" />{iss.suggestedFix}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleResolve(iss.id)} disabled={resolvingId === iss.id}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white disabled:opacity-50">
                  Auto-Fix
                </button>
                <Link href={`/products/${iss.productId}`} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 border border-zinc-700/60">
                  Inspect
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Golden Benchmark */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2"><GitCompare className="w-4 h-4 text-amber-400" />Golden Benchmark Explorer</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Compare any product against its category benchmark standard</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedTargetId} onChange={(e) => setSelectedTargetId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 max-w-xs">
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.title.slice(0, 35)}...</option>)}
            </select>
            <button onClick={handleBenchmarkDiff} disabled={diffLoading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white disabled:opacity-50 transition-colors">
              {diffLoading ? "Computing..." : "Run Diff"}
            </button>
          </div>
        </div>

        {benchmarkDiff && (
          <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/40 animate-fadeInUp space-y-3">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div><span className="text-zinc-500 text-xs">Category</span><div className="text-zinc-200 font-medium mt-0.5">{benchmarkDiff.category}</div></div>
              <div><span className="text-zinc-500 text-xs">Benchmark</span><div className="text-amber-400 font-mono mt-0.5">{benchmarkDiff.benchmarkSku}</div></div>
              <div><span className="text-zinc-500 text-xs">Missing</span><div className="text-red-400 font-mono mt-0.5">{benchmarkDiff.missingCount} fields</div></div>
              <div><span className="text-zinc-500 text-xs">Matching</span><div className="text-emerald-400 font-mono mt-0.5">{benchmarkDiff.matchingCount} fields</div></div>
            </div>
            {benchmarkDiff.missingAttributes?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {benchmarkDiff.missingAttributes.map((g: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/15 text-xs flex justify-between">
                    <span className="font-mono text-zinc-300">{g.field}</span>
                    <span className="text-zinc-500">Benchmark: <strong className="text-zinc-300">{g.benchmarkValue}</strong></span>
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
