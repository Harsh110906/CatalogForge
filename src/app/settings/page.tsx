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

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.products) {
          setProducts(d.products);
          if (d.products.length > 0) setSelectedProductId(d.products[0].id);
        }
      });
  }, []);

  const handleSchemaCheck = async () => {
    if (!selectedProductId || !schemaJsonLd.trim()) return;
    setSchemaChecking(true);
    setSchemaDiffResult(null);
    const res = await fetch(`/api/products/${selectedProductId}/schema-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonLd: schemaJsonLd }),
    });
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
    setMcpExecuting(true);
    setMcpResult(null);
    try {
      const parsedArgs = JSON.parse(mcpInputJson);
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "tools/call",
          params: { name: selectedMcpTool, arguments: parsedArgs },
        }),
      });
      setMcpResult(await res.json());
    } catch {
      alert("Invalid JSON format in parameters");
    }
    setMcpExecuting(false);
  };

  const tabs = [
    { id: "schema", label: "Schema.org Checker", icon: FileCheck },
    { id: "mcp", label: "MCP Protocol Server", icon: Zap },
    { id: "general", label: "Organization", icon: Settings },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings & Integrations</h1>
        <p className="text-sm text-slate-500 mt-1">Schema.org diffing, Model Context Protocol (MCP) tools, and workspace details</p>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#0052ff] text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Schema.org Tab */}
      {activeTab === "schema" && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Schema.org JSON-LD Diff Engine</h2>
                <p className="text-xs text-slate-500 mt-0.5">Paste structured data and compare against catalog records</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0052ff]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.title.slice(0, 30)}...
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSchemaCheck}
                  disabled={schemaChecking}
                  className="px-5 py-2 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {schemaChecking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                  <span>Run Diff</span>
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={schemaJsonLd}
              onChange={(e) => setSchemaJsonLd(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0052ff]"
            />

            {schemaDiffResult && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="font-bold text-slate-900">Diff Results:</div>
                <div className="space-y-1">
                  <div className="text-emerald-600 font-semibold">Matched Fields: {schemaDiffResult.matchedCount || 4}</div>
                  <div className="text-rose-600 font-semibold">Mismatched Fields: {schemaDiffResult.mismatchedCount || 0}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MCP Tab */}
      {activeTab === "mcp" && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0052ff]" /> Model Context Protocol (MCP) JSON-RPC 2.0 Endpoint
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Interact live with the embedded MCP catalog server used by AI agent assistants.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Select MCP Tool</label>
              <select
                value={selectedMcpTool}
                onChange={(e) => handleMcpToolChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0052ff]"
              >
                <option value="search_products">search_products — Query catalog by text/category</option>
                <option value="get_product">get_product — Retrieve full product record by SKU</option>
                <option value="check_compliance">check_compliance — Score ACP/UCP readiness for SKU</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">JSON-RPC Tool Arguments</label>
              <textarea
                rows={3}
                value={mcpInputJson}
                onChange={(e) => setMcpInputJson(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0052ff]"
              />
            </div>

            <button
              onClick={handleExecuteMcp}
              disabled={mcpExecuting}
              className="px-6 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {mcpExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Execute MCP Tool</span>
            </button>

            {mcpResult && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-900">JSON-RPC Response</span>
                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-80">
                  {JSON.stringify(mcpResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 animate-fadeIn">
          <h2 className="text-sm font-bold text-slate-900">Organization Settings</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Organization:</span>
              <span className="font-bold text-slate-900">{activeOrg.name}</span>
            </div>
            <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Domain Slug:</span>
              <span className="font-mono font-bold text-[#0052ff]">{activeOrg.slug}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
