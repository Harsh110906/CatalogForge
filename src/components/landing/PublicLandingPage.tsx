"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Bot,
  Layers,
  Sparkles,
  CheckCircle2,
  Lock,
  Globe,
  Database,
  Search,
  Check,
} from "lucide-react";

export function PublicLandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      router.push(`/register?email=${encodeURIComponent(email)}`);
    } else {
      router.push("/register");
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* Coinbase-style Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#0052ff] flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
                ⚡
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Catalog<span className="text-[#0052ff]">Forge</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <a href="#features" className="hover:text-[#0052ff] transition-colors">Features</a>
              <a href="#protocols" className="hover:text-[#0052ff] transition-colors">2026 ACP & UCP</a>
              <a href="#enterprise" className="hover:text-[#0052ff] transition-colors">Enterprise</a>
              <a href="#mcp" className="hover:text-[#0052ff] transition-colors">Developers</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#0052ff] hover:bg-[#0045d8] shadow-md shadow-blue-500/20 transition-all"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Coinbase Hero Section */}
      <section className="pt-16 pb-24 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Hero Text */}
        <div className="lg:col-span-6 space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-[#0052ff]">
            <Sparkles className="w-3.5 h-3.5 text-[#0052ff]" />
            <span>Natively Certified for 2026 AI Agent Commerce</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            The future of industrial AI commerce is here.
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed font-normal">
            Transform noisy, fragmented supplier catalogs into structured, validated, and explainable product records that autonomous AI procurement agents trust.
          </p>

          {/* Email Registration Bar */}
          <form onSubmit={handleGetStarted} className="flex flex-col sm:flex-row items-center gap-3 max-w-lg">
            <input
              type="email"
              placeholder="Enter your work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0052ff] focus:bg-white text-sm transition-all"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all whitespace-nowrap"
            >
              Get started
            </button>
          </form>

          <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#0052ff]" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#0052ff]" /> Instant 1-Click Setup</span>
          </div>
        </div>

        {/* Right Hero Graphic Card (Coinbase-style phone/card preview) */}
        <div className="lg:col-span-6">
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0052ff] text-white flex items-center justify-center font-bold text-lg">
                  ⚡
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">Catalog Intelligence Score</div>
                  <div className="text-xs text-slate-500 font-mono">32 Active Industrial SKUs</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold font-mono">
                +98.2% Trusted
              </span>
            </div>

            {/* Live Metrics Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">OpenAI / Stripe ACP</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">94.5%</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">Full Agent Autonomy</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Google UCP Readiness</span>
                <div className="text-2xl font-extrabold text-[#0052ff] mt-1 font-mono">96.2%</div>
                <div className="text-[11px] text-blue-600 font-semibold mt-1">Universal Protocol</div>
              </div>
            </div>

            {/* Sample Item List */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Catalog Feeds</span>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/60 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">SCH-C60H-2P-16A</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs">Schneider Acti9 C60H Circuit Breaker</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0052ff] text-[11px] font-bold font-mono">
                  TRUSTED
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/60 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">DAN-VLT-FC302-3KW</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs">Danfoss VLT AutomationDrive 3.0 kW</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0052ff] text-[11px] font-bold font-mono">
                  TRUSTED
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Grid Section */}
      <section id="features" className="py-20 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for enterprise industrial catalog teams
            </h2>
            <p className="text-slate-600 text-base">
              Everything you need to ingest, validate, enrich, and deliver catalog data to human buyers and autonomous AI shopping agents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052ff] flex items-center justify-center text-xl font-bold">
                🛡️
              </div>
              <h3 className="text-lg font-bold text-slate-900">2026 Agent Standards</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Native compliance scoring for OpenAI/Stripe ACP and Google UCP registries with 1-click delivery push.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                🔍
              </div>
              <h3 className="text-lg font-bold text-slate-900">Deep Explainability</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Full AI provenance tracking, step-by-step reasoning logs, confidence scores, and human override audit trails.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-slate-900">Engineering Validation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated physics sanity checks (P = V * I, IP ratings, operating temp bounds) and Golden Benchmark diffing.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
                🔌
              </div>
              <h3 className="text-lg font-bold text-slate-900">Model Context Protocol</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                JSON-RPC 2.0 endpoint allowing Claude, Cursor, and custom LLM agents to query your catalog in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 text-center space-y-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ready to make your catalog AI-agent ready?
          </h2>
          <p className="text-slate-600 text-base">
            Join enterprise distributors and industrial suppliers using CatalogForge today.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
          >
            Get started now
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 CatalogForge Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-slate-900">Privacy</a>
            <a href="#terms" className="hover:text-slate-900">Terms</a>
            <a href="#security" className="hover:text-slate-900">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
