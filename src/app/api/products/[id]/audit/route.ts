import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const [auditLogs, versions, product] = await Promise.all([
      prisma.auditLog.findMany({
        where: { productId: id },
        orderBy: { timestamp: "desc" },
      }),
      prisma.productVersion.findMany({
        where: { productId: id },
        orderBy: { versionNumber: "desc" },
      }),
      prisma.product.findUnique({
        where: { id },
        select: { id: true, sku: true, title: true, status: true, updatedAt: true },
      }),
    ]);

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product,
      auditLogs,
      versions,
    });
  } catch (error: any) {
    console.error("GET /api/products/[id]/audit error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
