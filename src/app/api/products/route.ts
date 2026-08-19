import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status");
    const tier = searchParams.get("tier");
    const isBenchmark = searchParams.get("isBenchmark");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { sku: { contains: search } },
        { title: { contains: search } },
        { brand: { contains: search } },
        { gtin: { contains: search } },
        { taxonomyCode: { contains: search } },
      ];
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (supplierId && supplierId !== "ALL") {
      where.supplier = {
        OR: [
          { id: supplierId },
          { code: supplierId },
        ],
      };
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (tier && tier !== "ALL") {
      where.agentVisibilityTier = tier;
    }

    if (isBenchmark === "true") {
      where.isBenchmark = true;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              code: true,
              qualityScore: true,
            },
          },
          validationIssues: {
            where: { resolved: false },
          },
          _count: {
            select: {
              attributeFields: true,
              validationIssues: { where: { resolved: false } },
            },
          },
        },
        orderBy: [{ isBenchmark: "desc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sku, gtin, title, description, category, brand, price, currency, supplierId, attributes } = body;

    if (!sku || !title) {
      return NextResponse.json({ success: false, error: "SKU and Title are required." }, { status: 400 });
    }

    // Default org
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ success: false, error: "No organization found." }, { status: 500 });
    }

    let resolvedSupplierId = supplierId;
    if (!resolvedSupplierId) {
      const firstSupplier = await prisma.supplier.findFirst();
      resolvedSupplierId = firstSupplier?.id;
    }

    const newProduct = await prisma.product.create({
      data: {
        sku,
        gtin: gtin || null,
        title,
        description: description || null,
        category: category || "General Industrial",
        brand: brand || null,
        price: price ? parseFloat(price) : null,
        currency: currency || "USD",
        status: "DRAFT",
        completenessScore: 50.0,
        agentVisibilityScore: 45.0,
        agentVisibilityTier: "INVISIBLE",
        attributes: JSON.stringify(attributes || {}),
        organizationId: org.id,
        supplierId: resolvedSupplierId,
      },
    });

    // Record initial audit log
    await prisma.auditLog.create({
      data: {
        productId: newProduct.id,
        fieldName: "creation",
        oldValue: null,
        newValue: sku,
        changedBy: body.createdBy || "User",
        reason: "Manual product record creation",
      },
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
