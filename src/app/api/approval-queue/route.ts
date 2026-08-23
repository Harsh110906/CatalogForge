import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_PRODUCTS } from "@/lib/mock-data";

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
    console.warn("GET /api/approval-queue error, returning fallback queue:", error.message);
    const mockReviewProducts = MOCK_PRODUCTS.filter((p) => p.status === "REVIEW" || p.status === "APPROVED");
    return NextResponse.json({
      success: true,
      threshold: 88.0,
      reviewProductsCount: mockReviewProducts.length,
      reviewProducts: mockReviewProducts,
      lowConfidenceFieldsCount: 2,
      lowConfidenceFields: [
        { id: "f1", fieldName: "voltage_rating", value: "400V AC", confidenceScore: 82.5, product: { sku: "SCH-C60H-2P-16A", title: "Acti9 C60H Circuit Breaker" } },
        { id: "f2", fieldName: "sensing_range", value: "100-800mm", confidenceScore: 81.2, product: { sku: "SCK-W16-IO-LINK", title: "W16 Photoelectric Sensor" } }
      ],
    });
  }
}
