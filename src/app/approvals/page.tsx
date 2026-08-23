"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckSquare, Sparkles, CheckCircle2, Sliders, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function ApprovalsPage() {
  const { currentUser, canApprove } = useAuth();
  const [threshold, setThreshold] = useState(88.0);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/approval-queue?threshold=${threshold}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "Failed to load approval queue");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [threshold]);

  const handleAction = async (action: string, productIds?: string[], fieldIds?: string[]) => {
    setActionLoading(true);
    await fetch("/api/approval-queue/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, productIds, fieldIds, approvedBy: currentUser.name }),
    });
    await fetchQueue();
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-[#0052ff] mr-2" />
        <span>Loading approval queue...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-white border border-slate-200 text-center max-w-sm shadow-xl">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">Unable to load approval queue</h3>
          <p className="text-xs text-slate-500">{error || "Could not retrieve pending reviews."}</p>
          <button
            onClick={fetchQueue}
            className="mt-2 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const reviewProducts = data.reviewProducts || [];
  const lowConfidenceFields = data.lowConfidenceFields || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Approval Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Review AI-enriched fields below the confidence threshold</p>
        </div>
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <Sliders className="w-4 h-4 text-[#0052ff]" />
          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold gap-4">
              <span>Confidence Threshold</span>
              <span className="font-mono text-[#0052ff] font-extrabold">{threshold.toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="70"
              max="98"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0052ff] mt-1"
            />
          </div>
        </div>
      </div>

      {/* Review Products Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Products Awaiting Review ({reviewProducts.length})</h2>
          {canApprove && reviewProducts.length > 0 && (
            <button
              onClick={() => handleAction("approve", reviewProducts.map((p: any) => p.id))}
              disabled={actionLoading}
              className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              Approve All
            </button>
          )}
        </div>

        {reviewProducts.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-slate-900">All products approved</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewProducts.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <Link href={`/products/${p.id}`} className="font-mono font-bold text-[#0052ff] hover:underline">
                      {p.sku}
                    </Link>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      REVIEW
                    </span>
                    <span className="text-slate-800 font-semibold truncate max-w-sm">{p.title}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction("approve", [p.id])}
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-all shadow-xs"
                  >
                    Approve
                  </button>
                  <Link
                    href={`/products/${p.id}`}
                    className="px-4 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700 transition-all"
                  >
                    Inspect
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low Confidence Fields Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0052ff]" />
            AI Fields Below {threshold.toFixed(0)}% Confidence ({lowConfidenceFields.length})
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Field</th>
                <th className="p-3.5">AI Value</th>
                <th className="p-3.5">Confidence</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {lowConfidenceFields.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No fields below threshold.
                  </td>
                </tr>
              ) : (
                lowConfidenceFields.map((f: any) => (
                  <tr key={f.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{f.product?.sku}</td>
                    <td className="p-3.5 text-[#0052ff] font-mono font-bold">{f.fieldName}</td>
                    <td className="p-3.5 text-slate-800">{f.value}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                        {f.confidenceScore.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleAction("approve", undefined, [f.id])}
                        disabled={actionLoading}
                        className="px-4 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-all shadow-xs"
                      >
                        Accept
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
