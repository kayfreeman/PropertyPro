import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPermission, type UserRole } from "@/lib/rbac";

const VALID_PARTNER_TYPES = ["bank", "insurer", "mortgage_provider", "remittance", "employer", "university"];
const VALID_STATUSES = ["active", "suspended", "terminated"];

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  active: ["suspended", "terminated"],
  suspended: ["active", "terminated"],
  terminated: [], // No transitions from terminated
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const partner = await db.partner.findUnique({
      where: { id },
      include: {
        referrals: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: {
          select: { referrals: true, users: true },
        },
      },
    });

    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    // Enrich referrals with profile info
    const referralProfileIds = partner.referrals
      .map((r) => r.profileId)
      .filter((id): id is string => id !== null);

    const referralProfiles = referralProfileIds.length > 0
      ? await db.identityProfile.findMany({
          where: { id: { in: referralProfileIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        })
      : [];

    const profileMap = new Map(referralProfiles.map((p) => [p.id, p]));

    const enrichedPartner = {
      ...partner,
      referrals: partner.referrals.map((referral) => ({
        ...referral,
        profile: referral.profileId
          ? profileMap.get(referral.profileId) || null
          : null,
      })),
    };

    // Get referral stats
    const referralStats = await db.partnerReferral.groupBy({
      by: ["status"],
      where: { partnerId: id },
      _count: { status: true },
    });

    const referralTypeStats = await db.partnerReferral.groupBy({
      by: ["referralType"],
      where: { partnerId: id },
      _count: { referralType: true },
    });

    return NextResponse.json({
      partner: enrichedPartner,
      referenceId: `PTR-${partner.id.slice(-8).toUpperCase()}`,
      stats: {
        totalReferrals: partner._count.referrals,
        linkedUsers: partner._count.users,
        referralsByStatus: Object.fromEntries(
          referralStats.map((r) => [r.status, r._count.status])
        ),
        referralsByType: Object.fromEntries(
          referralTypeStats.map((r) => [r.referralType, r._count.referralType])
        ),
      },
    });
  } catch (error) {
    console.error("Partner GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch partner" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, ...updateFields } = body;

    // RBAC check — only partner_integration_manager and platform_admin can modify partners
    const userRole = (role as UserRole) || "tenant";
    if (!hasPermission(userRole, "partners:manage")) {
      return NextResponse.json(
        { error: "Insufficient permissions to manage partners" },
        { status: 403 }
      );
    }

    // Verify partner exists
    const existing = await db.partner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    // Allowed update fields
    const allowedFields = ["name", "partnerType", "status", "apiEndpoint", "integrationType", "trustRating"];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        updates[field] = updateFields[field];
      }
    }

    // Validate partnerType if being updated
    if (updates.partnerType && !VALID_PARTNER_TYPES.includes(updates.partnerType as string)) {
      return NextResponse.json(
        { error: `Invalid partner type. Must be one of: ${VALID_PARTNER_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate status transition if being updated
    if (updates.status) {
      if (!VALID_STATUSES.includes(updates.status as string)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }

      const currentStatus = existing.status;
      const newStatus = updates.status as string;

      if (currentStatus === newStatus) {
        // No transition needed, just update other fields
        delete updates.status;
      } else {
        const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
        if (!allowedTransitions.includes(newStatus)) {
          return NextResponse.json(
            { error: `Cannot transition partner from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(", ") : "none"}` },
            { status: 400 }
          );
        }
      }
    }

    // Validate name uniqueness if name is being updated
    if (updates.name && (updates.name as string).trim() !== existing.name) {
      const duplicate = await db.partner.findFirst({
        where: { name: (updates.name as string).trim(), id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A partner with this name already exists" },
          { status: 409 }
        );
      }
      updates.name = (updates.name as string).trim();
    }

    // Validate trustRating range
    if (updates.trustRating !== undefined) {
      const rating = Number(updates.trustRating);
      if (isNaN(rating) || rating < 0 || rating > 100) {
        return NextResponse.json(
          { error: "Trust rating must be between 0 and 100" },
          { status: 400 }
        );
      }
      updates.trustRating = rating;
    }

    // Nothing to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Apply updates
    const updatedPartner = await db.partner.update({
      where: { id },
      data: updates,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "partner_updated",
        resource: "partner",
        resourceId: id,
        details: JSON.stringify({
          previousStatus: existing.status,
          updates,
          updatedBy: userRole,
        }),
        performedBy: "system",
      },
    });

    return NextResponse.json({
      partner: updatedPartner,
      referenceId: `PTR-${updatedPartner.id.slice(-8).toUpperCase()}`,
    });
  } catch (error) {
    console.error("Partner PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update partner" },
      { status: 500 }
    );
  }
}
