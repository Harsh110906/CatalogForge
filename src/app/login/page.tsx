"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Lock, Mail, ArrowRight, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@catalogforge.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await login(email, password);
      if (res.success) {
        router.push("/");
      } else {
        setError(res.error || "Invalid credentials.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#0052ff] flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
              ⚡
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              Catalog<span className="text-[#0052ff]">Forge</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h1>
          <p className="text-sm text-slate-500">
            Industrial Catalog Intelligence & 2026 AI Agent Commerce
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0052ff] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0052ff] focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-[#0052ff] hover:bg-[#0045d8] text-sm font-semibold text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="pt-5 border-t border-slate-100 space-y-2.5">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">1-Click Demo Sign In</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@catalogforge.com");
                  setPassword("admin123");
                }}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-left border border-slate-200/60 transition-all group"
              >
                <div className="font-bold text-slate-900 text-[11px] group-hover:text-[#0052ff]">Administrator</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">admin@catalogforge.com</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("supplier@acme.com");
                  setPassword("supplier123");
                }}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-left border border-slate-200/60 transition-all group"
              >
                <div className="font-bold text-slate-900 text-[11px] group-hover:text-[#0052ff]">Supplier Portal</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">supplier@acme.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#0052ff] hover:underline font-semibold">
            Get started
          </Link>
        </p>
      </div>
    </div>
  );
}
