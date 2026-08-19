"use client";

import React, { useState, useEffect } from "react";
import { Settings, Zap, FileCheck, Check, Copy, Send, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { activeOrg } = useAuth();
  const [activeTab, setActiveTab] = useState<"schema" | "mcp" | "general">("schema");

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [schemaJsonLd, setSchemaJsonLd] = useState(`{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Schneider Electric Acti9 iC60N",
  "sku": "SCH-A9F74116",
  "gtin13": "3606480439734",
  "offers": { "price": 24.50, "priceCurrency": "USD" }
}`);
  const [schemaDiffResult, setSchemaDiffResult] = useState<any>(null);
  const [schemaChecking, setSchemaChecking] = useState(false);

  const [selectedMcpTool, setSelectedMcpTool] = useState<string>("search_products");
  const [mcpInputJson, setMcpInputJson] = useState(`{ "query": "circuit breaker", "limit": 3 }`);
  const [mcpResult, setMcpResult] = useState<any>(null);
  const [mcpExecuting, setMcpExecuting] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  useEffect(() => {
    fetch("/api/products?limit=100").then((r) => r.json()).then((d) => {
      if (d.success && d.products) { setProducts(d.products); if (d.products.length > 0) setSelectedProductId(d.products[0].id); }
    });
  }, []);

  const handleSchemaCheck = async () => {
    if (!selectedProductId || !schemaJsonLd.trim()) return;
    setSchemaChecking(true); setSchemaDiffResult(null);
    const res = await fetch(`/api/products/${selectedProductId}/schema-check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonLd: schemaJsonLd }) });
    const json = await res.json();
    if (json.success) setSchemaDiffResult(json.diff);
    setSchemaChecking(false);
  };

  const handleMcpToolChange = (tool: string) => {
    setSelectedMcpTool(tool);
    if (tool === "search_products") setMcpInputJson(`{ "query": "circuit breaker", "limit": 3 }`);
    else if (tool === "get_product") setMcpInputJson(`{ "skuOrId": "SCH-A9F74116" }`);
    else setMcpInputJson(`{ "skuOrId": "SCH-A9F74116" }`);
  };

  const handleExecuteMcp = async () => {
    setMcpExecuting(true); setMcpResult(null);
    try {
      const parsedArgs = JSON.parse(mcpInputJson);
      const res = await fetch("/api/mcp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name: selectedMcpTool, arguments: parsedArgs } }) });
      setMcpResult(await res.json());
    } catch { alert("Invalid JSON"); }
    setMcpExecuting(false);
  };

  const tabs = [
    { id: "schema", label: "Schema.org Checker", icon: FileCheck },
    { id: "mcp", label: "MCP Endpoint", icon: Zap },
    { id: "general", label: "Organization", icon: Settings },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Schema.org diffing, MCP tools, and workspace configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800/60 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab.id ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Schema.org Tab */}
      {activeTab === "schema" && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-200">Schema.org JSON-LD Diff</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Paste structured data and compare against your catalog product</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 max-w-[260px]">
                  {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.title.slice(0, 30)}...</option>)}
                </select>
                <button onClick={handleSchemaCheck} disabled={schemaChecking}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white disabled:opacity-50">
                  {schemaChecking ? "Checking..." : "Run Diff"}
                </button>
              </div>
            </div>
            <textarea rows={7} value={schemaJsonLd} onChange={(e) => setSchemaJsonLd(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-indigo-300 focus:outline-none focus:border-zinc-600 resize-none" />
          </div>

          {schemaDiffResult && (
            <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-4 animate-fadeInUp">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/50">
                <span className="text-sm text-zinc-400">Consistency: <span className="text-2xl font-bold font-mono text-emerald-400">{schemaDiffResult.consistencyScore}%</span></span>
                <span className="text-xs text-zinc-500">
                  <span className="text-emerald-400 font-medium">{schemaDiffResult.matches?.length || 0}</span> matches ·{" "}
                  <span className="text-red-400 font-medium">{schemaDiffResult.mismatches?.length || 0}</span> mismatches
                </span>
              </div>
              {schemaDiffResult.mismatches?.length > 0 && (
                <div className="space-y-2">
                  {schemaDiffResult.mismatches.map((m: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/15 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-red-400 text-xs uppercase">{m.field}</span>
                        <span className="text-[10px] text-red-400/60">DIVERGENCE</span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        Catalog: <span className="text-zinc-200 font-mono">{m.productValue}</span> · Schema.org: <span className="text-indigo-300 font-mono">{m.schemaValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {schemaDiffResult.matches?.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {schemaDiffResult.matches.map((m: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-xs flex items-center justify-between">
                      <span className="font-mono text-zinc-300">{m.field}</span>
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MCP Tab */}
      {activeTab === "mcp" && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Model Context Protocol
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">JSON-RPC 2.0 endpoint for autonomous LLM agents</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-indigo-300">POST /api/mcp</code>
                <button onClick={() => { navigator.clipboard.writeText(`curl -X POST http://localhost:3000/api/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_products","arguments":{"query":"sensor"}}}'`); setCopiedCurl(true); setTimeout(() => setCopiedCurl(false), 2000); }}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 border border-zinc-700/60 flex items-center gap-1">
                  {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} {copiedCurl ? "Copied" : "cURL"}
                </button>
              </div>
            </div>

            {/* Tool Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "search_products", label: "search_products", desc: "Search catalog by keywords" },
                { id: "get_product", label: "get_product", desc: "Get full product details by SKU" },
                { id: "check_compliance", label: "check_compliance", desc: "Check ACP/UCP fill rates" },
              ].map((tool) => (
                <button key={tool.id} onClick={() => handleMcpToolChange(tool.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${selectedMcpTool === tool.id ? "bg-indigo-500/8 border-indigo-500/30" : "bg-zinc-800/30 border-zinc-800/50 hover:border-zinc-700"}`}>
                  <div className="font-mono text-xs text-indigo-400 font-medium">{tool.label}</div>
                  <div className="text-[11px] text-zinc-500 mt-1">{tool.desc}</div>
                </button>
              ))}
            </div>

            {/* Tester */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400 font-mono">Parameters</span>
                <button onClick={handleExecuteMcp} disabled={mcpExecuting}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white disabled:opacity-50 flex items-center gap-1.5">
                  <Send className={`w-3 h-3 ${mcpExecuting ? "animate-spin" : ""}`} /> Execute
                </button>
              </div>
              <textarea rows={2} value={mcpInputJson} onChange={(e) => setMcpInputJson(e.target.value)}
                className="w-full p-2.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-indigo-300 focus:outline-none focus:border-zinc-600 resize-none" />
              {mcpResult && (
                <div className="pt-2 border-t border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase font-medium">Response</span>
                  <pre className="p-3 mt-1 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-400 max-h-48 overflow-y-auto">{JSON.stringify(mcpResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-4 animate-fadeIn">
          <h2 className="text-sm font-semibold text-zinc-200">Organization</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-zinc-500 text-xs">Name</span><div className="text-zinc-200 font-medium mt-0.5">{activeOrg.name}</div></div>
            <div><span className="text-zinc-500 text-xs">Slug</span><div className="font-mono text-indigo-400 mt-0.5">{activeOrg.slug}</div></div>
          </div>
          <div className="pt-4 border-t border-zinc-800/50 space-y-2 text-sm text-zinc-400">
            <p className="font-medium text-zinc-300">Governance Policy</p>
            <p>• GTIN required for PUBLISHED status</p>
            <p>• AI changes below 85% confidence routed to approval queue</p>
            <p>• Feeds auto-regenerate on product approval</p>
          </div>
        </div>
      )}
    </div>
  );
}
