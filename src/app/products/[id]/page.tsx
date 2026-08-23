"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Boxes,
  ArrowLeft,
  Sparkles,
  Bot,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Save,
  Tag,
  Barcode,
  Building2,
  Layers,
  History,
  X,
  Check,
  ChevronRight,
  Eye,
  RefreshCw,
  GitCompare,
  HelpCircle,
  ListChecks,
  Plus,
  Trash2,
  FileCheck,
} from "lucide-react";
import { formatCurrency, formatPercent, getStatusBadge, getTierBadge, cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { currentUser, canEdit, canPublish } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, attributes, signals, compliance, benchmark, audit
  const [isSaving, setIsSaving] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [gtin, setGtin] = useState("");
  const [price, setPrice] = useState<string | number>("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState("");
  const [taxonomyCode, setTaxonomyCode] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [isBenchmark, setIsBenchmark] = useState(false);

  // Generative Visibility Signals [PATCH 3]
  const [highlights, setHighlights] = useState<string[]>([]);
  const [qaPairs, setQaPairs] = useState<Array<{ question: string; answer: string }>>([]);

  // Attributes State
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrVal, setNewAttrVal] = useState("");

  // Explainability Panel State
  const [selectedFieldForInspect, setSelectedFieldForInspect] = useState<any>(null);

  // Version Diff Modal State
  const [selectedVersionForDiff, setSelectedVersionForDiff] = useState<any>(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`);
      const json = await res.json();
      if (json.success && json.product) {
        const p = json.product;
        setProduct(p);
        setTitle(p.title || "");
        setDescription(p.description || "");
        setBrand(p.brand || "");
        setGtin(p.gtin || "");
        setPrice(p.price || "");
        setCurrency(p.currency || "USD");
        setCategory(p.category || "");
        setTaxonomyCode(p.taxonomyCode || "");
        setStatus(p.status || "DRAFT");
        setIsBenchmark(p.isBenchmark || false);

        // Parse Highlights & Q&A
        try {
          setHighlights(p.highlights ? JSON.parse(p.highlights) : []);
        } catch {
          setHighlights([]);
        }
        try {
          setQaPairs(p.qaPairs ? JSON.parse(p.qaPairs) : []);
        } catch {
          setQaPairs([]);
        }

        // Parse Attributes
        try {
          setAttributes(p.attributes ? JSON.parse(p.attributes) : {});
        } catch {
          setAttributes({});
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleSave = async (targetStatus?: string) => {
    try {
      setIsSaving(true);
      setFeedback(null);

      const statusToSave = targetStatus || status;

      const payload = {
        title,
        description,
        brand,
        gtin: gtin.trim() || null,
        price: price !== "" ? parseFloat(String(price)) : null,
        currency,
        category,
        taxonomyCode,
        status: statusToSave,
        isBenchmark,
        highlights,
        qaPairs,
        attributes,
        changedBy: currentUser.name,
        changeReason: targetStatus ? `Status transition to ${targetStatus}` : "Product field edit",
      };

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setFeedback({ type: "success", msg: "Product record saved successfully." });
        setStatus(statusToSave);
        await fetchProduct();
      } else {
        setFeedback({ type: "error", msg: json.error || "Failed to save product." });
      }
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerEnrichment = async () => {
    try {
      setIsEnriching(true);
      setFeedback(null);
      const res = await fetch(`/api/products/${id}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedBy: currentUser.name }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: "success",
          msg: `AI Enrichment Complete! Generated technical title, description, ${json.enrichment?.highlights?.length || 3} highlights, and ${json.enrichment?.qaPairs?.length || 3} Q&A signals.`,
        });
        await fetchProduct();
      } else {
        setFeedback({ type: "error", msg: json.error });
      }
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleTriggerValidation = async () => {
    try {
      setIsValidating(true);
      setFeedback(null);
      const res = await fetch(`/api/products/${id}/validate`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: "success",
          msg: `Validation complete. Discovered ${json.issuesCount} issue(s) against engineering rules and benchmark standards.`,
        });
        await fetchProduct();
      } else {
        setFeedback({ type: "error", msg: json.error });
      }
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setIsValidating(false);
    }
  };

  const handleTriggerAutofill = async () => {
    try {
      setIsAutofilling(true);
      setFeedback(null);
      const res = await fetch(`/api/products/${id}/compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "autofill" }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: "success",
          msg: "Agentic Commerce 2026 Auto-fill Complete! Synthesized GTIN, return policy, and Google UCP dimensions. Score updated to Trusted (>95%).",
        });
        await fetchProduct();
      } else {
        setFeedback({ type: "error", msg: json.error });
      }
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setIsAutofilling(false);
    }
  };

  const toggleBenchmark = async () => {
    try {
      const nextBenchmark = !isBenchmark;
      const res = await fetch(`/api/products/${id}/benchmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBenchmark: nextBenchmark, changedBy: currentUser.name }),
      });
      const json = await res.json();
      if (json.success) {
        setIsBenchmark(nextBenchmark);
        setFeedback({
          type: "success",
          msg: nextBenchmark
            ? `Designated ${product.sku} as Golden Standard Benchmark for category '${product.category}'.`
            : `Removed ${product.sku} from Benchmark designation.`,
        });
        await fetchProduct();
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  if (loading || !product) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Loading product record and explainability tree...</span>
        </div>
      </div>
    );
  }

  const tierBadge = getTierBadge(product.agentVisibilityTier);
  const benchmarkDiff = product.benchmarkDiff ? JSON.parse(product.benchmarkDiff) : null;
  const unresolvedIssues = product.validationIssues?.filter((i: any) => !i.resolved) || [];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400">SKU:</span>
              <span className="text-base font-mono font-extrabold text-slate-900">{product.sku}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(status)}`}>
                {status}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${tierBadge.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tierBadge.dot}`} />
                {tierBadge.label}
              </span>
              {isBenchmark && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ★ GOLDEN BENCHMARK
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
              <span>{product.category}</span>
              <span>·</span>
              <span>Supplier: {product.supplier?.name}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleBenchmark}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              isBenchmark
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
          >
            ★ {isBenchmark ? "Golden Benchmark Active" : "Set as Golden Benchmark"}
          </button>

          <button
            onClick={handleTriggerEnrichment}
            disabled={isEnriching}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isEnriching ? "animate-spin" : ""}`} />
            <span>AI Enrich (Gemini)</span>
          </button>

          <button
            onClick={handleTriggerValidation}
            disabled={isValidating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition-all disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Validate Rules</span>
          </button>

          <button
            onClick={handleTriggerAutofill}
            disabled={isAutofilling}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-[#0052ff] border border-blue-200 transition-all disabled:opacity-50"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Auto-Fill ACP/UCP</span>
          </button>

          {canPublish && status !== "PUBLISHED" && (
            <button
              onClick={() => handleSave("PUBLISHED")}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-md transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Publish</span>
            </button>
          )}

          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/60 border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-200 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Unresolved Issues Alert Banner if any */}
      {unresolvedIssues.length > 0 && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{unresolvedIssues.length} Validation Issue(s) Detected</span>
          </div>
          <div className="mt-1 space-y-1">
            {unresolvedIssues.map((iss: any) => (
              <div key={iss.id} className="text-[11px] text-rose-300/90 pl-5">
                • <strong>[{iss.severity}]</strong> {iss.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2">
        {[
          { id: "overview", label: "Overview & Commercial", icon: Boxes },
          { id: "attributes", label: "Technical Attributes", icon: Layers, badge: Object.keys(attributes).length },
          { id: "signals", label: "Highlights & Q&A", icon: Sparkles, badge: `${highlights.length}/${qaPairs.length}` },
          { id: "compliance", label: "2026 Agentic Commerce (ACP/UCP)", icon: Bot, badge: `${product.agentVisibilityScore}%` },
          { id: "benchmark", label: "Golden Benchmark Diff", icon: GitCompare },
          { id: "audit", label: "Version History & Audit", icon: History, badge: product.auditLogs?.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-2xl transition-all ${
                isActive
                  ? "bg-[#0052ff] text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Commercial */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">Product Title</label>
              <textarea
                rows={2}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#0052ff] font-sans font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">Technical Overview & Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#0052ff] font-sans font-medium leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">Manufacturer / Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full p-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#0052ff] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  GTIN-13 Barcode <span className="text-rose-600 font-bold">* (Mandatory for Publish)</span>
                </label>
                <div className="relative">
                  <Barcode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={gtin}
                    onChange={(e) => setGtin(e.target.value)}
                    placeholder="e.g. 4016779464208"
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:bg-white focus:border-[#0052ff]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:bg-white focus:border-[#0052ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-3 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0052ff]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">ETIM Taxonomy Code</label>
                <input
                  type="text"
                  value={taxonomyCode}
                  onChange={(e) => setTaxonomyCode(e.target.value)}
                  placeholder="e.g. EC000042"
                  className="w-full p-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:bg-white focus:border-[#0052ff]"
                />
              </div>
            </div>
          </div>

          {/* Right Card: Scorecard & Supplier Info */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Record Quality Scores</h3>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300">Technical Completeness</span>
                    <span className="font-mono font-bold text-emerald-400">{formatPercent(product.completenessScore)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${product.completenessScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300">2026 Agent Visibility (ACP/UCP)</span>
                    <span className="font-mono font-bold text-indigo-400">{formatPercent(product.agentVisibilityScore)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${product.agentVisibilityScore}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>ACP Fill Rate:</span>
                  <strong className="text-slate-200 font-mono">{formatPercent(product.acpFillRate)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>UCP Fill Rate:</span>
                  <strong className="text-slate-200 font-mono">{formatPercent(product.ucpFillRate)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Availability:</span>
                  <strong className="text-emerald-400">{product.availability}</strong>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Supplier Profile</h3>
              <div className="text-xs font-semibold text-slate-200">{product.supplier?.name}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{product.supplier?.code}</div>
              <div className="mt-2 text-xs text-slate-300">Quality Rating: <strong>{product.supplier?.qualityScore}%</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Technical Specifications & Attributes (with Explainability panel triggers) */}
      {activeTab === "attributes" && (
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Normalized Technical Specifications</h2>
              <p className="text-xs text-slate-400">
                Click any attribute row to open the <strong className="text-indigo-400">Explainability Panel</strong> showing AI confidence, reasoning, and change history.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Attribute Key (e.g. voltage)"
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Value (e.g. 24V DC)"
                value={newAttrVal}
                onChange={(e) => setNewAttrVal(e.target.value)}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
              />
              <button
                onClick={() => {
                  if (newAttrKey.trim()) {
                    setAttributes((prev) => ({ ...prev, [newAttrKey.trim()]: newAttrVal.trim() }));
                    setNewAttrKey("");
                    setNewAttrVal("");
                  }
                }}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="p-3">Attribute Name</th>
                  <th className="p-3">Normalized Value</th>
                  <th className="p-3">Source & Confidence</th>
                  <th className="p-3">AI Reasoning Summary</th>
                  <th className="p-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {Object.entries(attributes).map(([key, val]) => {
                  const fieldRecord = product.attributeFields?.find((f: any) => f.fieldName === key);
                  const confidence = fieldRecord?.confidenceScore || 95.0;
                  const isAi = fieldRecord?.aiGenerated !== false;
                  const reasoning = fieldRecord?.aiReasoning || "Extracted from supplier datasheet against ETIM standard.";

                  return (
                    <tr
                      key={key}
                      onClick={() =>
                        setSelectedFieldForInspect({
                          fieldName: key,
                          value: val,
                          confidenceScore: confidence,
                          source: fieldRecord?.source || (isAi ? "AI_GENERATED" : "HUMAN"),
                          aiReasoning: reasoning,
                          lastEditedBy: fieldRecord?.lastEditedBy || "System",
                          editedAt: fieldRecord?.editedAt || product.updatedAt,
                        })
                      }
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-3 font-mono font-semibold text-slate-300">{key}</td>
                      <td className="p-3 font-medium text-slate-100">{String(val)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {isAi ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              ✨ AI {confidence.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              👤 HUMAN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] truncate max-w-xs">{reasoning}</td>
                      <td className="p-3 text-right">
                        <button className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700">
                          Explain →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Highlights & Q&A Pairs (Generative Visibility Signals) [PATCH 3] */}
      {activeTab === "signals" && (
        <div className="space-y-6">
          {/* Highlights Card */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Engineering Highlights (3-5 Bullet Points)
                </h3>
                <p className="text-xs text-slate-400">
                  Concise, punchy technical bullet points generated for autonomous agent search queries and quick spec indexing.
                </p>
              </div>

              <button
                onClick={() => setHighlights((prev) => [...prev, "New industrial engineering spec bullet point"])}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Bullet
              </button>
            </div>

            <div className="space-y-2">
              {highlights.map((h, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-1 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => {
                      const updated = [...highlights];
                      updated[idx] = e.target.value;
                      setHighlights(updated);
                    }}
                    className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none font-sans"
                  />
                  <button
                    onClick={() => setHighlights((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Q&A Pairs Card */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  Structured Engineering Q&A Pairs (3-5 Pairs)
                </h3>
                <p className="text-xs text-slate-400">
                  Pre-synthesized technical responses enabling LLM commerce agents to answer end-user electrical/mechanical compatibility questions instantly.
                </p>
              </div>

              <button
                onClick={() =>
                  setQaPairs((prev) => [
                    ...prev,
                    { question: "What is the certified operating standard?", answer: "Conforms to IEC/EN 60898-1 standards." },
                  ])
                }
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Q&A
              </button>
            </div>

            <div className="space-y-3">
              {qaPairs.map((qa, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Question #{idx + 1}</span>
                    <button
                      onClick={() => setQaPairs((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={qa.question}
                    onChange={(e) => {
                      const updated = [...qaPairs];
                      updated[idx].question = e.target.value;
                      setQaPairs(updated);
                    }}
                    placeholder="Technical question..."
                    className="w-full p-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                  <textarea
                    rows={2}
                    value={qa.answer}
                    onChange={(e) => {
                      const updated = [...qaPairs];
                      updated[idx].answer = e.target.value;
                      setQaPairs(updated);
                    }}
                    placeholder="Precise engineering answer..."
                    className="w-full p-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 2026 Agentic Commerce (ACP & UCP) */}
      {activeTab === "compliance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OpenAI/Stripe ACP Card */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                OpenAI / Stripe Agentic Commerce Protocol (ACP)
              </h3>
              <span className="font-mono font-bold text-indigo-400 text-sm">{formatPercent(product.acpFillRate)}</span>
            </div>
            <p className="text-xs text-slate-400">
              Required field set for direct AI agent discovery and checkout: Item ID, GTIN, Title, Description, Image, Price/Currency, Availability, Seller SLA.
            </p>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Item SKU Identifier:</span>
                <span className="font-mono text-slate-200">{product.sku}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">GS1 GTIN Barcode:</span>
                <span className={`font-mono ${product.gtin ? "text-emerald-400" : "text-rose-400 font-bold"}`}>
                  {product.gtin || "MISSING (Required)"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Availability State:</span>
                <span className="text-emerald-400 font-medium">{product.availability}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Return Policy SLA:</span>
                <span className="text-slate-300">30-Day Guaranteed Replacement</span>
              </div>
            </div>
          </div>

          {/* Google UCP Card */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Google Universal Commerce Protocol (UCP)
              </h3>
              <span className="font-mono font-bold text-emerald-400 text-sm">{formatPercent(product.ucpFillRate)}</span>
            </div>
            <p className="text-xs text-slate-400">
              Google Merchant Center & UCP attributes: GTIN/MPN, Shipping Dimensions, Weight, Product Category, Tax Code.
            </p>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Google Category:</span>
                <span className="text-slate-300">Industrial Automation & Electronics</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Condition:</span>
                <span className="text-slate-200 capitalize">{product.condition}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Shipping Weight:</span>
                <span className="text-slate-300">{attributes.weight || "0.25 kg"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Shipping Dimensions:</span>
                <span className="text-slate-300">{attributes.dimensions || "90x40x70 mm"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Golden Standard Benchmark Diff */}
      {activeTab === "benchmark" && (
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Golden Standard Category Benchmark Comparison</h3>
              <p className="text-xs text-slate-400">
                Diffing this SKU against the designated standard in <strong className="text-indigo-400">{product.category}</strong>.
              </p>
            </div>

            {isBenchmark && (
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                ★ This product IS the Category Benchmark
              </span>
            )}
          </div>

          {benchmarkDiff ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Benchmark SKU:</span>
                  <div className="font-mono font-bold text-slate-200 mt-0.5">{benchmarkDiff.benchmarkSku}</div>
                </div>
                <div>
                  <span className="text-slate-400">Missing Standard Attributes:</span>
                  <div className="font-bold text-rose-400 mt-0.5">{benchmarkDiff.missingCount} attributes</div>
                </div>
                <div>
                  <span className="text-slate-400">Matching Specifications:</span>
                  <div className="font-bold text-emerald-400 mt-0.5">{benchmarkDiff.matchingCount} attributes</div>
                </div>
              </div>

              {benchmarkDiff.missingAttributes && benchmarkDiff.missingAttributes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">Missing Attributes Gaps</h4>
                  <div className="space-y-1.5">
                    {benchmarkDiff.missingAttributes.map((gap: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded bg-rose-950/20 border border-rose-500/30 flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-slate-300">{gap.field}</span>
                        <span className="text-slate-400">
                          Benchmark value: <strong className="text-slate-200">{gap.benchmarkValue}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No benchmark comparison diff computed. Click "Validate Rules" to generate benchmark diff.
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Version History & Audit Trail */}
      {activeTab === "audit" && (
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Historical Audit Log & Version Trail</h3>
            <span className="text-xs text-slate-400 font-mono">{product.auditLogs?.length || 0} entries</span>
          </div>

          <div className="space-y-2">
            {product.auditLogs?.map((log: any) => (
              <div key={log.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-indigo-400">{log.fieldName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-slate-300 font-medium">{log.reason}</div>
                <div className="text-[11px] text-slate-400 mt-1">Author: {log.changedBy}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explainability Slide-Over Panel */}
      {selectedFieldForInspect && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setSelectedFieldForInspect(null)} />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 z-50 p-6 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">Field Explainability Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedFieldForInspect(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Field Name</span>
                <div className="font-mono font-bold text-base text-slate-100 mt-0.5">{selectedFieldForInspect.fieldName}</div>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Current Value</span>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm text-emerald-400 font-semibold mt-1">
                  {selectedFieldForInspect.value}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Confidence Score</span>
                  <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
                    {Number(selectedFieldForInspect.confidenceScore).toFixed(1)}%
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Provenance / Source</span>
                  <div className="text-xs font-bold font-mono text-slate-200 mt-1 uppercase">
                    {selectedFieldForInspect.source}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">AI Reasoning & Extraction Grounding</span>
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 font-sans leading-relaxed mt-1">
                  {selectedFieldForInspect.aiReasoning}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
                <div>Last Edited By: <strong className="text-slate-200">{selectedFieldForInspect.lastEditedBy}</strong></div>
                <div>Timestamp: <strong className="text-slate-200">{new Date(selectedFieldForInspect.editedAt).toLocaleString()}</strong></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
