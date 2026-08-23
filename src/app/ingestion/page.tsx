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
          supplierId: selectedSupplierId || currentUser.supplierId,
          importedBy: currentUser.name,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setImportResult(json);
        setStep(3);
      } else {
        alert(`Import error: ${json.error}`);
      }
    } catch (e: any) {
      alert(`Commit error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Multi-Supplier Ingestion Hub</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingest raw CSV/Excel supplier catalogs with automated Gemini AI field mapping and validation
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1.5 rounded-full text-xs font-semibold shadow-2xs">
          <span className={`px-3 py-1 rounded-full transition-all ${step === 1 ? "bg-[#0052ff] text-white shadow-xs" : "text-slate-400"}`}>
            1. Upload
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={`px-3 py-1 rounded-full transition-all ${step === 2 ? "bg-[#0052ff] text-white shadow-xs" : "text-slate-400"}`}>
            2. AI Mapping
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={`px-3 py-1 rounded-full transition-all ${step === 3 ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400"}`}>
            3. Summary
          </span>
        </div>
      </div>

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-12 rounded-3xl bg-white border-2 border-dashed border-blue-200 hover:border-[#0052ff] transition-all text-center space-y-5 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0052ff] flex items-center justify-center mx-auto text-xl shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Upload Supplier Catalog Spreadsheet</h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed font-normal">
                Upload CSV or TSV supplier catalogs. Our AI automatically identifies columns, resolves ETIM standards, and scores confidence.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <label className="px-6 py-3 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 cursor-pointer transition-all inline-flex items-center gap-2">
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
                className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#0052ff]" />
                <span>Load Sample Supplier CSV (5 SKUs)</span>
              </button>
            </div>

            {loading && (
              <div className="pt-3 text-xs text-[#0052ff] font-semibold flex items-center justify-center gap-2">
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
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0052ff] flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 font-mono">{filename}</div>
                <div className="text-xs text-slate-500 font-medium">
                  {headers.length} Source Columns · {rawData.length} Product Rows
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleCommitImport}
                disabled={loading}
                className="px-6 py-2 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Commit Import</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mappings Table Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">AI Field Mapping Review</h3>
            <div className="space-y-3">
              {mappings.map((m, idx) => (
                <div
                  key={m.sourceHeader}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="font-mono text-xs font-bold text-slate-900">{m.sourceHeader}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs font-mono">
                      Sample: {sampleRows[0]?.[m.sourceHeader] || "N/A"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-slate-400">→</span>
                    <select
                      value={m.targetField}
                      onChange={(e) => handleMappingChange(idx, e.target.value)}
                      className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0052ff]"
                    >
                      {canonicalFields.map((cf: any) => (
                        <option key={cf.name} value={cf.name}>
                          {cf.label} ({cf.name})
                        </option>
                      ))}
                    </select>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      {m.confidenceScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Summary */}
      {step === 3 && importResult && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Catalog Ingestion Successful!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Imported {importResult.importedCount} products into the workspace queue.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/products"
              className="px-6 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all"
            >
              View Products
            </Link>
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all"
            >
              Upload Another CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
