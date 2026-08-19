import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callPythonService } from "@/lib/python-client";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { supplier: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    // Call Python validation engine
    const pythonResp: any = await callPythonService("/validate/rules", { product });

    let issues: any[] = [];
    if (pythonResp && pythonResp.success && Array.isArray(pythonResp.issues)) {
      issues = pythonResp.issues;
    } else {
      // Fallback rule checks
      if (!product.gtin) {
        issues.push({
          type: "MISSING",
          severity: "CRITICAL",
          fieldName: "gtin",
          message: "Missing Global Trade Item Number (GTIN-12/13/14). Required for ACP/UCP compliance.",
          suggestedFix: "Assign valid GS1 GTIN barcode identifier.",
        });
      }
    }

    // Check if category has a benchmark product
    const benchmarkProduct = await prisma.product.findFirst({
      where: {
        category: product.category,
        isBenchmark: true,
        id: { not: product.id },
      },
    });

    let benchmarkDiff: any = null;
    if (benchmarkProduct) {
      const benchResp: any = await callPythonService("/validate/benchmark-diff", {
        targetProduct: product,
        benchmarkProduct,
      });
      if (benchResp && benchResp.success) {
        benchmarkDiff = benchResp.diff;
      }
    }

    // Clear unresolved issues and re-insert fresh issues
    await prisma.validationIssue.deleteMany({
      where: { productId: id, resolved: false },
    });

    for (const iss of issues) {
      await prisma.validationIssue.create({
        data: {
          productId: id,
          type: iss.type,
          severity: iss.severity,
          fieldName: iss.fieldName || null,
          message: iss.message,
          suggestedFix: iss.suggestedFix || null,
          resolved: false,
        },
      });
    }

    // Update product with benchmarkDiff snapshot
    const updated = await prisma.product.update({
      where: { id },
      data: {
        benchmarkDiff: benchmarkDiff ? JSON.stringify(benchmarkDiff) : null,
      },
      include: {
        validationIssues: { where: { resolved: false } },
      },
    });

    return NextResponse.json({
      success: true,
      issuesCount: issues.length,
      issues,
      benchmarkDiff,
      product: updated,
    });
  } catch (error: any) {
    console.error("POST /api/products/[id]/validate error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
