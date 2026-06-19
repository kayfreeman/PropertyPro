import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { getDataScope, hasPermission, type UserRole } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

// The seven screening disciplines the Senior Risk Analyst works across.
const SCREENING_TYPES = ["aml", "kyc", "cdd", "edd", "sanctions", "pep", "adverse_media"] as const;

// Decision → application status mapping. `approve` is overridden to `in_review`
// when a SAR is required (the application stays under investigation, not complete).
const DECISION_STATUS: Record<string, string> = {
  approve: "approved",
  reject: "rejected",
  request_info: "additional_info_required",
  escalate: "in_review",
  snooze: "on_hold",
  archive: "archived",
};
const VALID_DECISIONS = Object.keys(DECISION_STATUS);

function generateSarRef(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SAR-${year}-${rand}`;
}

// Threshold-based SAR assessment: a SAR is required when screening flags or the
// risk model indicate suspicious activity above predefined thresholds.
async function assessSarRequired(profileId: string): Promise<boolean> {
  const [checks, risk] = await Promise.all([
    db.complianceCheck.findMany({ where: { profileId }, select: { status: true, riskRating: true } }),
    db.riskScore.findFirst({ where: { profileId }, orderBy: { createdAt: "desc" }, select: { riskCategory: true } }),
  ]);
  const flaggedCheck = checks.some((c) => ["escalated", "failed", "under_review"].includes(c.status));
  const highRiskCheck = checks.some((c) => ["high", "critical"].includes(c.riskRating));
  const highRiskScore = risk ? ["high", "critical"].includes(risk.riskCategory) : false;
  return flaggedCheck || highRiskCheck || highRiskScore;
}

// Route SAR / escalation tasks to the firm's MLRO (falling back to a compliance officer).
async function findReviewerUserId(firmId: string | null | undefined): Promise<string | null> {
  const roles = ["mlro", "compliance_officer"] as const;
  for (const role of roles) {
    const u = await db.user.findFirst({
      where: { role, isActive: true, ...(firmId ? { firmId } : {}) },
      select: { id: true },
    });
    if (u) return u.id;
  }
  return null;
}

async function createNotification(opts: {
  userId: string; title: string; message: string; type: string; isSarRelated?: boolean;
}): Promise<void> {
  await db.notification.create({
    data: {
      userId: opts.userId,
      title: opts.title,
      message: opts.message,
      type: opts.type,
      category: "compliance",
      isSarRelated: opts.isSarRelated ?? false,
    },
  });
}

// GET /api/compliance/pipeline — applicants/applications under compliance review,
// enriched with each applicant's screening results and risk posture.
export async function GET() {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  const role = auth.user.role as UserRole;
  if (!hasPermission(role, "compliance:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const scope = getDataScope(role);
  // The pipeline is a staff decisioning surface — not for tenants or partners.
  if (scope === "own" || scope === "partner_only") {
    return NextResponse.json({ pipeline: [], total: 0, summary: { byStatus: {}, byRisk: {}, screeningGaps: 0 } });
  }

  try {
    const applications = await db.propertyApplication.findMany({
      orderBy: { submittedAt: "desc" },
      include: {
        property: { select: { id: true, address: true, city: true, postcode: true, propertyType: true, complianceStatus: true } },
        profile: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            nationality: true, dateOfBirth: true, trustLevel: true, trustScore: true, status: true,
          },
        },
      },
    });

    const profileIds = Array.from(new Set(applications.map((a) => a.profileId)));

    const [checks, riskScores] = await Promise.all([
      db.complianceCheck.findMany({
        where: { profileId: { in: profileIds } },
        orderBy: { createdAt: "desc" },
        select: { id: true, profileId: true, checkType: true, status: true, riskRating: true, checkProvider: true, results: true, reviewedBy: true, reviewedAt: true, createdAt: true },
      }),
      db.riskScore.findMany({
        where: { profileId: { in: profileIds } },
        orderBy: { createdAt: "desc" },
        select: { profileId: true, overallScore: true, riskCategory: true, fraudProbability: true },
      }),
    ]);

    const checksByProfile = new Map<string, typeof checks>();
    for (const c of checks) {
      const arr = checksByProfile.get(c.profileId) ?? [];
      arr.push(c);
      checksByProfile.set(c.profileId, arr);
    }
    const riskByProfile = new Map<string, (typeof riskScores)[number]>();
    for (const r of riskScores) {
      if (!riskByProfile.has(r.profileId)) riskByProfile.set(r.profileId, r); // first = latest (ordered desc)
    }

    let screeningGaps = 0;

    const pipeline = applications.map((app) => {
      const profileChecks = checksByProfile.get(app.profileId) ?? [];
      // Latest check per screening type
      const screening = SCREENING_TYPES.map((type) => {
        const latest = profileChecks.find((c) => c.checkType === type);
        return {
          type,
          status: latest?.status ?? "not_run",
          riskRating: latest?.riskRating ?? null,
          provider: latest?.checkProvider ?? null,
          results: latest?.results ?? null,
          reviewedBy: latest?.reviewedBy ?? null,
          reviewedAt: latest?.reviewedAt ?? null,
          checkId: latest?.id ?? null,
        };
      });

      const completed = screening.filter((s) => ["passed", "failed", "escalated", "under_review", "completed"].includes(s.status)).length;
      const flagged = screening.filter((s) => ["failed", "escalated", "under_review"].includes(s.status)).length;
      const notRun = screening.filter((s) => s.status === "not_run").length;
      screeningGaps += notRun;

      const risk = riskByProfile.get(app.profileId) ?? null;

      return {
        applicationId: app.id,
        applicationType: app.applicationType,
        status: app.status,
        rightToRent: app.rightToRent,
        complianceClear: app.complianceClear,
        riskClear: app.riskClear,
        monthlyAmount: app.monthlyAmount,
        depositAmount: app.depositAmount,
        submittedAt: app.submittedAt,
        decidedAt: app.decidedAt,
        property: app.property,
        profile: app.profile,
        screening,
        screeningSummary: { total: SCREENING_TYPES.length, completed, flagged, notRun },
        risk: risk ? { overallScore: risk.overallScore, riskCategory: risk.riskCategory, fraudProbability: risk.fraudProbability } : null,
      };
    });

    const summary = {
      byStatus: pipeline.reduce<Record<string, number>>((acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; }, {}),
      byRisk: pipeline.reduce<Record<string, number>>((acc, p) => { const k = p.risk?.riskCategory ?? "unknown"; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {}),
      screeningGaps,
    };

    return NextResponse.json({ pipeline, total: pipeline.length, summary });
  } catch (error) {
    console.error("Compliance pipeline GET error:", error);
    return NextResponse.json({ error: "Failed to load compliance pipeline" }, { status: 500 });
  }
}

// PATCH /api/compliance/pipeline — record a compliance decision on an application.
export async function PATCH(request: Request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  const role = auth.user.role as UserRole;
  if (!hasPermission(role, "compliance:review")) {
    return NextResponse.json({ error: "Forbidden — compliance review permission required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { applicationId, decision, note } = body as { applicationId?: string; decision?: string; note?: string };

    if (!applicationId || !decision) {
      return NextResponse.json({ error: "applicationId and decision are required" }, { status: 400 });
    }
    if (!VALID_DECISIONS.includes(decision)) {
      return NextResponse.json({ error: `Invalid decision. Must be one of: ${VALID_DECISIONS.join(", ")}` }, { status: 400 });
    }

    const existing = await db.propertyApplication.findUnique({ where: { id: applicationId } });
    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    const applicant = await db.identityProfile.findUnique({
      where: { id: existing.profileId },
      select: { userId: true, firstName: true, lastName: true },
    });

    // ── SAR assessment (only on approval) ────────────────────────────────────
    let sarRequired = false;
    let sarRef: string | null = null;
    let sarStatus: "not_required" | "pending_mlro" | null = null;
    if (decision === "approve") {
      sarRequired = await assessSarRequired(existing.profileId);
      sarStatus = sarRequired ? "pending_mlro" : "not_required";
    }

    // Resolve final application status. Approve + SAR required keeps the
    // application under investigation (in_review) — completion is prevented
    // until the SAR review is finalised (Scenario 3).
    const finalStatus = decision === "approve" && sarRequired ? "in_review" : DECISION_STATUS[decision];
    // Terminal (lifecycle complete) only when no further action is pending.
    const isTerminal =
      decision === "reject" ||
      decision === "archive" ||
      (decision === "approve" && !sarRequired);

    const updated = await db.propertyApplication.update({
      where: { id: applicationId },
      data: {
        status: finalStatus,
        ...(decision === "approve" ? { complianceClear: true, riskClear: true } : {}),
        ...(decision === "reject" ? { complianceClear: false, riskClear: false } : {}),
        decidedAt: isTerminal ? new Date() : null,
      },
      include: {
        property: { select: { id: true, address: true, city: true, postcode: true } },
        profile: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // ── SAR record (Scenario 3) ──────────────────────────────────────────────
    if (decision === "approve" && sarRequired) {
      sarRef = generateSarRef();
      const firmId = auth.user.firmId ?? (await db.firm.findFirst({ select: { id: true } }))?.id;
      if (firmId) {
        await db.sAR.create({
          data: {
            firmId,
            profileId: existing.profileId,
            sarRef,
            status: "pending_mlro",
            isRestricted: true,
            draftContent: JSON.stringify({
              applicationId,
              trigger: "Suspicious activity indicators exceeded predefined thresholds",
              initiatedBy: auth.user.email,
              note: note ?? null,
              generatedAt: new Date().toISOString(),
            }),
          },
        });
      }
    }

    // ── Notifications (tipping-off safe: SAR notices never go to the applicant) ─
    if (decision === "reject" && applicant?.userId) {
      await createNotification({
        userId: applicant.userId,
        title: "Application Rejected",
        message: "Your application has been reviewed and did not meet the required compliance criteria. Please review the feedback provided and contact support if additional clarification is required.",
        type: "error",
      });
    } else if (decision === "request_info" && applicant?.userId) {
      await createNotification({
        userId: applicant.userId,
        title: "Additional Information Required",
        message: "Additional information is required before your application can proceed. Please upload the requested documentation to continue the compliance review process.",
        type: "warning",
      });
    } else if (decision === "approve" && !sarRequired && applicant?.userId) {
      await createNotification({
        userId: applicant.userId,
        title: "Application Approved",
        message: "Your application has cleared all compliance checks and has been approved. You can continue your property journey.",
        type: "success",
      });
    } else if (decision === "approve" && sarRequired) {
      // Route the SAR notice to the MLRO / compliance manager — never the applicant.
      const reviewer = await findReviewerUserId(auth.user.firmId);
      if (reviewer) {
        await createNotification({
          userId: reviewer,
          title: "SAR Required",
          message: `Potential suspicious activity has been identified. A Suspicious Activity Report (${sarRef}) has been generated and forwarded for further review.`,
          type: "warning",
          isSarRelated: true,
        });
      }
    } else if (decision === "escalate") {
      const reviewer = await findReviewerUserId(auth.user.firmId);
      if (reviewer && reviewer !== auth.user.id) {
        await createNotification({
          userId: reviewer,
          title: "Compliance Review Escalated",
          message: `An application from ${applicant?.firstName ?? "an applicant"} ${applicant?.lastName ?? ""} has been escalated for your review${note ? `: ${note}` : "."}`,
          type: "warning",
        });
      }
    }

    await writeAuditLog({
      profileId: existing.profileId,
      userId: auth.user.id,
      action: `COMPLIANCE_DECISION_${decision.toUpperCase()}`,
      performedBy: auth.user.id,
      resource: "PropertyApplication",
      resourceId: applicationId,
      details: { decision, finalStatus, sarRequired, sarRef, note: note ?? null, decidedBy: auth.user.email },
    });

    return NextResponse.json({
      application: updated,
      sar: sarStatus ? { required: sarRequired, status: sarStatus, ref: sarRef } : null,
    });
  } catch (error) {
    console.error("Compliance pipeline PATCH error:", error);
    return NextResponse.json({ error: "Failed to record decision" }, { status: 500 });
  }
}
