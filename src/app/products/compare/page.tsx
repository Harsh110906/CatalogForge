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
    fetch("/api/products?limit=100").then((r) => r.json()).then((d) => {
      if (d.success) setProducts(d.products || []);
    });
  }, []);

  const addProduct = (p: any) => {
    if (selected.length >= 3) return;
    if (selected.find((s) => s.id === p.id)) return;
    setSelected([...selected, p]);
  };

  const removeProduct = (id: string) => setSelected(selected.filter((s) => s.id !== id));

  const filtered = products.filter((p) =>
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-indigo-400" /> Product Comparison
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">Select up to 3 products to compare side-by-side</p>
      </div>

      {/* Product Picker */}
      {selected.length < 3 && (
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 border-dashed space-y-3">
          <input
            type="text"
            placeholder="Search products to add..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {filtered.slice(0, 9).map((p) => (
              <button key={p.id} onClick={() => addProduct(p)}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/50 hover:border-zinc-700 transition-colors text-left">
                <Plus className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-mono text-zinc-400">{p.sku}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{p.title.slice(0, 35)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Products Header */}
      {selected.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="p-3 w-44 text-zinc-500 text-xs uppercase font-medium">Attribute</th>
                {selected.map((p) => (
                  <th key={p.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link href={`/products/${p.id}`} className="text-sm font-medium text-indigo-400 hover:underline">{p.sku}</Link>
                        <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-xs">{p.title.slice(0, 40)}</div>
                      </div>
                      <button onClick={() => removeProduct(p.id)} className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {/* Core fields */}
              {[
                { label: "Brand", key: "brand" },
                { label: "Category", key: "category" },
                { label: "GTIN", key: "gtin" },
                { label: "Price", key: "price", format: (v: any, p: any) => formatCurrency(v, p.currency) },
                { label: "Status", key: "status" },
                { label: "Completeness", key: "completenessScore", format: (v: any) => formatPercent(v) },
                { label: "ACP Fill Rate", key: "acpFillRate", format: (v: any) => formatPercent(v) },
                { label: "UCP Fill Rate", key: "ucpFillRate", format: (v: any) => formatPercent(v) },
                { label: "Visibility Tier", key: "agentVisibilityTier" },
                { label: "Taxonomy Code", key: "taxonomyCode" },
              ].map((row) => (
                <tr key={row.key} className="hover:bg-zinc-800/20">
                  <td className="p-3 text-xs text-zinc-500 font-medium">{row.label}</td>
                  {selected.map((p) => {
                    const val = p[row.key];
                    const display = row.format ? row.format(val, p) : (val || "—");
                    return <td key={p.id} className="p-3 text-sm text-zinc-300 font-mono">{display}</td>;
                  })}
                </tr>
              ))}

              {/* Dynamic attributes */}
              {Array.from(allKeys).map((key) => (
                <tr key={key} className="hover:bg-zinc-800/20">
                  <td className="p-3 text-xs text-zinc-500 font-medium capitalize">{key.replace(/_/g, " ")}</td>
                  {selected.map((p) => {
                    let val = "—";
                    try {
                      const attrs = JSON.parse(p.attributes || "{}");
                      val = attrs[key] || "—";
                    } catch {}
                    return <td key={p.id} className="p-3 text-sm text-zinc-300 font-mono">{val}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected.length === 0 && (
        <div className="py-16 text-center">
          <GitCompare className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Select products above to start comparing</p>
        </div>
      )}
    </div>
  );
}
