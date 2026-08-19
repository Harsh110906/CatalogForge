import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callPythonService } from "@/lib/python-client";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { jsonLd } = body;

    if (!jsonLd || typeof jsonLd !== "string") {
      return NextResponse.json({ success: false, error: "Schema.org JSON-LD snippet is required." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { supplier: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    const pythonResp: any = await callPythonService("/compliance/schema-diff", {
      jsonLd,
      product,
    });

    if (pythonResp && pythonResp.success && pythonResp.data) {
      return NextResponse.json({ success: true, diff: pythonResp.data });
    }

    // Fallback JSON-LD parser
    try {
      const parsed = JSON.parse(jsonLd.replace(/```json|```/g, "").trim());
      const schemaName = parsed.name || parsed.title;
      const schemaGtin = parsed.gtin13 || parsed.gtin || parsed.gtin14;
      const schemaSku = parsed.sku || parsed.mpn;
      const schemaPrice = parsed.offers?.price;

      const matches = [];
      const mismatches = [];

      if (schemaName && schemaName.toLowerCase() === product.title.toLowerCase()) {
        matches.push({ field: "name", value: product.title, status: "CONSISTENT" });
      } else if (schemaName) {
        mismatches.push({
          field: "name",
          productValue: product.title,
          schemaValue: schemaName,
          recommendation: "Title text differs slightly between catalog and Schema.org markup.",
        });
      }

      if (schemaGtin && String(schemaGtin).trim() === String(product.gtin || "").trim()) {
        matches.push({ field: "gtin", value: String(product.gtin), status: "CONSISTENT" });
      } else if (schemaGtin) {
        mismatches.push({
          field: "gtin",
          productValue: String(product.gtin || "None"),
          schemaValue: String(schemaGtin),
          recommendation: "GTIN barcode identity divergence detected.",
        });
      }

      return NextResponse.json({
        success: true,
        diff: {
          success: true,
          consistencyScore: mismatches.length === 0 ? 100.0 : 75.0,
          matches,
          mismatches,
          missingInSchema: [],
          missingInProduct: [],
        },
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `JSON Parse error: ${e.message}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("POST /api/products/[id]/schema-check error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
