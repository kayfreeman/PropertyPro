import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const profile = await db.identityProfile.findUnique({
      where: { id },
      include: {
        credentials: { orderBy: { createdAt: "desc" } },
        evidence: { orderBy: { createdAt: "desc" } },
        verifications: { orderBy: { createdAt: "desc" } },
        complianceChecks: { orderBy: { createdAt: "desc" } },
        riskScores: { orderBy: { createdAt: "desc" } },
        propertyApps: {
          orderBy: { submittedAt: "desc" },
          include: {
            property: true,
          },
        },
        auditLogs: {
          orderBy: { timestamp: "desc" },
          take: 20,
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Identity profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ identity: profile });
  } catch (error) {
    console.error("Identity GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch identity profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check profile exists
    const existing = await db.identityProfile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Identity profile not found" },
        { status: 404 }
      );
    }

    // Build update data from allowed fields
    const allowedFields = [
      "firstName",
      "lastName",
      "phone",
      "dateOfBirth",
      "nationality",
      "trustLevel",
      "trustScore",
      "status",
      "consentGiven",
      "gdprCompliant",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const profile = await db.identityProfile.update({
      where: { id },
      data: updateData,
      include: {
        credentials: true,
        evidence: true,
        verifications: true,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        profileId: id,
        action: "PROFILE_UPDATED",
        performedBy: "api",
        resource: "IdentityProfile",
        resourceId: id,
        details: JSON.stringify({ updatedFields: Object.keys(updateData) }),
      },
    });

    return NextResponse.json({ identity: profile });
  } catch (error) {
    console.error("Identity PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update identity profile" },
      { status: 500 }
    );
  }
}
