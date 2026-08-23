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
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSuppliers(d.suppliers || []);
        setLoading(false);
      });
  }, []);

  const trustBadge = (t: string) => {
    if (t === "VERIFIED") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">VERIFIED</span>;
    if (t === "PROBATION") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">PROBATION</span>;
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#0052ff] border border-blue-200">STANDARD</span>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">Data quality leaderboard and supplier portal management</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0052ff]" />
          Loading supplier leaderboard...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {suppliers.map((s, idx) => (
            <div key={s.id} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono ${idx === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    #{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                      <span className="font-mono">{s.code}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{s.contactEmail}</span>
                    </div>
                  </div>
                </div>
                {trustBadge(s.trustLevel)}
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quality</span>
                  <div className="text-lg font-extrabold font-mono text-emerald-600">{s.qualityScore.toFixed(0)}%</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Products</span>
                  <div className="text-lg font-extrabold font-mono text-slate-900">{s.skuCount}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completeness</span>
                  <div className="text-lg font-extrabold font-mono text-[#0052ff]">{formatPercent(s.avgCompleteness)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Link href={`/products?supplierId=${s.id}`} className="text-xs font-semibold text-[#0052ff] hover:underline">
                  View catalog ({s.skuCount} SKUs) →
                </Link>
                {s.code === "ACME-ELEC" && (
                  <button
                    onClick={() => setCurrentUser({ id: "user-supplier-1", name: "Elena Rostova", email: "elena@acme-electro.de", role: "SUPPLIER", supplierId: "ACME-ELEC", supplierName: "Acme Electrical Components", avatar: "ER" })}
                    className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold transition-all"
                  >
                    Switch to Supplier View
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
