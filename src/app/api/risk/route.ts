import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { getDataScope, hasPermission } from "@/lib/rbac";
import type { UserRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, "risk:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const scope = getDataScope(auth.user.role as UserRole);

    if (scope === "partner_only") {
      return NextResponse.json({ riskScores: [], fraudAlerts: [], summary: { riskCategories: [], alertSeverity: {}, alertStatus: {} } });
    }

    let riskWhere: Record<string, unknown> = {};
    let fraudWhere: Record<string, unknown> = {};

    if (scope === "own") {
      const profile = await db.identityProfile.findFirst({
        where: { userId: auth.user.id },
        select: { id: true },
      });
      if (!profile) {
        return NextResponse.json({ riskScores: [], fraudAlerts: [], summary: { riskCategories: [], alertSeverity: {}, alertStatus: {} } });
      }
      riskWhere = { profileId: profile.id };
      fraudWhere = { relatedProfileId: profile.id };
    } else if (scope === "firm_only" && auth.user.firmId) {
      const firmCases = await db.case.findMany({
        where: { firmId: auth.user.firmId },
        select: { profileId: true },
      });
      const profileIds = firmCases.map(c => c.profileId).filter(Boolean) as string[];
      if (profileIds.length > 0) {
        riskWhere = { profileId: { in: profileIds } };
        fraudWhere = { relatedProfileId: { in: profileIds } };
      }
    }

    const [riskScores, fraudAlerts] = await Promise.all([
      db.riskScore.findMany({
        where: riskWhere,
        orderBy: { createdAt: "desc" },
        include: {
          profile: {
            select: { id: true, firstName: true, lastName: true, email: true, nationality: true, status: true, trustLevel: true },
          },
        },
      }),
      db.fraudAlert.findMany({ where: fraudWhere, orderBy: { createdAt: "desc" } }),
    ]);

    // Enrich fraud alerts with profile info
    const alertProfileIds = fraudAlerts.map(a => a.relatedProfileId).filter((id): id is string => id !== null);
    const relatedProfiles = alertProfileIds.length > 0
      ? await db.identityProfile.findMany({
          where: { id: { in: alertProfileIds } },
          select: { id: true, firstName: true, lastName: true, email: true, nationality: true },
        })
      : [];
    const profileMap = new Map(relatedProfiles.map(p => [p.id, p]));

    const [riskCategoryBreakdown, alertSeverityBreakdown, alertStatusBreakdown] = await Promise.all([
      db.riskScore.groupBy({ by: ["riskCategory"], where: riskWhere, _count: { riskCategory: true }, _avg: { overallScore: true } }),
      db.fraudAlert.groupBy({ by: ["severity"], where: fraudWhere, _count: { severity: true } }),
      db.fraudAlert.groupBy({ by: ["status"], where: fraudWhere, _count: { status: true } }),
    ]);

    return NextResponse.json({
      riskScores,
      fraudAlerts: fraudAlerts.map(alert => ({
        ...alert,
        relatedProfile: alert.relatedProfileId ? profileMap.get(alert.relatedProfileId) ?? null : null,
      })),
      summary: {
        riskCategories: riskCategoryBreakdown.map(rc => ({
          category: rc.riskCategory,
          count: rc._count.riskCategory,
          avgScore: Math.round((rc._avg.overallScore ?? 0) * 10) / 10,
        })),
        alertSeverity: Object.fromEntries(alertSeverityBreakdown.map(s => [s.severity, s._count.severity])),
        alertStatus: Object.fromEntries(alertStatusBreakdown.map(s => [s.status, s._count.status])),
      },
    });
  } catch (error) {
    console.error("Risk GET error:", error);
    return NextResponse.json({ error: "Failed to fetch risk data" }, { status: 500 });
  }
}
