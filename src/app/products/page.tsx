"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Boxes,
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Bot,
  Barcode,
  CheckSquare,
  Square,
  ChevronRight,
  Upload,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency, formatPercent, getStatusBadge, getTierBadge } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

function ProductsContent() {
  const searchParams = useSearchParams();
  const { currentUser, isSupplier, canEdit, canPublish } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedTier, setSelectedTier] = useState(searchParams.get("tier") || "ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (selectedTier !== "ALL") params.set("tier", selectedTier);
      if (isSupplier && currentUser.supplierId) params.set("supplierId", currentUser.supplierId);

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) setProducts(json.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedStatus, selectedTier, isSupplier]);

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === products.length ? [] : products.map((p) => p.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    try {
      setIsBulkProcessing(true);
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, productIds: selectedIds, requestedBy: currentUser.name }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedbackMsg(`${action} completed on ${json.updatedCount} product(s).`);
        await fetchProducts();
        setSelectedIds([]);
      }
    } catch (e: any) {
      setFeedbackMsg(`Error: ${e.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const categories = [
    "ALL", "Miniature Circuit Breakers (MCBs)", "PLC CPU & Controller Modules",
    "DIN-Rail Power Supply Units", "Photoelectric / Proximity Sensors",
    "Feed-Through Terminal Blocks & Splicing", "Frequency Converters / VFDs",
  ];

  const tierColor = (tier: string) => {
    if (tier === "TRUSTED") return "text-emerald-400 bg-emerald-500/10";
    if (tier === "PENALIZED") return "text-amber-400 bg-amber-500/10";
    return "text-red-400 bg-red-500/10";
  };

  const statusColor = (s: string) => {
    if (s === "PUBLISHED") return "text-emerald-400 bg-emerald-500/10";
    if (s === "APPROVED") return "text-blue-400 bg-blue-500/10";
    if (s === "REVIEW") return "text-amber-400 bg-amber-500/10";
    return "text-zinc-400 bg-zinc-700/50";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Products</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {products.length} products in catalog
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/ingestion"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-sm text-zinc-300 border border-zinc-700/60 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </Link>
          <Link
            href="/products/compare"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white transition-colors"
          >
            Compare
          </Link>
        </div>
      </div>

      {/* Feedback */}
      {feedbackMsg && (
        <div className="px-4 py-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300 flex items-center justify-between animate-fadeInUp">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by SKU, title, brand, GTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600">
          {categories.map((c) => <option key={c} value={c}>{c === "ALL" ? "All Categories" : c}</option>)}
        </select>
        <select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600">
          <option value="ALL">All Tiers</option>
          <option value="TRUSTED">Trusted</option>
          <option value="PENALIZED">Penalized</option>
          <option value="INVISIBLE">Invisible</option>
        </select>
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600">
          <option value="ALL">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="APPROVED">Approved</option>
          <option value="REVIEW">Review</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Bulk Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-xl bg-indigo-500/8 border border-indigo-500/20 flex items-center justify-between animate-fadeInUp sticky bottom-4 z-40">
          <span className="text-sm text-indigo-300 font-medium">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <button onClick={() => handleBulkAction("enrich")} disabled={isBulkProcessing}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white disabled:opacity-50">
              AI Enrich
            </button>
            <button onClick={() => handleBulkAction("approve")} disabled={isBulkProcessing}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white disabled:opacity-50">
              Approve
            </button>
            <button onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800/60 text-zinc-500 text-xs uppercase tracking-wider">
              <th className="p-3 w-10">
                <button onClick={toggleSelectAll} className="text-zinc-500 hover:text-zinc-300">
                  {selectedIds.length === products.length && products.length > 0
                    ? <CheckSquare className="w-4 h-4 text-indigo-400" />
                    : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Completeness</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Status</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {loading ? (
              <tr><td colSpan={8} className="p-12 text-center text-zinc-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                Loading products...
              </td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="p-12 text-center text-zinc-500">No products match your filters.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className={`hover:bg-zinc-800/30 transition-colors ${selectedIds.includes(p.id) ? "bg-indigo-500/5" : ""}`}>
                  <td className="p-3">
                    <button onClick={() => toggleSelect(p.id)} className="text-zinc-500 hover:text-zinc-300">
                      {selectedIds.includes(p.id) ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="p-3">
                    <Link href={`/products/${p.id}`} className="block group">
                      <div className="text-sm font-medium text-zinc-200 group-hover:text-indigo-400 transition-colors">
                        {p.title.length > 50 ? p.title.slice(0, 50) + "..." : p.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                        <span className="font-mono">{p.sku}</span>
                        {p.gtin ? (
                          <span className="flex items-center gap-0.5"><Barcode className="w-3 h-3" />{p.gtin}</span>
                        ) : (
                          <span className="text-red-400 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />No GTIN</span>
                        )}
                        {p.isBenchmark && <span className="text-amber-400 text-[10px] font-medium">★ Benchmark</span>}
                      </div>
                    </Link>
                  </td>
                  <td className="p-3 text-xs text-zinc-400 max-w-[140px] truncate">{p.category}</td>
                  <td className="p-3 text-sm font-mono text-zinc-300">{formatCurrency(p.price, p.currency)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${p.completenessScore}%` }} />
                      </div>
                      <span className="text-xs font-mono text-zinc-400">{formatPercent(p.completenessScore)}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-md ${tierColor(p.agentVisibilityTier)}`}>
                      {p.agentVisibilityTier === "TRUSTED" ? "Trusted" : p.agentVisibilityTier === "PENALIZED" ? "Penalized" : "Invisible"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-md ${statusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link href={`/products/${p.id}`} className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-zinc-500"><RefreshCw className="w-5 h-5 animate-spin mr-2 text-indigo-400" />Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
