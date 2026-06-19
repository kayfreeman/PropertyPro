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

// Statuses that count as a finished verification check
const TERMINAL_VERIFICATION_STATUSES = ["verified", "passed", "completed", "rejected", "failed"];

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

    // Build profile update data from allowed fields
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

    // Optional verification-level updates (review actions from the verifier UI)
    const verificationId: string | undefined = body.verificationId;
    const verificationStatus: string | undefined = body.verificationStatus;
    const verifyAllPending: boolean = body.verifyAllPending === true;
    const performedBy: string = typeof body.performedBy === "string" ? body.performedBy : "api";

    const hasProfileUpdate = Object.keys(updateData).length > 0;
    const hasVerificationUpdate = Boolean(verificationId && verificationStatus);

    if (!hasProfileUpdate && !hasVerificationUpdate && !verifyAllPending) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Apply all changes atomically
    await db.$transaction(async (tx) => {
      // Approve/reject a single verification check
      if (hasVerificationUpdate) {
        await tx.verificationRecord.updateMany({
          where: { id: verificationId, profileId: id },
          data: {
            status: verificationStatus!,
            completedAt: TERMINAL_VERIFICATION_STATUSES.includes(verificationStatus!)
              ? new Date()
              : null,
            ...(verificationStatus === "verified" ? { confidence: 100 } : {}),
          },
        });
      }

      // Profile-level "Approve Applicant" — clear all outstanding checks
      if (verifyAllPending) {
        await tx.verificationRecord.updateMany({
          where: { profileId: id, status: { in: ["pending", "in_progress"] } },
          data: { status: "verified", completedAt: new Date(), confidence: 100 },
        });
      }

      if (hasProfileUpdate) {
        await tx.identityProfile.update({ where: { id }, data: updateData });
      }
    });

    // Re-read the fully hydrated profile so the client gets fresh nested data
    const profile = await db.identityProfile.findUnique({
      where: { id },
      include: {
        credentials: true,
        evidence: true,
        verifications: { orderBy: { createdAt: "desc" } },
      },
    });

    // Create audit log — reflect the nature of the change for the regulator-facing trail
    const action =
      verifyAllPending || updateData.status === "verified"
        ? "PROFILE_APPROVED"
        : updateData.status === "rejected"
          ? "PROFILE_REJECTED"
          : hasVerificationUpdate
            ? "VERIFICATION_REVIEWED"
            : "PROFILE_UPDATED";

    await db.auditLog.create({
      data: {
        profileId: id,
        action,
        performedBy,
        resource: "IdentityProfile",
        resourceId: id,
        details: JSON.stringify({
          updatedFields: Object.keys(updateData),
          ...(hasVerificationUpdate ? { verificationId, verificationStatus } : {}),
          ...(verifyAllPending ? { verifyAllPending: true } : {}),
        }),
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
