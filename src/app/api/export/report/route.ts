import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Collect all workspace metrics
    const products = await prisma.product.findMany({
      include: {
        supplier: true,
        validationIssues: { where: { resolved: false } },
      },
    });

    const suppliers = await prisma.supplier.findMany({
      include: { _count: { select: { products: true } } },
    });

    const feeds = await prisma.feed.findMany({
      include: { deliveryJobs: { take: 5, orderBy: { startedAt: "desc" } } },
    });

    const totalSkus = products.length;
    const publishedCount = products.filter((p) => p.status === "PUBLISHED").length;
    const approvedCount = products.filter((p) => p.status === "APPROVED").length;
    const reviewCount = products.filter((p) => p.status === "REVIEW").length;
    const draftCount = products.filter((p) => p.status === "DRAFT").length;

    const avgCompleteness =
      totalSkus > 0
        ? products.reduce((acc, p) => acc + p.completenessScore, 0) / totalSkus
        : 0;

    const avgVisibility =
      totalSkus > 0
        ? products.reduce((acc, p) => acc + p.agentVisibilityScore, 0) / totalSkus
        : 0;

    const avgAcp =
      totalSkus > 0
        ? products.reduce((acc, p) => acc + p.acpFillRate, 0) / totalSkus
        : 0;

    const avgUcp =
      totalSkus > 0
        ? products.reduce((acc, p) => acc + p.ucpFillRate, 0) / totalSkus
        : 0;

    const trustedCount = products.filter((p) => p.agentVisibilityTier === "TRUSTED").length;
    const penalizedCount = products.filter((p) => p.agentVisibilityTier === "PENALIZED").length;
    const invisibleCount = products.filter((p) => p.agentVisibilityTier === "INVISIBLE").length;

    const totalIssues = products.reduce((acc, p) => acc + p.validationIssues.length, 0);
    const criticalIssues = products.reduce(
      (acc, p) => acc + p.validationIssues.filter((i) => i.severity === "CRITICAL").length,
      0
    );

    const generatedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CatalogForge — Executive Intelligence & Compliance Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #09090b;
      --card-bg: #111113;
      --card-border: #27272a;
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --accent: #6366f1;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      padding: 40px 20px;
      line-height: 1.5;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 24px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: white;
    }
    h1 { font-size: 24px; font-weight: 700; color: var(--text); }
    .subtitle { color: var(--text-muted); font-size: 13px; margin-top: 4px; }
    .date-badge {
      font-size: 12px;
      color: var(--text-muted);
      background: #18181b;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--card-border);
      font-family: 'JetBrains Mono', monospace;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
    }
    .card-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .card-val {
      font-size: 28px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .card-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 6px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tier-bar {
      height: 12px;
      border-radius: 6px;
      background: #27272a;
      display: flex;
      overflow: hidden;
      margin: 16px 0 12px;
    }
    .tier-trusted { background: var(--success); width: ${totalSkus > 0 ? (trustedCount / totalSkus) * 100 : 0}%; }
    .tier-penalized { background: var(--warning); width: ${totalSkus > 0 ? (penalizedCount / totalSkus) * 100 : 0}%; }
    .tier-invisible { background: var(--danger); width: ${totalSkus > 0 ? (invisibleCount / totalSkus) * 100 : 0}%; }
    .legend {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot.trusted { background: var(--success); }
    .dot.penalized { background: var(--warning); }
    .dot.invisible { background: var(--danger); }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 12px;
    }
    th {
      text-align: left;
      padding: 10px 12px;
      font-size: 11px;
      text-transform: uppercase;
      color: var(--text-muted);
      border-bottom: 1px solid var(--card-border);
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #1c1c1f;
    }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .tag {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
      font-family: 'JetBrains Mono', monospace;
    }
    .tag-success { background: rgba(16, 185, 129, 0.15); color: var(--success); }
    .tag-warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
    .tag-danger { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-muted);
    }
    .print-btn {
      background: var(--accent);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
    }
    @media print {
      body { background: white; color: black; padding: 0; }
      .print-btn { display: none; }
      .card { border-color: #ddd; background: #fafafa; }
      .date-badge { background: #eee; border-color: #ccc; }
      th { border-bottom-color: #ccc; }
      td { border-bottom-color: #eee; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="brand">
          <div class="logo">⚡</div>
          <h1>CatalogForge Executive Summary</h1>
        </div>
        <p class="subtitle">Autonomous AI Catalog Enrichment, Engineering Validation & 2026 ACP/UCP Readiness</p>
      </div>
      <div>
        <div class="date-badge">${generatedDate}</div>
      </div>
    </div>

    <!-- 4 KPIs -->
    <div class="grid-4">
      <div class="card">
        <div class="card-title">Total Catalog SKUs</div>
        <div class="card-val" style="color: #6366f1;">${totalSkus}</div>
        <div class="card-sub">${publishedCount} Published · ${approvedCount} Approved</div>
      </div>
      <div class="card">
        <div class="card-title">Data Completeness</div>
        <div class="card-val" style="color: var(--success);">${avgCompleteness.toFixed(1)}%</div>
        <div class="card-sub">ETIM 9.0 Technical Spec Fill</div>
      </div>
      <div class="card">
        <div class="card-title">2026 AI Visibility</div>
        <div class="card-val" style="color: #818cf8;">${avgVisibility.toFixed(1)}%</div>
        <div class="card-sub">ACP: ${avgAcp.toFixed(0)}% · UCP: ${avgUcp.toFixed(0)}%</div>
      </div>
      <div class="card">
        <div class="card-title">Validation Gaps</div>
        <div class="card-val" style="color: ${criticalIssues > 0 ? "var(--danger)" : "var(--success)"};">${totalIssues}</div>
        <div class="card-sub">${criticalIssues} Critical · ${totalIssues - criticalIssues} Warnings</div>
      </div>
    </div>

    <!-- 2026 AI Agentic Commerce Protocol Readiness -->
    <div class="card" style="margin-bottom: 28px;">
      <div class="section-title">2026 Agentic Commerce Readiness Distribution</div>
      <p style="font-size: 12px; color: var(--text-muted);">
        Distribution of catalog SKUs across autonomous AI agent discovery tiers (OpenAI/Stripe ACP + Google UCP).
      </p>
      <div class="tier-bar">
        <div class="tier-trusted" title="Trusted: ${trustedCount}"></div>
        <div class="tier-penalized" title="Penalized: ${penalizedCount}"></div>
        <div class="tier-invisible" title="Invisible: ${invisibleCount}"></div>
      </div>
      <div class="legend">
        <div class="legend-item"><div class="dot trusted"></div> <strong>Trusted (>95%)</strong>: ${trustedCount} SKUs (${totalSkus > 0 ? ((trustedCount / totalSkus) * 100).toFixed(0) : 0}%)</div>
        <div class="legend-item"><div class="dot penalized"></div> <strong>Penalized (80-95%)</strong>: ${penalizedCount} SKUs (${totalSkus > 0 ? ((penalizedCount / totalSkus) * 100).toFixed(0) : 0}%)</div>
        <div class="legend-item"><div class="dot invisible"></div> <strong>Invisible (<80%)</strong>: ${invisibleCount} SKUs (${totalSkus > 0 ? ((invisibleCount / totalSkus) * 100).toFixed(0) : 0}%)</div>
      </div>
    </div>

    <!-- Supplier Data Quality Overview -->
    <div class="card" style="margin-bottom: 28px;">
      <div class="section-title">Supplier Quality & Compliance Scorecard</div>
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Code</th>
            <th>SKU Count</th>
            <th>Quality Score</th>
            <th>Trust Status</th>
          </tr>
        </thead>
        <tbody>
          ${suppliers
            .map(
              (s) => `
            <tr>
              <td><strong>${s.name}</strong></td>
              <td class="mono">${s.code}</td>
              <td class="mono">${s._count.products}</td>
              <td class="mono" style="color: ${
                s.qualityScore >= 90 ? "var(--success)" : s.qualityScore >= 75 ? "var(--warning)" : "var(--danger)"
              }; font-weight: 600;">${s.qualityScore.toFixed(1)}%</td>
              <td><span class="tag ${
                s.trustLevel === "VERIFIED"
                  ? "tag-success"
                  : s.trustLevel === "PROBATION"
                  ? "tag-danger"
                  : "tag-warning"
              }">${s.trustLevel}</span></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <!-- Live Commerce Feeds & Delivery Status -->
    <div class="card" style="margin-bottom: 28px;">
      <div class="section-title">Agent Commerce Feeds & Push Jobs</div>
      <table>
        <thead>
          <tr>
            <th>Protocol</th>
            <th>Items</th>
            <th>Fill Rate</th>
            <th>Last Pushed</th>
            <th>Recent Status</th>
          </tr>
        </thead>
        <tbody>
          ${feeds
            .map((f) => {
              const latestJob = f.deliveryJobs[0];
              return `
            <tr>
              <td><strong>${f.protocol} (${f.name})</strong></td>
              <td class="mono">${f.itemsCount}</td>
              <td class="mono" style="color: var(--accent); font-weight: 600;">${f.fillRatePercent.toFixed(1)}%</td>
              <td class="mono" style="font-size: 12px; color: var(--text-muted);">${
                f.lastPushedAt ? new Date(f.lastPushedAt).toLocaleDateString() : "Never"
              }</td>
              <td><span class="tag ${
                latestJob?.status === "SUCCESS"
                  ? "tag-success"
                  : latestJob?.status === "FAILED"
                  ? "tag-danger"
                  : "tag-warning"
              }">${latestJob ? latestJob.status : "READY"}</span></td>
            </tr>
          `;
            })
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div>Generated automatically by <strong>CatalogForge</strong> · Certified for Enterprise AI Commerce</div>
      <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("GET /api/export/report error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
