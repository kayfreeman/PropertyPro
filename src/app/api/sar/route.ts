// SAR API — TIPPING-OFF CRITICAL
// This entire route is MLRO/platform_admin only.
// NEVER expose SAR existence, content, or reference numbers to client/agent roles.
// MLR 2017 s.333A: tipping off is a criminal offence.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireMLRO } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const auth = await requireMLRO();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const caseId = searchParams.get("caseId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (caseId) where.caseId = caseId;

    // Always firm-scoped
    if (auth.user.role !== "platform_admin" && auth.user.firmId) {
      where.firmId = auth.user.firmId;
    }

    const sars = await db.sAR.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        case: { select: { id: true, caseRef: true, status: true } },
        // Profile details omitted at list level to minimise data exposure
      },
    });

    return NextResponse.json({ sars, total: sars.length });
  } catch (error) {
    console.error("SAR GET error:", error);
    return NextResponse.json({ error: "Failed to fetch SARs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireMLRO();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { caseId, profileId, draftContent } = body;

    if (!auth.user.firmId) {
      return NextResponse.json({ error: "User must belong to a firm" }, { status: 400 });
    }

    // Generate SAR reference
    const year = new Date().getFullYear();
    const count = await db.sAR.count({ where: { firmId: auth.user.firmId } });
    const sarRef = `SAR-${year}-${String(count + 1).padStart(6, "0")}`;

    const sar = await db.sAR.create({
      data: {
        firmId: auth.user.firmId,
        caseId: caseId || null,
        profileId: profileId || null,
        sarRef,
        draftContent: draftContent ? JSON.stringify(draftContent) : null,
        status: "draft",
        isRestricted: true,
      },
    });

    await writeAuditLog({
      caseId: caseId || undefined,
      userId: auth.user.id,
      action: "SAR_CREATED",
      performedBy: auth.user.id,
      resource: "SAR",
      resourceId: sar.id,
      details: { sarRef, status: "draft" },
    });

    return NextResponse.json({ sar }, { status: 201 });
  } catch (error) {
    console.error("SAR POST error:", error);
    return NextResponse.json({ error: "Failed to create SAR" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireMLRO();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, decision, notes, filingRef } = body;

    if (!id) return NextResponse.json({ error: "SAR id is required" }, { status: 400 });

    const existing = await db.sAR.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "SAR not found" }, { status: 404 });

    if (auth.user.role !== "platform_admin" && auth.user.firmId && existing.firmId !== auth.user.firmId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const validDecisions = ["approve", "reject", "request_more_info"];
    if (decision && !validDecisions.includes(decision)) {
      return NextResponse.json({ error: `Invalid decision. Must be: ${validDecisions.join(", ")}` }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      mlroDecision: decision || existing.mlroDecision,
      mlroNotes: notes || existing.mlroNotes,
      mlroDecidedAt: new Date(),
      mlroDecidedBy: auth.user.id,
    };

    if (decision === "approve") {
      updateData.status = "approved";
    } else if (decision === "reject") {
      updateData.status = "rejected";
    } else if (decision === "request_more_info") {
      updateData.status = "pending_mlro";
    }

    // Mark as filed if a NCA reference is provided
    if (filingRef) {
      updateData.status = "filed";
      updateData.filedAt = new Date();
      updateData.filingRef = filingRef;
    }

    const sar = await db.sAR.update({ where: { id }, data: updateData });

    await writeAuditLog({
      caseId: existing.caseId ?? undefined,
      userId: auth.user.id,
      action: `SAR_${(decision || "UPDATED").toUpperCase()}`,
      performedBy: auth.user.id,
      resource: "SAR",
      resourceId: id,
      details: { decision, filingRef: filingRef || null },
    });

    return NextResponse.json({ sar });
  } catch (error) {
    console.error("SAR PATCH error:", error);
    return NextResponse.json({ error: "Failed to update SAR" }, { status: 500 });
  }
}
