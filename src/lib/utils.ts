import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency: string = "USD"): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0.0%";
  return `${Number(value).toFixed(1)}%`;
}

export function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
  badge: string;
} {
  if (score >= 95) {
    return {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    };
  }
  if (score >= 80) {
    return {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    };
  }
  return {
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  };
}

export function getTierBadge(tier: string) {
  const t = (tier || "INVISIBLE").toUpperCase();
  if (t === "TRUSTED") {
    return {
      label: "Trusted (2026)",
      color: "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30",
      dot: "bg-emerald-400",
      icon: "ShieldCheck",
    };
  }
  if (t === "PENALIZED") {
    return {
      label: "Penalized (80-95%)",
      color: "bg-amber-950/80 text-amber-400 border border-amber-500/30",
      dot: "bg-amber-400",
      icon: "AlertTriangle",
    };
  }
  return {
    label: "Invisible (<80%)",
    color: "bg-rose-950/80 text-rose-400 border border-rose-500/30",
    dot: "bg-rose-400",
    icon: "EyeOff",
  };
}

export function getStatusBadge(status: string) {
  const s = (status || "DRAFT").toUpperCase();
  switch (s) {
    case "PUBLISHED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "APPROVED":
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "REVIEW":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "ENRICHING":
      return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    default:
      return "bg-slate-700/50 text-slate-400 border-slate-600/30";
  }
}
