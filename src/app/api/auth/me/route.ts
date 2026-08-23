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

    try {
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
    } catch (dbErr: any) {
      console.warn("Prisma /api/auth/me error, returning fallback user state:", dbErr.message);
    }

    return NextResponse.json({
      success: true,
      authenticated: false,
      user: null,
      fallbackUser: {
        id: "usr-admin-default",
        name: "Workspace Administrator",
        email: "admin@catalogforge.com",
        role: "ADMIN",
        organizationId: "org-default",
        organizationName: "CatalogForge Enterprise",
      },
    });
  } catch (error: any) {
    console.warn("GET /api/auth/me error, returning fallback state:", error.message);
    return NextResponse.json({
      success: true,
      authenticated: false,
      user: null,
    });
  }
}
