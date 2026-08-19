import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, productIds, fieldIds, approvedBy = "Editor" } = body;

    if (!action || (!productIds && !fieldIds)) {
      return NextResponse.json({ success: false, error: "Action and target IDs are required." }, { status: 400 });
    }

    if (productIds && Array.isArray(productIds)) {
      if (action === "approve") {
        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: "APPROVED" },
        });
      } else if (action === "reject") {
        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: "DRAFT" },
        });
      }
    }

    if (fieldIds && Array.isArray(fieldIds)) {
      if (action === "approve") {
        await prisma.attributeField.updateMany({
          where: { id: { in: fieldIds } },
          data: {
            confidenceScore: 99.0,
            source: "HUMAN",
            lastEditedBy: approvedBy,
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: `Action '${action}' applied successfully.` });
  } catch (error: any) {
    console.error("POST /api/approval-queue/action error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
