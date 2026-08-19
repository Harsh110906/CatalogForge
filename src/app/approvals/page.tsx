"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckSquare, Sparkles, CheckCircle2, Sliders, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function ApprovalsPage() {
  const { currentUser, canApprove } = useAuth();
  const [threshold, setThreshold] = useState(88.0);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    const res = await fetch(`/api/approval-queue?threshold=${threshold}`);
    const json = await res.json();
    if (json.success) setData(json);
    setLoading(false);
  };

  useEffect(() => { fetchQueue(); }, [threshold]);

  const handleAction = async (action: string, productIds?: string[], fieldIds?: string[]) => {
    setActionLoading(true);
    await fetch("/api/approval-queue/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, productIds, fieldIds, approvedBy: currentUser.name }) });
    await fetchQueue();
    setActionLoading(false);
  };

  if (loading || !data) return <div className="flex items-center justify-center h-96 text-zinc-500"><RefreshCw className="w-5 h-5 animate-spin text-indigo-400 mr-2" />Loading...</div>;

  const { reviewProducts, lowConfidenceFields } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Approval Queue</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Review AI-enriched fields below the confidence threshold</p>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 gap-4">
              <span>Confidence Threshold</span>
              <span className="font-mono text-indigo-400 font-medium">{threshold.toFixed(0)}%</span>
            </div>
            <input type="range" min="70" max="98" step="1" value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-32 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-1" />
          </div>
        </div>
      </div>

      {/* Review Products */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">Products Awaiting Review ({reviewProducts.length})</h2>
          {canApprove && reviewProducts.length > 0 && (
            <button onClick={() => handleAction("approve", reviewProducts.map((p: any) => p.id))} disabled={actionLoading}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white">
              Approve All
            </button>
          )}
        </div>

        {reviewProducts.length === 0 ? (
          <div className="py-8 text-center"><CheckCircle2 className="w-6 h-6 text-emerald-500/40 mx-auto mb-2" /><p className="text-sm text-zinc-500">All products approved</p></div>
        ) : (
          <div className="space-y-2">
            {reviewProducts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <Link href={`/products/${p.id}`} className="font-mono text-indigo-400 hover:underline text-xs">{p.sku}</Link>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">REVIEW</span>
                    <span className="text-zinc-400 text-xs truncate max-w-sm">{p.title}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction("approve", [p.id])} disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white">Approve</button>
                  <Link href={`/products/${p.id}`} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 border border-zinc-700/60">Inspect</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low Confidence Fields */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            AI Fields Below {threshold.toFixed(0)}% Confidence ({lowConfidenceFields.length})
          </h2>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-800/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="p-3">SKU</th>
                <th className="p-3">Field</th>
                <th className="p-3">AI Value</th>
                <th className="p-3">Confidence</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {lowConfidenceFields.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No fields below threshold</td></tr>
              ) : lowConfidenceFields.map((f: any) => (
                <tr key={f.id} className="hover:bg-zinc-800/20">
                  <td className="p-3 font-mono text-xs text-zinc-400">{f.product?.sku}</td>
                  <td className="p-3 text-indigo-400 font-mono text-xs">{f.fieldName}</td>
                  <td className="p-3 text-zinc-300 text-sm">{f.value}</td>
                  <td className="p-3"><span className="text-[11px] font-medium px-2 py-1 rounded bg-amber-500/10 text-amber-400 font-mono">{f.confidenceScore.toFixed(0)}%</span></td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleAction("approve", undefined, [f.id])} disabled={actionLoading}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs text-white">Accept</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
