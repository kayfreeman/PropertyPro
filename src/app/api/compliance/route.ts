import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDataScope } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role") as string | null;

    const scope = getDataScope((role as Parameters<typeof getDataScope>[0]) ?? "tenant");

    // partner_user cannot see compliance checks
    if (scope === "partner_only") {
      return NextResponse.json({ complianceChecks: [], total: 0, summary: { byStatus: {}, byType: {}, byRiskRating: {} } });
    }

    // Tenant users with no userId: return empty data (data isolation)
    if (scope === "own" && !userId) {
      return NextResponse.json({ complianceChecks: [], total: 0, summary: { byStatus: {}, byType: {}, byRiskRating: {} } });
    }

    // Tenant users: find their profile first, then filter by that profileId
    let where: Record<string, unknown> = {};
    if (scope === "own" && userId) {
      const profile = await db.identityProfile.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (!profile) {
        return NextResponse.json({ complianceChecks: [], total: 0, summary: { byStatus: {}, byType: {}, byRiskRating: {} } });
      }
      where = { profileId: profile.id };
    }

    const complianceChecks = await db.complianceCheck.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            nationality: true,
            status: true,
          },
        },
      },
    });

    // Summary statistics
    const totalChecks = complianceChecks.length;
    const statusBreakdown = await db.complianceCheck.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    });
    const typeBreakdown = await db.complianceCheck.groupBy({
      by: ["checkType"],
      where,
      _count: { checkType: true },
    });
    const riskBreakdown = await db.complianceCheck.groupBy({
      by: ["riskRating"],
      where,
      _count: { riskRating: true },
    });

    return NextResponse.json({
      complianceChecks,
      total: totalChecks,
      summary: {
        byStatus: Object.fromEntries(
          statusBreakdown.map((s) => [s.status, s._count.status])
        ),
        byType: Object.fromEntries(
          typeBreakdown.map((t) => [t.checkType, t._count.checkType])
        ),
        byRiskRating: Object.fromEntries(
          riskBreakdown.map((r) => [r.riskRating, r._count.riskRating])
        ),
      },
    });
  } catch (error) {
    console.error("Compliance GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance checks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId, checkType, checkProvider } = body;

    if (!profileId || !checkType) {
      return NextResponse.json(
        { error: "profileId and checkType are required" },
        { status: 400 }
      );
    }

    // Validate profile exists
    const profile = await db.identityProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "Identity profile not found" },
        { status: 404 }
      );
    }

    // Validate check type
    const validTypes = [
      "aml",
      "kyc",
      "cdd",
      "edd",
      "sanctions",
      "pep",
      "adverse_media",
      "right_to_rent",
    ];
    if (!validTypes.includes(checkType)) {
      return NextResponse.json(
        { error: `Invalid checkType. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const complianceCheck = await db.complianceCheck.create({
      data: {
        profileId,
        checkType,
        status: "pending",
        riskRating: "low",
        checkProvider: checkProvider || null,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        profileId,
        action: "COMPLIANCE_CHECK_CREATED",
        performedBy: "api",
        resource: "ComplianceCheck",
        resourceId: complianceCheck.id,
        details: JSON.stringify({ checkType }),
      },
    });

    return NextResponse.json({ complianceCheck }, { status: 201 });
  } catch (error) {
    console.error("Compliance POST error:", error);
    return NextResponse.json(
      { error: "Failed to create compliance check" },
      { status: 500 }
    );
  }
}
