import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const threshold = parseFloat(searchParams.get("threshold") || "88.0");

    const [reviewProducts, lowConfidenceFields] = await Promise.all([
      prisma.product.findMany({
        where: { status: "REVIEW" },
        include: {
          supplier: true,
          validationIssues: { where: { resolved: false } },
        },
      }),
      prisma.attributeField.findMany({
        where: {
          aiGenerated: true,
          confidenceScore: { lt: threshold },
        },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              title: true,
              category: true,
              supplier: { select: { name: true } },
            },
          },
        },
        take: 30,
      }),
    ]);

    return NextResponse.json({
      success: true,
      threshold,
      reviewProductsCount: reviewProducts.length,
      reviewProducts,
      lowConfidenceFieldsCount: lowConfidenceFields.length,
      lowConfidenceFields,
    });
  } catch (error: any) {
    console.error("GET /api/approval-queue error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
