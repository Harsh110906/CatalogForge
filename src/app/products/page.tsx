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
import { formatCurrency, formatPercent } from "@/lib/utils";
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
    "ALL", "Circuit Breakers", "Power Supplies",
    "Sensors", "VFDs", "Terminal Blocks", "PLCs & Controllers",
  ];

  const tierBadge = (tier: string) => {
    if (tier === "TRUSTED") return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0052ff] border border-blue-200">TRUSTED</span>;
    if (tier === "PENALIZED") return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">PENALIZED</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">INVISIBLE</span>;
  };

  const statusBadge = (s: string) => {
    if (s === "PUBLISHED") return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">PUBLISHED</span>;
    if (s === "APPROVED") return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">APPROVED</span>;
    if (s === "REVIEW") return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">REVIEW</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">DRAFT</span>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Products</h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-semibold text-slate-900">{products.length} products</span> in catalog workspace
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/ingestion"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" /> Import CSV
          </Link>
          <Link
            href="/products/compare"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all"
          >
            Compare Matrix
          </Link>
        </div>
      </div>

      {/* Feedback message */}
      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0052ff] flex items-center justify-between animate-fadeInUp">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU, title, brand, GTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0052ff] focus:bg-white transition-all"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0052ff] transition-all"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "ALL" ? "All Categories" : c}
            </option>
          ))}
        </select>

        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0052ff] transition-all"
        >
          <option value="ALL">All Tiers</option>
          <option value="TRUSTED">Trusted</option>
          <option value="PENALIZED">Penalized</option>
          <option value="INVISIBLE">Invisible</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0052ff] transition-all"
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="APPROVED">Approved</option>
          <option value="REVIEW">Review</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Bulk Action Sticky Bar */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#0052ff] text-white flex items-center justify-between shadow-xl animate-fadeInUp">
          <span className="text-xs font-bold">{selectedIds.length} item(s) selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("enrich")}
              disabled={isBulkProcessing}
              className="px-4 py-1.5 rounded-full bg-white text-[#0052ff] hover:bg-blue-50 text-xs font-bold shadow-2xs disabled:opacity-50"
            >
              AI Enrich
            </button>
            <button
              onClick={() => handleBulkAction("approve")}
              disabled={isBulkProcessing}
              className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-2xs disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-1.5 rounded-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products Table Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700">
                    {selectedIds.length === products.length && products.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#0052ff]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Product / SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Completeness</th>
                <th className="py-3.5 px-4">AI Tier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0052ff] mb-2" />
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isSelected = selectedIds.includes(prod.id);
                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button onClick={() => toggleSelect(prod.id)} className="text-slate-400 hover:text-slate-700">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#0052ff]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link href={`/products/${prod.id}`} className="group block max-w-sm">
                          <div className="font-bold text-slate-900 group-hover:text-[#0052ff] transition-colors line-clamp-1">
                            {prod.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>{prod.sku}</span>
                            {prod.gtin && (
                              <span className="flex items-center gap-1 text-slate-400">
                                <Barcode className="w-3 h-3" /> {prod.gtin}
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {prod.category}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {formatCurrency(prod.price, prod.currency)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {formatPercent(prod.completenessScore)}
                          </span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${prod.completenessScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {tierBadge(prod.agentVisibilityTier)}
                      </td>

                      <td className="py-3.5 px-4">
                        {statusBadge(prod.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/products/${prod.id}`}
                          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors inline-block"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading products page...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
