"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Upload,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Boxes,
  FileText,
  Check,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function IngestionPage() {
  const { currentUser, isSupplier } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileContent, setFileContent] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<any[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [canonicalFields, setCanonicalFields] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

  const sampleCsvData = `mfg_part_no,gtin_barcode,item_title,manufacturer,unit_price,rated_volts,amperage,dim_w_h_d,mass_lbs,enclosure_ip,product_class
SCH-C60H-2P-16A,3606480439819,Acti9 C60H Circuit Breaker 2P 16A 10kA,Schneider Electric,42.50,400V,16A,36x85x78mm,0.55 lbs,IP20,Circuit Breakers
PHO-QUINT4-24DC-5A,4046356985413,QUINT4 Switched Power Supply 24V 5A,Phoenix Contact,195.00,24V DC,5A,36x130x125mm,1.32 lbs,IP20,Power Supplies
SCK-W16-IO-LINK,4047084439056,W16 Photoelectric Sensor LineSpot,SICK,185.00,10-30V DC,100mA,20x55x42mm,0.11 lbs,IP67,Sensors
DAN-VLT-FC302-3KW,5702427891340,Danfoss VLT AutomationDrive 3.0 kW,Danfoss Drives,680.00,380-480V,7.2A,90x268x205mm,9.9 lbs,IP20,VFDs
WAG-221-415-LEVER,4050821808466,WAGO 221 Splicing Connector 5-Wire,WAGO,1.20,450V,32A,29x8x18mm,0.008 lbs,IP20,Terminal Blocks`;

  const handleFileUpload = async (content: string, name: string) => {
    try {
      setLoading(true);
      setFileContent(content);
      setFilename(name);

      const uploadRes = await fetch("/api/ingestion/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, filename: name }),
      });
      const uploadJson = await uploadRes.json();

      if (!uploadJson.success) {
        alert(`Upload error: ${uploadJson.error}`);
        return;
      }

      setHeaders(uploadJson.headers);
      setSampleRows(uploadJson.sampleRows);
      setRawData(uploadJson.rawData);

      const mapRes = await fetch("/api/ingestion/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: uploadJson.headers,
          sampleRows: uploadJson.sampleRows,
        }),
      });
      const mapJson = await mapRes.json();

      if (mapJson.success) {
        setMappings(mapJson.mappings);
        setCanonicalFields(mapJson.canonicalFields || []);
        setStep(2);
      }
    } catch (e: any) {
      alert(`Ingestion error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (index: number, newTarget: string) => {
    const updated = [...mappings];
    updated[index].targetField = newTarget;
    updated[index].userOverridden = true;
    setMappings(updated);
  };

  const handleCommitImport = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ingestion/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawRows: rawData,
          mappings,
          supplierId: isSupplier && currentUser.supplierId ? currentUser.supplierId : selectedSupplierId,
          requestedBy: currentUser.name,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setImportResult(json);
        setStep(3);
      } else {
        alert(`Commit error: ${json.error}`);
      }
    } catch (e: any) {
      alert(`Commit failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Multi-Supplier Ingestion Hub</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Ingest raw CSV/Excel supplier catalogs with automated Gemini AI field mapping and validation
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg text-xs">
          <span className={`px-2.5 py-1 rounded-md font-medium transition-all ${step === 1 ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-500"}`}>
            1. Upload
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className={`px-2.5 py-1 rounded-md font-medium transition-all ${step === 2 ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-500"}`}>
            2. AI Mapping
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className={`px-2.5 py-1 rounded-md font-medium transition-all ${step === 3 ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-500"}`}>
            3. Summary
          </span>
        </div>
      </div>

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-10 rounded-2xl bg-zinc-900/40 border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 transition-all text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-200">Upload Supplier Catalog Spreadsheet</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                Upload CSV or TSV supplier catalogs. Our AI automatically identifies columns, resolves ETIM standards, and scores confidence.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <label className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 cursor-pointer transition-all inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Select File from Computer</span>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        handleFileUpload(evt.target?.result as string, file.name);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>

              <button
                onClick={() => handleFileUpload(sampleCsvData, "sample_industrial_catalog.csv")}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-sm font-medium text-zinc-300 border border-zinc-700/60 transition-colors inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Load Sample Supplier CSV (5 SKUs)</span>
              </button>
            </div>

            {loading && (
              <div className="pt-2 text-xs text-indigo-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing CSV columns and schema taxonomy...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: AI Column Mapping */}
      {step === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-200 font-mono">{filename}</div>
                <div className="text-xs text-zinc-500">
                  {headers.length} Source Columns · {rawData.length} Product Rows
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700/60 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCommitImport}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
              >
                <span>Commit Catalog Ingestion</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mapping Table */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden shadow-lg">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="p-3.5">Source Header</th>
                  <th className="p-3.5">Sample Values</th>
                  <th className="p-3.5">Target Field</th>
                  <th className="p-3.5">AI Confidence</th>
                  <th className="p-3.5">Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {mappings.map((m, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3.5 font-mono text-xs font-semibold text-zinc-200">{m.sourceHeader}</td>
                    <td className="p-3.5 font-mono text-zinc-400 text-xs max-w-xs truncate">
                      {m.sampleValues?.join(" | ") || "—"}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={m.targetField}
                        onChange={(e) => handleMappingChange(idx, e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                      >
                        <option value="sku">sku (SKU / Part Number) *</option>
                        <option value="gtin">gtin (GTIN Barcode GS1) *</option>
                        <option value="title">title (Product Name) *</option>
                        <option value="description">description (Overview)</option>
                        <option value="brand">brand (Manufacturer) *</option>
                        <option value="price">price (Unit Price USD) *</option>
                        <option value="category">category (Product Type)</option>
                        <option value="voltage_rating">voltage_rating (Rated Voltage)</option>
                        <option value="current_rating">current_rating (Amperage)</option>
                        <option value="dimensions">dimensions (Dimensions)</option>
                        <option value="weight">weight (Mass / Weight)</option>
                        <option value="ip_rating">ip_rating (IP Protection)</option>
                        <option value={`attr_${m.sourceHeader.toLowerCase()}`}>
                          attr_{m.sourceHeader.toLowerCase()} (Custom Spec)
                        </option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-1 rounded text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400">
                        {m.confidenceScore}%
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-400 text-xs max-w-xs">{m.aiReasoning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 3: Summary */}
      {step === 3 && importResult && (
        <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Catalog Batch Ingestion Completed</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Successfully processed and mapped raw supplier rows into structured catalog product records.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs uppercase text-zinc-500">Imported Records</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{importResult.importedCount}</div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs uppercase text-zinc-500">Skipped (Duplicates)</span>
              <div className="text-2xl font-bold font-mono text-zinc-400 mt-1">{importResult.skippedCount}</div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs uppercase text-zinc-500">Total Rows</span>
              <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">{importResult.totalRows}</div>
            </div>
          </div>

          {importResult.errors && importResult.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
              <div className="font-semibold">Ingestion Notices:</div>
              {importResult.errors.map((err: string, i: number) => (
                <div key={i} className="text-xs text-amber-400 font-mono">
                  • {err}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/products"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all inline-flex items-center gap-2"
            >
              <Boxes className="w-4 h-4" />
              <span>View Ingested Products</span>
            </Link>
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 border border-zinc-700/60 transition-colors"
            >
              Ingest Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
