"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bot, ShieldCheck, Sparkles, Download, Send, RefreshCw, Check, ArrowRight } from "lucide-react";
import { formatPercent } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function CompliancePage() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pushingFeedId, setPushingFeedId] = useState<string | null>(null);
  const [pushResult, setPushResult] = useState<any>(null);
  const [autofillingAll, setAutofillingAll] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchFeeds = async () => {
    setLoading(true);
    const res = await fetch("/api/feeds");
    const json = await res.json();
    if (json.success) setData(json);
    setLoading(false);
  };

  useEffect(() => { fetchFeeds(); }, []);

  const handlePushFeed = async (feedId: string) => {
    setPushingFeedId(feedId); setPushResult(null);
    const res = await fetch(`/api/feeds/${feedId}/push`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ triggeredBy: currentUser.name }) });
    setPushResult(await res.json());
    await fetchFeeds();
    setPushingFeedId(null);
  };

  const handleAutofillAll = async () => {
    setAutofillingAll(true); setFeedback(null);
    const prodRes = await fetch("/api/products?limit=100");
    const prodJson = await prodRes.json();
    if (prodJson.success) {
      const ids = prodJson.products.map((p: any) => p.id);
      const res = await fetch("/api/products/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "autofill_compliance", productIds: ids, requestedBy: currentUser.name }) });
      const json = await res.json();
      if (json.success) { setFeedback(`Auto-filled commerce metadata across ${json.updatedCount} products.`); await fetchFeeds(); }
    }
    setAutofillingAll(false);
  };

  if (loading || !data) return <div className="flex items-center justify-center h-96 text-zinc-500"><RefreshCw className="w-5 h-5 animate-spin text-indigo-400 mr-2" />Loading compliance data...</div>;

  const { feeds, stats } = data;
  const acpFeed = feeds.find((f: any) => f.protocol === "ACP") || feeds[0];
  const ucpFeed = feeds.find((f: any) => f.protocol === "UCP") || feeds[1];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Compliance Center</h1>
          <p className="text-sm text-zinc-500 mt-0.5">2026 Agentic Commerce Protocol readiness — OpenAI/Stripe ACP & Google UCP</p>
        </div>
        <button onClick={handleAutofillAll} disabled={autofillingAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50">
          <Sparkles className={`w-4 h-4 ${autofillingAll ? "animate-spin" : ""}`} />
          {autofillingAll ? "Auto-Filling..." : "AI Auto-Fill All"}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300 flex items-center justify-between animate-fadeInUp">
          <span className="flex items-center gap-2"><Check className="w-4 h-4" />{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>
      )}

      {/* Push Result */}
      {pushResult?.success && (
        <div className="px-4 py-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300 animate-fadeInUp">
          Feed pushed successfully! Job #{pushResult.job?.id?.slice(-8)} — HTTP {pushResult.job?.httpStatus}
        </div>
      )}

      {/* Protocol Cards */}
      <div className="grid grid-cols-2 gap-5">
        {/* ACP */}
        {acpFeed && (
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50 card-hover space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-500/10"><Bot className="w-6 h-6 text-indigo-400" /></div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-200">OpenAI / Stripe ACP</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Agentic Commerce Protocol</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-indigo-400">{formatPercent(acpFeed.fillRatePercent)}</div>
                <div className="text-[10px] text-zinc-500">Fill Rate</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-zinc-800/40">
                <span className="text-xs text-zinc-500">SKUs in Feed</span>
                <div className="text-lg font-bold font-mono text-zinc-200 mt-0.5">{acpFeed.itemsCount}</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/40">
                <span className="text-xs text-zinc-500">Last Push</span>
                <div className="text-sm font-medium text-zinc-300 mt-0.5">{acpFeed.lastPushedAt ? new Date(acpFeed.lastPushedAt).toLocaleDateString() : "Never"}</div>
              </div>
            </div>

            <div className="text-xs text-zinc-500 space-y-1">
              <p className="font-medium text-zinc-400">Required Fields:</p>
              <p>item_id, gtin, title, description, price, availability, seller_name, return_policy</p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
              <a href={`/api/feeds/${acpFeed.id}/download?format=json`} download className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 border border-zinc-700/60 flex items-center gap-1.5"><Download className="w-3 h-3" /> Export JSON</a>
              <button onClick={() => handlePushFeed(acpFeed.id)} disabled={pushingFeedId === acpFeed.id}
                className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50">
                <Send className={`w-3 h-3 ${pushingFeedId === acpFeed.id ? "animate-spin" : ""}`} /> Push to ACP Registry
              </button>
            </div>
          </div>
        )}

        {/* UCP */}
        {ucpFeed && (
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50 card-hover space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10"><ShieldCheck className="w-6 h-6 text-emerald-400" /></div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-200">Google UCP</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Universal Commerce Protocol</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-emerald-400">{formatPercent(ucpFeed.fillRatePercent)}</div>
                <div className="text-[10px] text-zinc-500">Fill Rate</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-zinc-800/40">
                <span className="text-xs text-zinc-500">SKUs in Feed</span>
                <div className="text-lg font-bold font-mono text-zinc-200 mt-0.5">{ucpFeed.itemsCount}</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/40">
                <span className="text-xs text-zinc-500">Last Push</span>
                <div className="text-sm font-medium text-zinc-300 mt-0.5">{ucpFeed.lastPushedAt ? new Date(ucpFeed.lastPushedAt).toLocaleDateString() : "Never"}</div>
              </div>
            </div>

            <div className="text-xs text-zinc-500 space-y-1">
              <p className="font-medium text-zinc-400">Required Fields:</p>
              <p>id, gtin, title, description, price, shipping_weight, shipping_dimensions, tax_category</p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
              <a href={`/api/feeds/${ucpFeed.id}/download?format=json`} download className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 border border-zinc-700/60 flex items-center gap-1.5"><Download className="w-3 h-3" /> Export JSON</a>
              <button onClick={() => handlePushFeed(ucpFeed.id)} disabled={pushingFeedId === ucpFeed.id}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50">
                <Send className={`w-3 h-3 ${pushingFeedId === ucpFeed.id ? "animate-spin" : ""}`} /> Push to UCP Registry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Visibility Distribution */}
      {stats && (
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-200">Catalog Visibility Distribution</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <div className="text-2xl font-bold font-mono text-emerald-400">{stats.trusted || 0}</div>
              <div className="text-xs text-zinc-500 mt-1">Trusted (&gt;95%) — full agent autonomy</div>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/15">
              <div className="text-2xl font-bold font-mono text-amber-400">{stats.penalized || 0}</div>
              <div className="text-xs text-zinc-500 mt-1">Penalized (80-95%) — deprioritized</div>
            </div>
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/15">
              <div className="text-2xl font-bold font-mono text-red-400">{stats.invisible || 0}</div>
              <div className="text-xs text-zinc-500 mt-1">Invisible (&lt;80%) — agent bypass</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
