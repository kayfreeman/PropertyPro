import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@/lib/rbac";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, "case:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const caseRecord = await db.case.findUnique({
      where: { id },
      include: {
        profile: {
          select: { id: true, firstName: true, lastName: true, email: true, nationality: true, trustScore: true, status: true },
        },
        actions: { orderBy: { performedAt: "desc" } },
        firm: { select: { id: true, name: true } },
        auditLogs: { orderBy: { timestamp: "desc" }, take: 20 },
      },
    });

    if (!caseRecord) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    // Firm-scoping check
    if (auth.user.role !== "platform_admin" && auth.user.firmId && caseRecord.firmId !== auth.user.firmId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ case: caseRecord });
  } catch (error) {
    console.error("Case GET error:", error);
    return NextResponse.json({ error: "Failed to fetch case" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, "case:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { action, notes, nextStep, riskLevel } = body;

    const existing = await db.case.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    if (auth.user.role !== "platform_admin" && auth.user.firmId && existing.firmId !== auth.user.firmId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (nextStep) updateData.currentStep = nextStep;
    if (riskLevel) updateData.riskLevel = riskLevel;

    // Handle specific case actions
    if (action === "approve") {
      updateData.status = "cleared";
      updateData.autoCleared = false;
      updateData.closedAt = new Date();
      updateData.closedReason = notes || "Approved by compliance officer";
    } else if (action === "reject") {
      updateData.status = "rejected";
      updateData.closedAt = new Date();
      updateData.closedReason = notes || "Rejected";
    } else if (action === "escalate_to_mlro") {
      updateData.status = "pending_mlro";
      updateData.mlroSignOffRequired = true;
    } else if (action === "mlro_sign_off") {
      if (auth.user.role !== "mlro" && auth.user.role !== "platform_admin") {
        return NextResponse.json({ error: "MLRO sign-off requires MLRO role" }, { status: 403 });
      }
      updateData.status = "cleared";
      updateData.mlroSignedOffAt = new Date();
      updateData.mlroSignedOffBy = auth.user.id;
      updateData.mlroNotes = notes;
      updateData.closedAt = new Date();
    } else if (action === "raise_sar") {
      if (auth.user.role !== "mlro" && auth.user.role !== "platform_admin") {
        return NextResponse.json({ error: "SAR can only be raised by MLRO" }, { status: 403 });
      }
      updateData.status = "pending_sar";
    }

    const updatedCase = await db.case.update({ where: { id }, data: updateData });

    // Record the action
    await db.caseAction.create({
      data: {
        caseId: id,
        actionType: action || "update",
        performedBy: auth.user.id,
        outcome: (updateData.status as string) || "updated",
        notes: notes || null,
      },
    });

    await writeAuditLog({
      caseId: id,
      userId: auth.user.id,
      action: `CASE_${(action || "updated").toUpperCase()}`,
      performedBy: auth.user.id,
      resource: "Case",
      resourceId: id,
      details: { action, notes, updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json({ case: updatedCase });
  } catch (error) {
    console.error("Case PATCH error:", error);
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 });
  }
}
