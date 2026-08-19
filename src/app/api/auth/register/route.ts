import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, organizationName } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // Get or create organization
    let org = await prisma.organization.findFirst();
    if (organizationName?.trim()) {
      const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      org = await prisma.organization.upsert({
        where: { slug: slug || "default-org" },
        update: { name: organizationName },
        create: {
          name: organizationName,
          slug: slug || `org-${Date.now()}`,
        },
      });
    } else if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "Global Industrial Automation",
          slug: "global-industrial",
        },
      });
    }

    const passwordHash = hashPassword(password);
    const validRole = ["ADMIN", "EDITOR", "SUPPLIER", "VIEWER"].includes(role) ? role : "ADMIN";

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: validRole,
        organizationId: org.id,
      },
      include: {
        organization: true,
      },
    });

    const token = createSessionToken(user.id, user.email, user.role);

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
    });

    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register account." },
      { status: 500 }
    );
  }
}
