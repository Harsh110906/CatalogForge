import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const jobs = await prisma.feedDeliveryJob.findMany({
      include: {
        feed: {
          select: {
            id: true,
            name: true,
            protocol: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    console.error("GET /api/feeds/jobs error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
