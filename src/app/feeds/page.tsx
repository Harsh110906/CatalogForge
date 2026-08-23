"use client";

import React, { useState, useEffect } from "react";
import { Rss, Bot, ShieldCheck, Send, Download, RefreshCw } from "lucide-react";
import { formatPercent } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function FeedsPage() {
  const { currentUser } = useAuth();
  const [feeds, setFeeds] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [fRes, jRes] = await Promise.all([fetch("/api/feeds"), fetch("/api/feeds/jobs")]);
    const fJson = await fRes.json();
    const jJson = await jRes.json();
    if (fJson.success) setFeeds(fJson.feeds || []);
    if (jJson.success) setJobs(jJson.jobs || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handlePush = async (feedId: string) => {
    setPushingId(feedId);
    const res = await fetch(`/api/feeds/${feedId}/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggeredBy: currentUser.name }),
    });
    const json = await res.json();
    await fetchAll();
    if (json.job) setSelectedJob(json.job);
    setPushingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Feeds & Delivery</h1>
          <p className="text-sm text-slate-500 mt-1">Export and push catalogs to ACP & UCP agent registries</p>
        </div>
      </div>

      {/* Feed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {feeds.map((feed) => {
          const isAcp = feed.protocol === "ACP";
          return (
            <div key={feed.id} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isAcp ? "bg-blue-50 text-[#0052ff]" : "bg-emerald-50 text-emerald-600"}`}>
                    {isAcp ? <Bot className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{feed.name}</h3>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Protocol: <span className="text-slate-900 font-bold">{feed.protocol}</span> · {feed.itemsCount} SKUs
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold font-mono text-[#0052ff]">{formatPercent(feed.fillRatePercent)}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Fill Rate</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  Last pushed: <span className="text-slate-800 font-semibold">{feed.lastPushedAt ? new Date(feed.lastPushedAt).toLocaleDateString() : "Never"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/feeds/${feed.id}/download?format=json`}
                    download
                    className="px-4 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> JSON
                  </a>
                  <button
                    onClick={() => handlePush(feed.id)}
                    disabled={pushingId === feed.id}
                    className="px-4 py-1.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${pushingId === feed.id ? "animate-spin" : ""}`} /> Push
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery History Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Delivery History</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Job ID</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">HTTP Code</th>
                <th className="p-3.5">Triggered By</th>
                <th className="p-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No recent feed delivery jobs recorded.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-mono font-bold text-slate-900">#{job.id.slice(-8)}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${job.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">{job.httpStatus || 200}</td>
                    <td className="p-3.5 text-slate-700">{job.triggeredBy}</td>
                    <td className="p-3.5 text-slate-500 font-mono">{new Date(job.startedAt).toLocaleString()}</td>
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
