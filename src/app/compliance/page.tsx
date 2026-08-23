"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bot, ShieldCheck, Sparkles, Download, Send, RefreshCw, Check, ArrowRight, AlertTriangle } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/feeds");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "Failed to load feeds data");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  const handlePushFeed = async (feedId: string) => {
    try {
      setPushingFeedId(feedId);
      setPushResult(null);
      const res = await fetch(`/api/feeds/${feedId}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggeredBy: currentUser.name }),
      });
      setPushResult(await res.json());
      await fetchFeeds();
    } catch (e: any) {
      console.error(e);
    } finally {
      setPushingFeedId(null);
    }
  };

  const handleAutofillAll = async () => {
    try {
      setAutofillingAll(true);
      setFeedback(null);
      const prodRes = await fetch("/api/products?limit=100");
      const prodJson = await prodRes.json();
      if (prodJson.success && Array.isArray(prodJson.products)) {
        const ids = prodJson.products.map((p: any) => p.id);
        const res = await fetch("/api/products/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "autofill_compliance",
            productIds: ids,
            requestedBy: currentUser.name,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setFeedback(`Auto-filled commerce metadata across ${json.updatedCount} products.`);
          await fetchFeeds();
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setAutofillingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-[#0052ff] mr-2" />
        <span>Loading compliance data...</span>
      </div>
    );
  }

  if (error || !data || !data.feeds) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-white border border-slate-200 text-center max-w-sm shadow-xl">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">Unable to load compliance data</h3>
          <p className="text-xs text-slate-500">{error || "Could not retrieve feed scorecards."}</p>
          <button
            onClick={fetchFeeds}
            className="mt-2 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const feeds = data.feeds || [];
  const stats = data.stats || {};
  const acpFeed = feeds.find((f: any) => f.protocol === "ACP") || feeds[0];
  const ucpFeed = feeds.find((f: any) => f.protocol === "UCP") || feeds[1];

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Compliance Center</h1>
          <p className="text-sm text-slate-500 mt-1">2026 Agentic Commerce Protocol readiness — OpenAI/Stripe ACP & Google UCP</p>
        </div>
        <button
          onClick={handleAutofillAll}
          disabled={autofillingAll}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${autofillingAll ? "animate-spin" : ""}`} />
          {autofillingAll ? "Auto-Filling..." : "AI Auto-Fill All"}
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center justify-between animate-fadeInUp">
          <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" />{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Push Result Alert */}
      {pushResult?.success && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0052ff] animate-fadeInUp">
          Feed pushed successfully! Job #{pushResult.job?.id?.slice(-8)} — HTTP {pushResult.job?.httpStatus}
        </div>
      )}

      {/* Protocol Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ACP Card */}
        {acpFeed && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0052ff] flex items-center justify-center text-xl font-bold">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">OpenAI / Stripe ACP</h2>
                  <p className="text-xs text-slate-500 font-medium">Agentic Commerce Protocol</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono text-[#0052ff]">{formatPercent(acpFeed.fillRatePercent)}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Fill Rate</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase">SKUs in Feed</span>
                <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">{acpFeed.itemsCount}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Last Push</span>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">
                  {acpFeed.lastPushedAt ? new Date(acpFeed.lastPushedAt).toLocaleDateString() : "Never"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handlePushFeed(acpFeed.id)}
                disabled={pushingFeedId === acpFeed.id}
                className="flex-1 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pushingFeedId === acpFeed.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Push to ACP</span>
              </button>
              <a
                href={`/api/feeds/${acpFeed.id}/download`}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all"
              >
                Download JSON
              </a>
            </div>
          </div>
        )}

        {/* UCP Card */}
        {ucpFeed && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Google UCP</h2>
                  <p className="text-xs text-slate-500 font-medium">Universal Commerce Protocol</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono text-emerald-600">{formatPercent(ucpFeed.fillRatePercent)}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Fill Rate</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase">SKUs in Feed</span>
                <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">{ucpFeed.itemsCount}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Last Push</span>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">
                  {ucpFeed.lastPushedAt ? new Date(ucpFeed.lastPushedAt).toLocaleDateString() : "Never"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handlePushFeed(ucpFeed.id)}
                disabled={pushingFeedId === ucpFeed.id}
                className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pushingFeedId === ucpFeed.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Push to UCP</span>
              </button>
              <a
                href={`/api/feeds/${ucpFeed.id}/download`}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all"
              >
                Download JSON
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
