import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const triggeredBy = body.triggeredBy || "Admin User";

    const feed = await prisma.feed.findUnique({
      where: { id },
    });

    if (!feed) {
      return NextResponse.json({ success: false, error: "Feed not found." }, { status: 404 });
    }

    // 1. Create PENDING job
    const job = await prisma.feedDeliveryJob.create({
      data: {
        feedId: id,
        status: "PENDING",
        triggeredBy,
        startedAt: new Date(),
      },
    });

    // 2. Fetch catalog products
    const [totalProducts, approvedProducts, missingGtinCount] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        where: { status: { in: ["APPROVED", "PUBLISHED"] } },
      }),
      prisma.product.count({
        where: {
          status: { in: ["APPROVED", "PUBLISHED"] },
          OR: [{ gtin: null }, { gtin: "" }],
        },
      }),
    ]);

    // Simulate network latency (250ms)
    await new Promise((resolve) => setTimeout(resolve, 250));

    let jobStatus = "SUCCESS";
    let httpStatus = 200;
    let errorMessage: string | null = null;
    let responsePayload: any = null;

    if (approvedProducts.length === 0) {
      jobStatus = "FAILED";
      httpStatus = 400;
      errorMessage = "No approved or published products available in catalog for delivery.";
    } else {
      if (feed.protocol === "ACP") {
        responsePayload = {
          endpoint: "https://agentic-commerce.stripe.com/v1/catalog/deliver",
          protocol: "OpenAI/Stripe ACP 2026",
          status: "DELIVERED_AND_INDEXED",
          batchId: `acp_batch_${Date.now()}`,
          skusIngested: approvedProducts.length,
          trustedSkus: approvedProducts.filter((p) => p.agentVisibilityTier === "TRUSTED").length,
          penalizedSkus: approvedProducts.filter((p) => p.agentVisibilityTier === "PENALIZED").length,
          warning: missingGtinCount > 0 ? `${missingGtinCount} SKUs ingested with visibility penalties due to missing GTIN.` : null,
          latencyMs: 248,
        };
      } else {
        responsePayload = {
          endpoint: "https://merchantapi.googleapis.com/products/v1beta/accounts/ucp-global/products:batch",
          protocol: "Google Universal Commerce Protocol (UCP)",
          status: "SUCCESSFULLY_SYNCHRONIZED",
          feedVersion: "UCP-2026-v2.1",
          itemsCount: approvedProducts.length,
          indexedTiers: {
            trusted: approvedProducts.filter((p) => p.agentVisibilityTier === "TRUSTED").length,
            penalized: approvedProducts.filter((p) => p.agentVisibilityTier === "PENALIZED").length,
          },
          latencyMs: 312,
        };
      }
    }

    // Update job
    const completedJob = await prisma.feedDeliveryJob.update({
      where: { id: job.id },
      data: {
        status: jobStatus,
        httpStatus,
        errorMessage,
        responsePayload: responsePayload ? JSON.stringify(responsePayload) : null,
        completedAt: new Date(),
      },
    });

    // Update feed lastPushedAt
    if (jobStatus === "SUCCESS") {
      await prisma.feed.update({
        where: { id },
        data: {
          lastPushedAt: new Date(),
          itemsCount: approvedProducts.length,
        },
      });
    }

    return NextResponse.json({
      success: jobStatus === "SUCCESS",
      job: completedJob,
      response: responsePayload,
    });
  } catch (error: any) {
    console.error("POST /api/feeds/[id]/push error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
