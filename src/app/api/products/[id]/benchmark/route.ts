import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { isBenchmark } = body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    if (isBenchmark) {
      // Unset existing benchmarks in this category
      await prisma.product.updateMany({
        where: { category: product.category, isBenchmark: true, id: { not: id } },
        data: { isBenchmark: false },
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isBenchmark: Boolean(isBenchmark) },
    });

    await prisma.auditLog.create({
      data: {
        productId: id,
        fieldName: "isBenchmark",
        oldValue: String(product.isBenchmark),
        newValue: String(isBenchmark),
        changedBy: body.changedBy || "Catalog Admin",
        reason: isBenchmark
          ? `Designated as Golden Standard Benchmark for category '${product.category}'`
          : "Demoted from Golden Standard Benchmark",
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("POST /api/products/[id]/benchmark error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
