import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireComplianceOrAbove } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import type { UserRole } from "@/lib/rbac";

export async function GET(request: Request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, "compliance:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const profileId = searchParams.get("profileId");
    const step = searchParams.get("step");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (step) where.currentStep = parseInt(step);

    // Firm-scoped: if a firmId is set, filter by it
    if (auth.user.firmId && auth.user.role !== "platform_admin") {
      where.firmId = auth.user.firmId;
    }

    // Tenant can only see their own profile's processes
    if (auth.user.role === "tenant") {
      const profile = await db.identityProfile.findFirst({
        where: { userId: auth.user.id },
        select: { id: true },
      });
      if (!profile) return NextResponse.json({ processes: [], total: 0, summary: {} });
      where.profileId = profile.id;
    } else if (profileId) {
      where.profileId = profileId;
    }

    const processes = await db.aMLProcess.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const statusBreakdown: Record<string, number> = {};
    for (const p of processes) statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;

    return NextResponse.json({
      processes,
      total: processes.length,
      summary: {
        byStatus: statusBreakdown,
        clearedCount: processes.filter(p => p.decisionResult === "cleared").length,
        lockdownCount: processes.filter(p => p.decisionResult === "locked_down").length,
        sarCount: processes.filter(p => p.sarGenerated).length,
      },
    });
  } catch (error) {
    console.error("AML Process GET error:", error);
    return NextResponse.json({ error: "Failed to fetch AML processes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireComplianceOrAbove();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { profileId, propertyRef, transactionType, transactionAmount } = body;

    if (!transactionType) {
      return NextResponse.json({ error: "transactionType is required" }, { status: 400 });
    }

    if (profileId) {
      const profile = await db.identityProfile.findUnique({ where: { id: profileId } });
      if (!profile) return NextResponse.json({ error: "Identity profile not found" }, { status: 404 });
    }

    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const transactionRef = `AML-${ts}-${rand}`;

    const process = await db.aMLProcess.create({
      data: {
        profileId: profileId || null,
        firmId: auth.user.firmId || null,
        transactionRef,
        propertyRef: propertyRef || null,
        transactionType,
        transactionAmount: transactionAmount ? parseFloat(String(transactionAmount)) : null,
        currentStep: 1,
        status: "initialized",
      },
    });

    await writeAuditLog({
      profileId: profileId || undefined,
      userId: auth.user.id,
      action: "AML_PROCESS_CREATED",
      performedBy: auth.user.id,
      resource: "AMLProcess",
      resourceId: process.id,
      details: { transactionRef, transactionType, initiatedBy: auth.user.email },
    });

    return NextResponse.json({ process }, { status: 201 });
  } catch (error) {
    console.error("AML Process POST error:", error);
    return NextResponse.json({ error: "Failed to create AML process" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireComplianceOrAbove();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, currentStep, status, ...updateFields } = body;

    if (!id) return NextResponse.json({ error: "Process id is required" }, { status: 400 });

    const existing = await db.aMLProcess.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "AML process not found" }, { status: 404 });

    // MLRO-only fields: decidedBy is set from session, not user-supplied string
    const allowedFields = [
      "transactionType", "transactionAmount", "identityVerified", "kycComplete", "cddComplete",
      "riskClassification", "sanctionsCheck", "pepCheck", "adverseMediaCheck", "screeningProvider",
      "eddRequired", "sofVerified", "sourceOfFunds", "eddComplete",
      "decisionResult", "amlRiskScore", "sarGenerated", "sarReference",
    ];

    const data: Record<string, unknown> = {};
    if (currentStep !== undefined) data.currentStep = currentStep;
    if (status !== undefined) data.status = status;

    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) data[field] = updateFields[field];
    }

    // decidedBy always comes from the authenticated session, not the request body
    if (status === "decision" && !existing.decidedAt) {
      data.decidedAt = new Date();
      data.decidedBy = auth.user.id;
    }

    // MLRO sign-off requires MLRO role
    if (updateFields.mlroSignOffRequired !== undefined) {
      if (auth.user.role !== "mlro" && auth.user.role !== "platform_admin") {
        return NextResponse.json({ error: "MLRO sign-off requires MLRO role" }, { status: 403 });
      }
      data.mlroSignedOffAt = new Date();
      data.mlroSignedOffBy = auth.user.id;
    }

    if (updateFields.sarGenerated === true && !existing.sarFiledAt) data.sarFiledAt = new Date();
    if (updateFields.sanctionsCheck || updateFields.pepCheck || updateFields.adverseMediaCheck) data.screeningDate = new Date();

    const process = await db.aMLProcess.update({ where: { id }, data });

    await writeAuditLog({
      profileId: existing.profileId ?? undefined,
      userId: auth.user.id,
      action: "AML_PROCESS_UPDATED",
      performedBy: auth.user.id,
      resource: "AMLProcess",
      resourceId: id,
      details: { currentStep, status, updatedFields: Object.keys(data) },
    });

    return NextResponse.json({ process });
  } catch (error) {
    console.error("AML Process PATCH error:", error);
    return NextResponse.json({ error: "Failed to update AML process" }, { status: 500 });
  }
}
