import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/aml-process — List AML processes with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const profileId = searchParams.get("profileId");
    const step = searchParams.get("step");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (profileId) where.profileId = profileId;
    if (step) where.currentStep = parseInt(step);

    const processes = await db.aMLProcess.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Summary statistics
    const totalCount = processes.length;
    const statusBreakdown: Record<string, number> = {};
    for (const p of processes) {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    }

    const stepBreakdown: Record<string, number> = {};
    for (const p of processes) {
      const stepKey = `step_${p.currentStep}`;
      stepBreakdown[stepKey] = (stepBreakdown[stepKey] || 0) + 1;
    }

    return NextResponse.json({
      processes,
      total: totalCount,
      summary: {
        byStatus: statusBreakdown,
        byStep: stepBreakdown,
        completedCount: processes.filter(p => p.status === "completed").length,
        lockdownCount: processes.filter(p => p.decisionResult === "locked_down").length,
        clearedCount: processes.filter(p => p.decisionResult === "cleared").length,
        sarCount: processes.filter(p => p.sarGenerated).length,
      },
    });
  } catch (error) {
    console.error("AML Process GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch AML processes" },
      { status: 500 }
    );
  }
}

// POST /api/aml-process — Create new AML process
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId, propertyRef, transactionType, transactionAmount } = body;

    if (!transactionType) {
      return NextResponse.json(
        { error: "transactionType is required" },
        { status: 400 }
      );
    }

    // Validate profile if provided
    if (profileId) {
      const profile = await db.identityProfile.findUnique({
        where: { id: profileId },
      });
      if (!profile) {
        return NextResponse.json(
          { error: "Identity profile not found" },
          { status: 404 }
        );
      }
    }

    // Generate unique transaction reference
    const prefix = "AML";
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const transactionRef = `${prefix}-${ts}-${rand}`;

    const process = await db.aMLProcess.create({
      data: {
        profileId: profileId || null,
        transactionRef,
        propertyRef: propertyRef || null,
        transactionType,
        transactionAmount: transactionAmount ? parseFloat(String(transactionAmount)) : null,
        currentStep: 1,
        status: "initialized",
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        profileId: profileId || null,
        action: "AML_PROCESS_CREATED",
        performedBy: "api",
        resource: "AMLProcess",
        resourceId: process.id,
        details: JSON.stringify({ transactionRef, transactionType }),
      },
    });

    return NextResponse.json({ process }, { status: 201 });
  } catch (error) {
    console.error("AML Process POST error:", error);
    return NextResponse.json(
      { error: "Failed to create AML process" },
      { status: 500 }
    );
  }
}

// PATCH /api/aml-process — Update AML process step/status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, currentStep, status, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Process id is required" },
        { status: 400 }
      );
    }

    const existing = await db.aMLProcess.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "AML process not found" },
        { status: 404 }
      );
    }

    // Build update data from allowed fields
    const allowedFields = [
      "transactionType",
      "transactionAmount",
      "identityVerified",
      "kycComplete",
      "cddComplete",
      "riskClassification",
      "sanctionsCheck",
      "pepCheck",
      "adverseMediaCheck",
      "screeningProvider",
      "eddRequired",
      "sofVerified",
      "sourceOfFunds",
      "eddComplete",
      "decisionResult",
      "amlRiskScore",
      "decidedBy",
      "sarGenerated",
      "sarReference",
    ];

    const data: Record<string, unknown> = {};
    if (currentStep !== undefined) data.currentStep = currentStep;
    if (status !== undefined) data.status = status;

    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        data[field] = updateFields[field];
      }
    }

    // Set timestamps based on status changes
    if (status === "decision" && !existing.decidedAt) {
      data.decidedAt = new Date();
    }
    if (updateFields.sarGenerated === true && !existing.sarFiledAt) {
      data.sarFiledAt = new Date();
    }
    if (updateFields.sanctionsCheck || updateFields.pepCheck || updateFields.adverseMediaCheck) {
      data.screeningDate = new Date();
    }

    const process = await db.aMLProcess.update({
      where: { id },
      data,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        profileId: existing.profileId,
        action: "AML_PROCESS_UPDATED",
        performedBy: "api",
        resource: "AMLProcess",
        resourceId: id,
        details: JSON.stringify({ currentStep, status, updatedFields: Object.keys(data) }),
      },
    });

    return NextResponse.json({ process });
  } catch (error) {
    console.error("AML Process PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update AML process" },
      { status: 500 }
    );
  }
}
