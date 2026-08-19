import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issueId, applyFix, fixValue } = body;

    if (!issueId) {
      return NextResponse.json({ success: false, error: "issueId is required." }, { status: 400 });
    }

    const issue = await prisma.validationIssue.findUnique({
      where: { id: issueId },
      include: { product: true },
    });

    if (!issue) {
      return NextResponse.json({ success: false, error: "Issue not found." }, { status: 404 });
    }

    // Mark issue resolved
    const resolvedIssue = await prisma.validationIssue.update({
      where: { id: issueId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });

    // If applying fix to product field
    if (applyFix && issue.fieldName) {
      if (issue.fieldName === "gtin") {
        const targetGtin = fixValue || `084${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        await prisma.product.update({
          where: { id: issue.productId },
          data: { gtin: targetGtin },
        });
      }
    }

    return NextResponse.json({ success: true, issue: resolvedIssue });
  } catch (error: any) {
    console.error("POST /api/validation/resolve error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
