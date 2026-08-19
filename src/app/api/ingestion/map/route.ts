import { NextRequest, NextResponse } from "next/server";
import { callPythonService } from "@/lib/python-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { headers, sampleRows } = body;

    if (!Array.isArray(headers) || headers.length === 0) {
      return NextResponse.json({ success: false, error: "Headers array is required." }, { status: 400 });
    }

    const pyResp: any = await callPythonService("/ingestion/smart-mapping", {
      headers,
      sampleRows: sampleRows || [],
    });

    if (pyResp && pyResp.success && pyResp.mappings) {
      return NextResponse.json({
        success: true,
        mappings: pyResp.mappings,
        canonicalFields: pyResp.canonicalFields,
      });
    }

    // Fallback heuristic mapper
    const mappings = headers.map((header) => {
      const h = header.toLowerCase();
      let target = `attr_${h.replace(/[^a-z0-9]/g, "_")}`;
      let confidence = 70.0;
      let reasoning = "Preserved as custom technical attribute.";

      if (h.includes("sku") || h.includes("part") || h.includes("item_id")) {
        target = "sku";
        confidence = 98.0;
        reasoning = "Matches standard SKU/part number pattern.";
      } else if (h.includes("gtin") || h.includes("barcode") || h.includes("upc") || h.includes("ean")) {
        target = "gtin";
        confidence = 99.0;
        reasoning = "Matches GS1 GTIN barcode identifier specification.";
      } else if (h.includes("title") || h.includes("name")) {
        target = "title";
        confidence = 95.0;
        reasoning = "Mapped to primary product title.";
      } else if (h.includes("desc")) {
        target = "description";
        confidence = 92.0;
        reasoning = "Mapped to product description.";
      } else if (h.includes("brand") || h.includes("mfg") || h.includes("maker")) {
        target = "brand";
        confidence = 96.0;
        reasoning = "Mapped to manufacturer / brand.";
      } else if (h.includes("price") || h.includes("cost") || h.includes("msrp")) {
        target = "price";
        confidence = 95.0;
        reasoning = "Mapped to commercial selling price.";
      }

      return {
        sourceHeader: header,
        targetField: target,
        confidenceScore: confidence,
        aiReasoning: reasoning,
        sampleValues: (sampleRows || []).slice(0, 3).map((r: any) => String(r[header] || "")),
        userOverridden: false,
      };
    });

    return NextResponse.json({
      success: true,
      mappings,
      canonicalFields: [
        { key: "sku", label: "SKU / Part Number", required: true },
        { key: "gtin", label: "GTIN Barcode (GS1)", required: true },
        { key: "title", label: "Product Title", required: true },
        { key: "description", label: "Description", required: false },
        { key: "brand", label: "Brand / Manufacturer", required: true },
        { key: "price", label: "Price (USD)", required: true },
        { key: "category", label: "Category", required: false },
      ],
    });
  } catch (error: any) {
    console.error("POST /api/ingestion/map error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
