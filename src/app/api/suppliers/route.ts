import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_SUPPLIERS } from "@/lib/mock-data";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        products: {
          select: {
            id: true,
            sku: true,
            completenessScore: true,
            agentVisibilityScore: true,
            status: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { qualityScore: "desc" },
    });

    if (!suppliers || suppliers.length === 0) {
      return NextResponse.json({ success: true, suppliers: MOCK_SUPPLIERS });
    }

    const enrichedSuppliers = suppliers.map((s) => {
      const prods = s.products;
      const avgComp = prods.length > 0 ? prods.reduce((a, b) => a + (b.completenessScore || 0), 0) / prods.length : 0;
      const avgVis = prods.length > 0 ? prods.reduce((a, b) => a + (b.agentVisibilityScore || 0), 0) / prods.length : 0;

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        contactEmail: s.contactEmail,
        qualityScore: s.qualityScore,
        trustLevel: s.trustLevel,
        skuCount: s._count.products,
        avgCompleteness: avgComp,
        avgVisibility: avgVis,
      };
    });

    return NextResponse.json({ success: true, suppliers: enrichedSuppliers });
  } catch (error: any) {
    console.warn("GET /api/suppliers error, returning fallback suppliers:", error.message);
    return NextResponse.json({ success: true, suppliers: MOCK_SUPPLIERS });
  }
}
