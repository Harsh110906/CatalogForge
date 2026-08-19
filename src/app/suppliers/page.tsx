"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Mail, RefreshCw } from "lucide-react";
import { formatPercent } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function SuppliersPage() {
  const { setCurrentUser } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/suppliers").then((r) => r.json()).then((d) => { if (d.success) setSuppliers(d.suppliers || []); setLoading(false); });
  }, []);

  const trustColor = (t: string) => {
    if (t === "VERIFIED") return "text-emerald-400 bg-emerald-500/10";
    if (t === "PROBATION") return "text-red-400 bg-red-500/10";
    return "text-blue-400 bg-blue-500/10";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Suppliers</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Data quality leaderboard and supplier portal management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 stagger-children">
        {suppliers.map((s, idx) => (
          <div key={s.id} className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 card-hover space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${idx === 0 ? "bg-amber-500/15 text-amber-400" : "bg-zinc-800 text-zinc-500"}`}>
                  #{idx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">{s.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                    <span className="font-mono">{s.code}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.contactEmail}</span>
                  </div>
                </div>
              </div>
              <span className={`text-[11px] font-medium px-2 py-1 rounded-md ${trustColor(s.trustLevel)}`}>
                {s.trustLevel}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800/50">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">Quality</span>
                <div className="text-lg font-bold font-mono text-emerald-400">{s.qualityScore.toFixed(0)}%</div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">Products</span>
                <div className="text-lg font-bold font-mono text-zinc-200">{s.skuCount}</div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">Completeness</span>
                <div className="text-lg font-bold font-mono text-indigo-400">{formatPercent(s.avgCompleteness)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link href={`/products?supplierId=${s.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                View catalog ({s.skuCount} SKUs) →
              </Link>
              {s.code === "ACME-ELEC" && (
                <button onClick={() => setCurrentUser({ id: "user-supplier-1", name: "Elena Rostova", email: "elena@acme-electro.de", role: "SUPPLIER", supplierId: "ACME-ELEC", supplierName: "Acme Electrical Components", avatar: "ER" })}
                  className="px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-medium transition-colors">
                  Switch to Supplier View
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
