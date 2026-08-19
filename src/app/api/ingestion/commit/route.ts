import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawRows, mappings, supplierId, requestedBy = "Supplier Ingestion" } = body;

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json({ success: false, error: "rawRows array is required." }, { status: 400 });
    }

    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ success: false, error: "Organization not found." }, { status: 500 });
    }

    let targetSupplierId = supplierId;
    if (!targetSupplierId) {
      const sup = await prisma.supplier.findFirst();
      targetSupplierId = sup?.id;
    }

    const mappingLookup: Record<string, string> = {};
    for (const m of mappings || []) {
      if (m.sourceHeader && m.targetField) {
        mappingLookup[m.sourceHeader] = m.targetField;
      }
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const createdSkus: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      try {
        let sku = "";
        let gtin: string | null = null;
        let title = "";
        let description: string | null = null;
        let brand: string | null = null;
        let category = "General Industrial";
        let price: number | null = null;
        const customAttributes: Record<string, any> = {};

        for (const [colHeader, val] of Object.entries(row)) {
          const target = mappingLookup[colHeader] || colHeader.toLowerCase();
          const strVal = val !== null && val !== undefined ? String(val).trim() : "";

          if (!strVal) continue;

          if (target === "sku") {
            sku = strVal;
          } else if (target === "gtin") {
            gtin = strVal;
          } else if (target === "title") {
            title = strVal;
          } else if (target === "description") {
            description = strVal;
          } else if (target === "brand") {
            brand = strVal;
          } else if (target === "category") {
            category = strVal;
          } else if (target === "price") {
            const num = parseFloat(strVal.replace(/[^0-9.]/g, ""));
            if (!isNaN(num)) price = num;
          } else {
            customAttributes[target] = strVal;
          }
        }

        if (!sku) {
          sku = `IMP-SKU-${Date.now()}-${i + 1}`;
        }
        if (!title) {
          title = `${brand || "Industrial"} Product ${sku}`;
        }

        // Check if SKU exists
        const existing = await prisma.product.findUnique({ where: { sku } });
        if (existing) {
          skippedCount++;
          errors.push(`Row ${i + 1}: SKU '${sku}' already exists in catalog. Skipped duplicate.`);
          continue;
        }

        const newProd = await prisma.product.create({
          data: {
            sku,
            gtin,
            title,
            description,
            brand,
            category,
            price,
            currency: "USD",
            status: "DRAFT",
            completenessScore: 65.0,
            agentVisibilityScore: gtin ? 75.0 : 50.0,
            agentVisibilityTier: "INVISIBLE",
            acpFillRate: gtin ? 75.0 : 50.0,
            ucpFillRate: gtin ? 75.0 : 50.0,
            attributes: JSON.stringify(customAttributes),
            images: JSON.stringify([
              "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
            ]),
            organizationId: org.id,
            supplierId: targetSupplierId,
          },
        });

        // Create AttributeField entries
        for (const [k, v] of Object.entries(customAttributes)) {
          await prisma.attributeField.create({
            data: {
              productId: newProd.id,
              fieldName: k,
              value: String(v),
              confidenceScore: 90.0,
              source: "SUPPLIER_IMPORT",
              aiGenerated: false,
              lastEditedBy: requestedBy,
            },
          });
        }

        // Check initial issues
        if (!gtin) {
          await prisma.validationIssue.create({
            data: {
              productId: newProd.id,
              type: "MISSING",
              severity: "CRITICAL",
              fieldName: "gtin",
              message: "Missing Global Trade Item Number (GTIN-12/13/14). Required for ACP/UCP identity matching and publish approval.",
              suggestedFix: "Generate or import valid 12-14 digit GS1 GTIN barcode identifier.",
              resolved: false,
            },
          });
        }

        // Audit Log
        await prisma.auditLog.create({
          data: {
            productId: newProd.id,
            fieldName: "bulk_ingest",
            oldValue: null,
            newValue: sku,
            changedBy: requestedBy,
            reason: `Batch CSV catalog ingestion (${Object.keys(customAttributes).length} custom attributes mapped)`,
          },
        });

        importedCount++;
        createdSkus.push(sku);
      } catch (err: any) {
        skippedCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: rawRows.length,
      importedCount,
      skippedCount,
      createdSkus,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("POST /api/ingestion/commit error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
