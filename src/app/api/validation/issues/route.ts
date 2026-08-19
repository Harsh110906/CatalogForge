import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity");
    const type = searchParams.get("type");
    const resolved = searchParams.get("resolved") === "true";

    const where: any = { resolved };

    if (severity && severity !== "ALL") {
      where.severity = severity;
    }
    if (type && type !== "ALL") {
      where.type = type;
    }

    const issues = await prisma.validationIssue.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            title: true,
            category: true,
            brand: true,
            status: true,
            supplier: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, issues });
  } catch (error: any) {
    console.error("GET /api/validation/issues error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
