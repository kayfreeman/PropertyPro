import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const complianceChecks = await db.complianceCheck.findMany({
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
      _count: { status: true },
    });
    const typeBreakdown = await db.complianceCheck.groupBy({
      by: ["checkType"],
      _count: { checkType: true },
    });
    const riskBreakdown = await db.complianceCheck.groupBy({
      by: ["riskRating"],
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
