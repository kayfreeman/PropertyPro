import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDataScope } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role") as string | null;

    const scope = getDataScope((role as Parameters<typeof getDataScope>[0]) ?? "tenant");

    // partner_user cannot see risk data
    if (scope === "partner_only") {
      return NextResponse.json({ riskScores: [], fraudAlerts: [], summary: { riskCategories: [], alertSeverity: {}, alertStatus: {} } });
    }

    // Tenant users with no userId: return empty data (data isolation)
    if (scope === "own" && !userId) {
      return NextResponse.json({ riskScores: [], fraudAlerts: [], summary: { riskCategories: [], alertSeverity: {}, alertStatus: {} } });
    }

    // Tenant users: find their profile first, then filter by that profileId
    let riskWhere: Record<string, unknown> = {};
    let fraudWhere: Record<string, unknown> = {};
    if (scope === "own" && userId) {
      const profile = await db.identityProfile.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (!profile) {
        return NextResponse.json({ riskScores: [], fraudAlerts: [], summary: { riskCategories: [], alertSeverity: {}, alertStatus: {} } });
      }
      riskWhere = { profileId: profile.id };
      fraudWhere = { relatedProfileId: profile.id };
    }

    const riskScores = await db.riskScore.findMany({
      where: riskWhere,
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
            trustLevel: true,
          },
        },
      },
    });

    const fraudAlerts = await db.fraudAlert.findMany({
      where: fraudWhere,
      orderBy: { createdAt: "desc" },
    });

    // Enrich fraud alerts with related profile info
    const alertProfileIds = fraudAlerts
      .map((a) => a.relatedProfileId)
      .filter((id): id is string => id !== null);

    const relatedProfiles = alertProfileIds.length > 0
      ? await db.identityProfile.findMany({
          where: { id: { in: alertProfileIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            nationality: true,
          },
        })
      : [];

    const profileMap = new Map(relatedProfiles.map((p) => [p.id, p]));

    const enrichedAlerts = fraudAlerts.map((alert) => ({
      ...alert,
      relatedProfile: alert.relatedProfileId
        ? profileMap.get(alert.relatedProfileId) || null
        : null,
    }));

    // Risk summary
    const riskCategoryBreakdown = await db.riskScore.groupBy({
      by: ["riskCategory"],
      where: riskWhere,
      _count: { riskCategory: true },
      _avg: { overallScore: true, fraudProbability: true },
    });

    const alertSeverityBreakdown = await db.fraudAlert.groupBy({
      by: ["severity"],
      where: fraudWhere,
      _count: { severity: true },
    });

    const alertStatusBreakdown = await db.fraudAlert.groupBy({
      by: ["status"],
      where: fraudWhere,
      _count: { status: true },
    });

    return NextResponse.json({
      riskScores,
      fraudAlerts: enrichedAlerts,
      summary: {
        riskCategories: riskCategoryBreakdown.map((rc) => ({
          category: rc.riskCategory,
          count: rc._count.riskCategory,
          avgScore: Math.round((rc._avg.overallScore ?? 0) * 10) / 10,
          avgFraudProbability:
            Math.round((rc._avg.fraudProbability ?? 0) * 1000) / 1000,
        })),
        alertSeverity: Object.fromEntries(
          alertSeverityBreakdown.map((s) => [s.severity, s._count.severity])
        ),
        alertStatus: Object.fromEntries(
          alertStatusBreakdown.map((s) => [s.status, s._count.status])
        ),
      },
    });
  } catch (error) {
    console.error("Risk GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk data" },
      { status: 500 }
    );
  }
}
