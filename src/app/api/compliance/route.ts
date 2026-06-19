import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { getDataScope, hasPermission } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, "compliance:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const scope = getDataScope(auth.user.role as UserRole);

    if (scope === "partner_only") {
      return NextResponse.json({ complianceChecks: [], total: 0, summary: { byStatus: {}, byType: {}, byRiskRating: {} } });
    }

    let where: Record<string, unknown> = {};

    if (scope === "own") {
      const profile = await db.identityProfile.findFirst({
        where: { userId: auth.user.id },
        select: { id: true },
      });
      if (!profile) {
        return NextResponse.json({ complianceChecks: [], total: 0, summary: { byStatus: {}, byType: {}, byRiskRating: {} } });
      }
      where = { profileId: profile.id };
    } else if (scope === "firm_only" && auth.user.firmId) {
      // Scope to profiles belonging to this firm's cases
      const firmCases = await db.case.findMany({
        where: { firmId: auth.user.firmId },
        select: { profileId: true },
      });
      const profileIds = firmCases.map(c => c.profileId).filter(Boolean) as string[];
      if (profileIds.length > 0) where = { profileId: { in: profileIds } };
    }

    const complianceChecks = await db.complianceCheck.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: { id: true, firstName: true, lastName: true, email: true, nationality: true, status: true },
        },
      },
    });

    const [statusBreakdown, typeBreakdown, riskBreakdown] = await Promise.all([
      db.complianceCheck.groupBy({ by: ["status"], where, _count: { status: true } }),
      db.complianceCheck.groupBy({ by: ["checkType"], where, _count: { checkType: true } }),
      db.complianceCheck.groupBy({ by: ["riskRating"], where, _count: { riskRating: true } }),
    ]);

    return NextResponse.json({
      complianceChecks,
      total: complianceChecks.length,
      summary: {
        byStatus: Object.fromEntries(statusBreakdown.map(s => [s.status, s._count.status])),
        byType: Object.fromEntries(typeBreakdown.map(t => [t.checkType, t._count.checkType])),
        byRiskRating: Object.fromEntries(riskBreakdown.map(r => [r.riskRating, r._count.riskRating])),
      },
    });
  } catch (error) {
    console.error("Compliance GET error:", error);
    return NextResponse.json({ error: "Failed to fetch compliance checks" }, { status: 500 });
  }
}

// Default screening providers per check type
const CHECK_PROVIDERS: Record<string, string> = {
  aml: "ComplyAdvantage",
  kyc: "Onfido",
  cdd: "Internal CDD Engine",
  edd: "Internal EDD Unit",
  sanctions: "ComplyAdvantage (HMT/OFAC/UN/EU)",
  pep: "ComplyAdvantage PEP",
  adverse_media: "Refinitiv World-Check",
  right_to_rent: "Home Office RtR",
};

// Simulate an executed screening outcome. High-risk nationalities and certain
// check types escalate to manual review; otherwise the screen passes. This is a
// deterministic demo simulation, not a real screening provider call.
const HIGH_RISK_NATIONALITIES = ["AF", "IR", "KP", "SY", "RU", "BY"];
function simulateScreening(checkType: string, nationality: string | null): { status: string; riskRating: string; results: Record<string, unknown> } {
  const highRisk = nationality ? HIGH_RISK_NATIONALITIES.includes(nationality.toUpperCase()) : false;

  if (checkType === "sanctions") {
    return highRisk
      ? { status: "escalated", riskRating: "critical", results: { listsChecked: ["HMT", "OFAC", "UN", "EU"], hits: 1, requiresManualReview: true } }
      : { status: "passed", riskRating: "low", results: { listsChecked: ["HMT", "OFAC", "UN", "EU"], hits: 0 } };
  }
  if (checkType === "pep") {
    return highRisk
      ? { status: "under_review", riskRating: "high", results: { pepMatch: true, tier: 2, requiresManualReview: true } }
      : { status: "passed", riskRating: "low", results: { pepMatch: false } };
  }
  if (checkType === "adverse_media") {
    return highRisk
      ? { status: "under_review", riskRating: "medium", results: { articlesFound: 2, sentiment: "negative", requiresManualReview: true } }
      : { status: "passed", riskRating: "low", results: { articlesFound: 0 } };
  }
  if (checkType === "edd") {
    return { status: highRisk ? "under_review" : "passed", riskRating: highRisk ? "high" : "medium", results: { sourceOfFunds: "verified", sourceOfWealth: highRisk ? "enhanced_review" : "verified" } };
  }
  // aml, kyc, cdd, right_to_rent
  return highRisk
    ? { status: "under_review", riskRating: "high", results: { flagged: true, requiresManualReview: true } }
    : { status: "passed", riskRating: "low", results: { verified: true } };
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  const role = auth.user.role as UserRole;
  // Initiating/executing checks is a review action — available to reviewers and managers.
  if (!hasPermission(role, "compliance:review") && !hasPermission(role, "compliance:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { profileId, checkType, checkProvider, execute } = body;

    if (!profileId || !checkType) {
      return NextResponse.json({ error: "profileId and checkType are required" }, { status: 400 });
    }

    const validTypes = ["aml", "kyc", "cdd", "edd", "sanctions", "pep", "adverse_media", "right_to_rent"];
    if (!validTypes.includes(checkType)) {
      return NextResponse.json({ error: `Invalid checkType. Must be one of: ${validTypes.join(", ")}` }, { status: 400 });
    }

    const profile = await db.identityProfile.findUnique({ where: { id: profileId } });
    if (!profile) {
      return NextResponse.json({ error: "Identity profile not found" }, { status: 404 });
    }

    const provider = checkProvider || CHECK_PROVIDERS[checkType] || null;

    // When `execute` is set, run the screening immediately and store the outcome.
    const sim = execute ? simulateScreening(checkType, profile.nationality) : null;

    const complianceCheck = await db.complianceCheck.create({
      data: {
        profileId,
        checkType,
        status: sim ? sim.status : "pending",
        riskRating: sim ? sim.riskRating : "low",
        checkProvider: provider,
        results: sim ? JSON.stringify(sim.results) : null,
        reviewedBy: sim ? auth.user.id : null,
        reviewedAt: sim ? new Date() : null,
      },
    });

    await writeAuditLog({
      profileId,
      userId: auth.user.id,
      action: execute ? "COMPLIANCE_CHECK_EXECUTED" : "COMPLIANCE_CHECK_CREATED",
      performedBy: auth.user.id,
      resource: "ComplianceCheck",
      resourceId: complianceCheck.id,
      details: { checkType, provider, initiatedBy: auth.user.email, outcome: sim?.status ?? "pending" },
    });

    return NextResponse.json({ complianceCheck }, { status: 201 });
  } catch (error) {
    console.error("Compliance POST error:", error);
    return NextResponse.json({ error: "Failed to create compliance check" }, { status: 500 });
  }
}
