import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDataScope } from "@/lib/rbac";
import { requireSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const userId = auth.user.id;
    const scope = getDataScope(auth.user.role as Parameters<typeof getDataScope>[0]);

    // AC2 — discovery mode: a verified tenant browses the full property catalogue
    // to search and apply. Their own applications are still the only ones attached
    // to each property (no PII leakage of other applicants).
    const { searchParams } = new URL(request.url);
    const discover = searchParams.get("discover") === "true";

    // Tenant users with no userId: return empty data (data isolation)
    if (scope === "own" && !userId) {
      return NextResponse.json({ properties: [], total: 0, summary: { byComplianceStatus: {}, byPropertyType: {}, applicationsByStatus: {} } });
    }

    // For tenant users: find their profile first, then filter property applications
    let profileId: string | null = null;
    let identityVerified = false;
    if (scope === "own" && userId) {
      const profile = await db.identityProfile.findFirst({
        where: { userId },
        select: { id: true, status: true },
      });
      if (!profile) {
        return NextResponse.json({ properties: [], total: 0, summary: { byComplianceStatus: {}, byPropertyType: {}, applicationsByStatus: {} } });
      }
      profileId = profile.id;
      identityVerified = profile.status === "verified";

      // Discovery requires a verified identity (AC1/AC2 gate, mirrors the UI).
      if (discover && !identityVerified) {
        return NextResponse.json(
          { properties: [], total: 0, summary: { byComplianceStatus: {}, byPropertyType: {}, applicationsByStatus: {} }, code: "IDENTITY_NOT_VERIFIED" },
          { status: 200 }
        );
      }
    }

    const properties = await db.property.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        applications: {
          where: scope === "own" && profileId ? { profileId } : undefined,
          orderBy: { submittedAt: "desc" },
          include: {
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                nationality: true,
                trustLevel: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // For tenant: "My Applications" view only shows properties they have applied
    // to. Discovery mode (AC2) shows the full catalogue so they can search & apply.
    const filteredProperties = scope === "own" && !discover
      ? properties.filter((p) => p.applications.length > 0)
      : properties;

    // Property summary
    const totalProperties = filteredProperties.length;
    const complianceStatusBreakdown = await db.property.groupBy({
      by: ["complianceStatus"],
      _count: { complianceStatus: true },
    });
    const propertyTypeBreakdown = await db.property.groupBy({
      by: ["propertyType"],
      _count: { propertyType: true },
    });

    const appWhere = scope === "own" && profileId ? { profileId } : undefined;
    const applicationStatusBreakdown = await db.propertyApplication.groupBy({
      by: ["status"],
      where: appWhere,
      _count: { status: true },
    });

    return NextResponse.json({
      properties: filteredProperties,
      total: totalProperties,
      summary: {
        byComplianceStatus: Object.fromEntries(
          complianceStatusBreakdown.map((c) => [
            c.complianceStatus,
            c._count.complianceStatus,
          ])
        ),
        byPropertyType: Object.fromEntries(
          propertyTypeBreakdown.map((p) => [
            p.propertyType,
            p._count.propertyType,
          ])
        ),
        applicationsByStatus: Object.fromEntries(
          applicationStatusBreakdown.map((a) => [a.status, a._count.status])
        ),
      },
    });
  } catch (error) {
    console.error("Properties GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
