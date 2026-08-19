import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json"; // json, csv

    const feed = await prisma.feed.findUnique({
      where: { id },
    });

    if (!feed) {
      return NextResponse.json({ success: false, error: "Feed not found." }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { status: { in: ["APPROVED", "PUBLISHED"] } },
      include: { supplier: true },
    });

    let exportData: any[] = [];

    if (feed.protocol === "ACP") {
      // Format to OpenAI/Stripe Agentic Commerce Protocol standards
      exportData = products.map((p) => {
        const acp = p.acpData ? JSON.parse(p.acpData) : {};
        const images = p.images ? JSON.parse(p.images) : [];
        return {
          item_id: p.sku,
          gtin: p.gtin || "",
          title: p.title,
          description: p.description || "",
          url: acp.url || `https://catalog.industrial-supply.io/p/${p.sku}`,
          brand: p.brand || "",
          image_url: images[0] || "",
          price: p.price || 0,
          currency: p.currency || "USD",
          availability: p.availability || "in_stock",
          seller_name: acp.seller_name || "Authorized Industrial Supply Direct",
          seller_url: acp.seller_url || "https://industrial-supply.io",
          return_policy: acp.return_policy || "30-Day Standard Return Policy",
          seller_privacy_policy: acp.seller_privacy_policy || "https://industrial-supply.io/privacy",
          seller_tos: acp.seller_tos || "https://industrial-supply.io/terms",
        };
      });
    } else {
      // Format to Google Universal Commerce Protocol (UCP)
      exportData = products.map((p) => {
        const ucp = p.ucpData ? JSON.parse(p.ucpData) : {};
        const attrs = p.attributes ? JSON.parse(p.attributes) : {};
        return {
          id: p.sku,
          gtin: p.gtin || "",
          title: p.title,
          description: p.description || "",
          brand: p.brand || "",
          product_category: p.category,
          price: `${p.price || 0} ${p.currency || "USD"}`,
          availability: p.availability || "in_stock",
          condition: p.condition || "new",
          shipping_weight: ucp.shipping_weight || attrs.weight || "0.5 kg",
          shipping_dimensions: ucp.shipping_dimensions || attrs.dimensions || "100x100x50 mm",
          google_product_category: ucp.google_product_category || "Business & Industrial > Automation",
        };
      });
    }

    // Record export history
    await prisma.feedExportHistory.create({
      data: {
        feedId: id,
        fillRatePercent: feed.fillRatePercent || 90.0,
        itemsCount: exportData.length,
        downloadUrl: `/api/feeds/${id}/download?format=${format}`,
        generatedBy: "System Export Engine",
      },
    });

    if (format === "csv") {
      const csvString = Papa.unparse(exportData);
      return new NextResponse(csvString, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${feed.protocol.toLowerCase()}_feed_${Date.now()}.csv"`,
        },
      });
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${feed.protocol.toLowerCase()}_feed_${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/feeds/[id]/download error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
