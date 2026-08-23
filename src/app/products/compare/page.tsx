"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GitCompare, Plus, X, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default function ComparePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProducts(d.products || []);
      });
  }, []);

  const addProduct = (p: any) => {
    if (selected.length >= 3) return;
    if (selected.find((s) => s.id === p.id)) return;
    setSelected([...selected, p]);
  };

  const removeProduct = (id: string) => setSelected(selected.filter((s) => s.id !== id));

  const filtered = products.filter(
    (p) =>
      !selected.find((s) => s.id === p.id) &&
      (p.sku.toLowerCase().includes(search.toLowerCase()) || p.title.toLowerCase().includes(search.toLowerCase()))
  );

  const allKeys = new Set<string>();
  selected.forEach((p) => {
    if (p.attributes) {
      try {
        Object.keys(JSON.parse(p.attributes)).forEach((k) => allKeys.add(k));
      } catch {}
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-[#0052ff]" /> Product Comparison Matrix
        </h1>
        <p className="text-sm text-slate-500 mt-1">Select up to 3 products to compare side-by-side</p>
      </div>

      {/* Product Picker Card */}
      {selected.length < 3 && (
        <div className="p-6 rounded-3xl bg-white border-2 border-dashed border-blue-200 hover:border-[#0052ff] transition-all space-y-4 shadow-sm">
          <input
            type="text"
            placeholder="Search products by SKU or title to compare..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0052ff]"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
            {filtered.slice(0, 9).map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/60 hover:border-blue-300 transition-all text-left group"
              >
                <Plus className="w-4 h-4 text-[#0052ff] flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-mono font-bold text-slate-900 group-hover:text-[#0052ff]">{p.sku}</div>
                  <div className="text-[11px] text-slate-500 truncate">{p.title.slice(0, 35)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Matrix Table Card */}
      {selected.length > 0 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 w-44 text-slate-500 text-[10px] uppercase font-bold tracking-wider">Attribute</th>
                  {selected.map((p) => (
                    <th key={p.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link href={`/products/${p.id}`} className="text-xs font-bold text-[#0052ff] hover:underline font-mono">
                            {p.sku}
                          </Link>
                          <div className="text-[11px] text-slate-600 font-semibold mt-0.5 truncate max-w-xs">{p.title.slice(0, 40)}</div>
                        </div>
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                <tr>
                  <td className="p-4 bg-slate-50/50 font-bold text-slate-600">Brand</td>
                  {selected.map((p) => (
                    <td key={p.id} className="p-4 font-bold">{p.brand}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 bg-slate-50/50 font-bold text-slate-600">Price</td>
                  {selected.map((p) => (
                    <td key={p.id} className="p-4 font-mono font-bold">{formatCurrency(p.price, p.currency)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 bg-slate-50/50 font-bold text-slate-600">Completeness</td>
                  {selected.map((p) => (
                    <td key={p.id} className="p-4 font-mono font-bold text-emerald-600">{formatPercent(p.completenessScore)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 bg-slate-50/50 font-bold text-slate-600">AI Tier</td>
                  {selected.map((p) => (
                    <td key={p.id} className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#0052ff] border border-blue-200">
                        {p.agentVisibilityTier}
                      </span>
                    </td>
                  ))}
                </tr>

                {Array.from(allKeys).map((key) => (
                  <tr key={key}>
                    <td className="p-4 bg-slate-50/50 font-bold text-slate-600">{key}</td>
                    {selected.map((p) => {
                      let val = "-";
                      if (p.attributes) {
                        try {
                          const parsed = JSON.parse(p.attributes);
                          val = parsed[key] || "-";
                        } catch {}
                      }
                      return (
                        <td key={p.id} className="p-4 font-mono">
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
