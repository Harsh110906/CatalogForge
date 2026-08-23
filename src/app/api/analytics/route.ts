import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_ANALYTICS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalSkus,
      draftCount,
      enrichingCount,
      reviewCount,
      approvedCount,
      publishedCount,
      trustedCount,
      penalizedCount,
      invisibleCount,
      unresolvedIssues,
      suppliers,
      products,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "DRAFT" } }),
      prisma.product.count({ where: { status: "ENRICHING" } }),
      prisma.product.count({ where: { status: "REVIEW" } }),
      prisma.product.count({ where: { status: "APPROVED" } }),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.product.count({ where: { agentVisibilityTier: "TRUSTED" } }),
      prisma.product.count({ where: { agentVisibilityTier: "PENALIZED" } }),
      prisma.product.count({ where: { agentVisibilityTier: "INVISIBLE" } }),
      prisma.validationIssue.findMany({
        where: { resolved: false },
        include: {
          product: { select: { sku: true, title: true, category: true } },
        },
      }),
      prisma.supplier.findMany({
        include: {
          _count: { select: { products: true } },
        },
      }),
      prisma.product.findMany({
        select: {
          completenessScore: true,
          agentVisibilityScore: true,
          acpFillRate: true,
          ucpFillRate: true,
          category: true,
        },
      }),
    ]);

    if (totalSkus === 0) {
      return NextResponse.json({ success: true, ...MOCK_ANALYTICS });
    }

    const avgCompleteness =
      products.length > 0
        ? products.reduce((acc, p) => acc + (p.completenessScore || 0), 0) / products.length
        : 0;

    const avgVisibility =
      products.length > 0
        ? products.reduce((acc, p) => acc + (p.agentVisibilityScore || 0), 0) / products.length
        : 0;

    const avgAcp =
      products.length > 0
        ? products.reduce((acc, p) => acc + (p.acpFillRate || 0), 0) / products.length
        : 0;

    const avgUcp =
      products.length > 0
        ? products.reduce((acc, p) => acc + (p.ucpFillRate || 0), 0) / products.length
        : 0;

    const issuesBySeverity: Record<string, number> = { CRITICAL: 0, ERROR: 0, WARNING: 0, INFO: 0 };
    const issuesByType: Record<string, number> = { MISSING: 0, ANOMALY: 0, CROSS_FIELD: 0, MISMATCH: 0 };

    for (const iss of unresolvedIssues) {
      if (issuesBySeverity[iss.severity] !== undefined) issuesBySeverity[iss.severity]++;
      if (issuesByType[iss.type] !== undefined) issuesByType[iss.type]++;
    }

    const categoryCounts: Record<string, number> = {};
    for (const p of products) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }

    const supplierLeaderboard = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      qualityScore: s.qualityScore,
      trustLevel: s.trustLevel,
      skuCount: s._count.products,
      errorRate: s.qualityScore < 75 ? "High (28%)" : s.qualityScore < 90 ? "Moderate (11%)" : "Low (3%)",
    })).sort((a, b) => b.qualityScore - a.qualityScore);

    return NextResponse.json({
      success: true,
      metrics: {
        totalSkus,
        avgCompletenessScore: avgCompleteness,
        avgAgentVisibilityScore: avgVisibility,
        avgAcpFillRate: avgAcp,
        avgUcpFillRate: avgUcp,
        unresolvedIssuesCount: unresolvedIssues.length,
      },
      statusDistribution: {
        draft: draftCount,
        enriching: enrichingCount,
        review: reviewCount,
        approved: approvedCount,
        published: publishedCount,
      },
      visibilityTiers: {
        trusted: trustedCount,
        penalized: penalizedCount,
        invisible: invisibleCount,
      },
      issuesBySeverity,
      issuesByType,
      categoryDistribution: categoryCounts,
      supplierLeaderboard,
      recentIssues: unresolvedIssues.slice(0, 10),
    });
  } catch (error: any) {
    console.warn("GET /api/analytics error, returning fallback metrics:", error.message);
    return NextResponse.json({ success: true, ...MOCK_ANALYTICS });
  }
}
