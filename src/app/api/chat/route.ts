import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const query = (message || "").toLowerCase().trim();

    // Pre-built query templates for reliable demo responses
    let reply = "";

    // GTIN queries
    if (query.includes("gtin") || query.includes("barcode") || query.includes("missing gtin")) {
      const total = await prisma.product.count();
      const missingGtin = await prisma.product.count({ where: { OR: [{ gtin: null }, { gtin: "" }] } });
      const withGtin = total - missingGtin;
      reply = `📊 **GTIN Status**\n\nOut of ${total} products:\n• ${withGtin} have a valid GTIN barcode\n• ${missingGtin} are missing GTINs\n\nProducts cannot be published without a GTIN. You can fix this in the Product Editor or use AI Auto-Fill in the Compliance Center.`;
    }
    // Compliance queries
    else if (query.includes("compliance") || query.includes("acp") || query.includes("ucp") || query.includes("fill rate")) {
      const products = await prisma.product.findMany({ select: { acpFillRate: true, ucpFillRate: true, agentVisibilityTier: true } });
      const avgAcp = products.reduce((s, p) => s + (p.acpFillRate || 0), 0) / (products.length || 1);
      const avgUcp = products.reduce((s, p) => s + (p.ucpFillRate || 0), 0) / (products.length || 1);
      const trusted = products.filter(p => p.agentVisibilityTier === "TRUSTED").length;
      const penalized = products.filter(p => p.agentVisibilityTier === "PENALIZED").length;
      const invisible = products.filter(p => p.agentVisibilityTier === "INVISIBLE").length;
      reply = `🛡️ **2026 Agentic Commerce Compliance**\n\n• Average ACP Fill Rate: ${avgAcp.toFixed(1)}%\n• Average UCP Fill Rate: ${avgUcp.toFixed(1)}%\n\n**Visibility Tiers:**\n• Trusted (>95%): ${trusted} products\n• Penalized (80-95%): ${penalized} products\n• Invisible (<80%): ${invisible} products\n\nVisit the Compliance Center to run AI Auto-Fill and push feeds.`;
    }
    // Supplier queries
    else if (query.includes("supplier") || query.includes("quality") || query.includes("lowest")) {
      const suppliers = await prisma.supplier.findMany({ orderBy: { qualityScore: "asc" }, take: 4, include: { _count: { select: { products: true } } } });
      const lines = suppliers.map((s, i) => `${i + 1}. **${s.name}** (${s.code}) — Score: ${s.qualityScore.toFixed(1)}%, ${s._count.products} SKUs, Trust: ${s.trustLevel}`);
      reply = `🏢 **Supplier Quality Rankings (Lowest First)**\n\n${lines.join("\n")}\n\nSuppliers on PROBATION require manual review before catalog approval.`;
    }
    // Validation / issues
    else if (query.includes("validation") || query.includes("issue") || query.includes("error") || query.includes("problem")) {
      const total = await prisma.validationIssue.count({ where: { resolved: false } });
      const critical = await prisma.validationIssue.count({ where: { resolved: false, severity: "CRITICAL" } });
      const errors = await prisma.validationIssue.count({ where: { resolved: false, severity: "ERROR" } });
      const warnings = await prisma.validationIssue.count({ where: { resolved: false, severity: "WARNING" } });
      reply = `⚠️ **Validation Issues Summary**\n\n• Total unresolved: ${total}\n• Critical: ${critical}\n• Errors: ${errors}\n• Warnings: ${warnings}\n\nVisit the Validation page to auto-fix issues or inspect them individually.`;
    }
    // Product count / catalog
    else if (query.includes("product") || query.includes("catalog") || query.includes("sku") || query.includes("how many")) {
      const total = await prisma.product.count();
      const published = await prisma.product.count({ where: { status: "PUBLISHED" } });
      const draft = await prisma.product.count({ where: { status: "DRAFT" } });
      const review = await prisma.product.count({ where: { status: "REVIEW" } });
      reply = `📦 **Catalog Overview**\n\n• Total products: ${total}\n• Published: ${published}\n• In Review: ${review}\n• Drafts: ${draft}\n\nUse the Products page to search, filter, and manage your catalog.`;
    }
    // Enrich / AI
    else if (query.includes("enrich") || query.includes("ai") || query.includes("generate")) {
      reply = `✨ **AI Enrichment**\n\nCatalogForge uses Gemini AI + industrial heuristics to:\n\n• Generate SEO-optimized titles & descriptions\n• Classify products into ETIM 9.0 / eCl@ss taxonomies\n• Create 3-5 technical highlights and Q&A pairs\n• Auto-fill ACP & UCP commerce metadata\n\nYou can enrich individual products from the Product Editor, or use Bulk Enrich from the Products table.`;
    }
    // Fallback
    else {
      reply = `I can help you with:\n\n• **Catalog stats** — "How many products are in the catalog?"\n• **GTIN status** — "How many products are missing GTINs?"\n• **Compliance** — "Show catalog compliance summary"\n• **Suppliers** — "Which suppliers have the lowest quality?"\n• **Validation** — "Are there any critical issues?"\n• **AI Enrichment** — "How does enrichment work?"\n\nTry one of these, or ask about a specific product SKU!`;
    }

    return NextResponse.json({ success: true, reply });
  } catch (error: any) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json({ success: false, reply: "An error occurred. Please try again." }, { status: 500 });
  }
}
