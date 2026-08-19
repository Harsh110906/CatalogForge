import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (user) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        user,
      });
    }

    // If no user found in cookie session, check if any user exists in DB
    const firstUser = await prisma.user.findFirst({
      include: { organization: true, supplier: true },
    });

    if (firstUser) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        fallbackUser: {
          id: firstUser.id,
          name: firstUser.name,
          email: firstUser.email,
          role: firstUser.role,
          organizationId: firstUser.organizationId,
          organizationName: firstUser.organization.name,
          supplierId: firstUser.supplierId,
          supplierName: firstUser.supplier?.name,
        },
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: false,
      user: null,
    });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
