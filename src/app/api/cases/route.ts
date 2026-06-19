import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, "case:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const riskLevel = searchParams.get("riskLevel");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;

    // Always firm-scoped (platform_admin can see all)
    if (auth.user.role !== "platform_admin" && auth.user.firmId) {
      where.firmId = auth.user.firmId;
    }

    const [cases, total] = await Promise.all([
      db.case.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          profile: { select: { id: true, firstName: true, lastName: true, email: true, nationality: true, trustScore: true } },
          actions: { orderBy: { performedAt: "desc" }, take: 1 },
          _count: { select: { actions: true } },
        },
      }),
      db.case.count({ where }),
    ]);

    return NextResponse.json({
      cases,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Cases GET error:", error);
    return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, "case:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { profileId, caseType, clientRole } = body;

    if (!caseType || !clientRole) {
      return NextResponse.json({ error: "caseType and clientRole are required" }, { status: 400 });
    }

    if (!auth.user.firmId) {
      return NextResponse.json({ error: "User must belong to a firm to create cases" }, { status: 400 });
    }

    // Generate case reference
    const year = new Date().getFullYear();
    const count = await db.case.count({ where: { firmId: auth.user.firmId } });
    const caseRef = `CASE-${year}-${String(count + 1).padStart(6, "0")}`;

    const newCase = await db.case.create({
      data: {
        firmId: auth.user.firmId,
        caseRef,
        caseType,
        clientRole,
        profileId: profileId || null,
        status: "open",
        currentStep: "identity_verification",
        ownerId: auth.user.id,
      },
    });

    await writeAuditLog({
      caseId: newCase.id,
      profileId: profileId || undefined,
      userId: auth.user.id,
      action: "CASE_CREATED",
      performedBy: auth.user.id,
      resource: "Case",
      resourceId: newCase.id,
      details: { caseRef, caseType, clientRole },
    });

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error) {
    console.error("Cases POST error:", error);
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
  }
}
