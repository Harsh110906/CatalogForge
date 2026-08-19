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

  useEffect(() => { fetchAll(); }, []);

  const handlePush = async (feedId: string) => {
    setPushingId(feedId);
    const res = await fetch(`/api/feeds/${feedId}/push`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ triggeredBy: currentUser.name }) });
    const json = await res.json();
    await fetchAll();
    if (json.job) setSelectedJob(json.job);
    setPushingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Feeds & Delivery</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Export and push catalogs to ACP & UCP agent registries</p>
        </div>
      </div>

      {/* Feed Cards */}
      <div className="grid grid-cols-2 gap-4">
        {feeds.map((feed) => {
          const isAcp = feed.protocol === "ACP";
          return (
            <div key={feed.id} className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 card-hover space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${isAcp ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                    {isAcp ? <Bot className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200">{feed.name}</h3>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      Protocol: <span className="text-zinc-300 font-medium">{feed.protocol}</span> · {feed.itemsCount} SKUs
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-indigo-400">{formatPercent(feed.fillRatePercent)}</div>
                  <div className="text-[10px] text-zinc-500">Fill Rate</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-800/50 flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  Last pushed: <span className="text-zinc-400">{feed.lastPushedAt ? new Date(feed.lastPushedAt).toLocaleDateString() : "Never"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`/api/feeds/${feed.id}/download?format=json`} download className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 border border-zinc-700/60 flex items-center gap-1">
                    <Download className="w-3 h-3" /> JSON
                  </a>
                  <button onClick={() => handlePush(feed.id)} disabled={pushingId === feed.id}
                    className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center gap-1.5 disabled:opacity-50">
                    <Send className={`w-3 h-3 ${pushingId === feed.id ? "animate-spin" : ""}`} /> Push
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery Jobs */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">Delivery History</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-800/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="p-3">Job</th>
                <th className="p-3">Protocol</th>
                <th className="p-3">Status</th>
                <th className="p-3">Triggered By</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {jobs.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No delivery jobs yet</td></tr>
              ) : jobs.map((job) => (
                <tr key={job.id} className="hover:bg-zinc-800/20">
                  <td className="p-3 font-mono text-xs text-zinc-400">#{job.id.slice(-8)}</td>
                  <td className="p-3 text-zinc-300">{job.feed?.protocol || "—"}</td>
                  <td className="p-3">
                    <span className={`text-[11px] font-medium px-2 py-1 rounded ${job.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{job.status}</span>
                  </td>
                  <td className="p-3 text-zinc-400">{job.triggeredBy}</td>
                  <td className="p-3 text-xs text-zinc-500">{new Date(job.startedAt).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    {job.responsePayload && (
                      <button onClick={() => setSelectedJob(job)} className="text-xs text-indigo-400 hover:underline">View JSON</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedJob && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setSelectedJob(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-5 z-50 shadow-2xl animate-scaleIn space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-200">Response Payload</h3>
              <button onClick={() => setSelectedJob(null)} className="text-zinc-500 hover:text-zinc-300 text-sm">✕</button>
            </div>
            <pre className="p-3 rounded-lg bg-zinc-950 font-mono text-xs text-zinc-400 overflow-y-auto max-h-64">
              {JSON.stringify(JSON.parse(selectedJob.responsePayload || "{}"), null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
