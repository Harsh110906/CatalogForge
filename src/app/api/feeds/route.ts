import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const feeds = await prisma.feed.findMany({
      include: {
        deliveryJobs: {
          orderBy: { startedAt: "desc" },
          take: 5,
        },
        history: {
          orderBy: { exportedAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const [totalProducts, trustedCount, penalizedCount, invisibleCount] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { agentVisibilityTier: "TRUSTED" } }),
      prisma.product.count({ where: { agentVisibilityTier: "PENALIZED" } }),
      prisma.product.count({ where: { agentVisibilityTier: "INVISIBLE" } }),
    ]);

    const avgScores = await prisma.product.aggregate({
      _avg: {
        acpFillRate: true,
        ucpFillRate: true,
        agentVisibilityScore: true,
      },
    });

    return NextResponse.json({
      success: true,
      feeds,
      stats: {
        totalProducts,
        trustedCount,
        penalizedCount,
        invisibleCount,
        avgAcpFillRate: avgScores._avg.acpFillRate || 0,
        avgUcpFillRate: avgScores._avg.ucpFillRate || 0,
        avgVisibilityScore: avgScores._avg.agentVisibilityScore || 0,
      },
    });
  } catch (error: any) {
    console.error("GET /api/feeds error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
