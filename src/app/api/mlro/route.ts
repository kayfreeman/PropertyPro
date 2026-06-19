// MLRO Workspace API — exclusive to MLRO and platform_admin roles
// Provides MLRO dashboard: pending SARs, pending EDD sign-offs, audit chain status

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireMLRO } from "@/lib/session";
import { verifyAuditChain } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const auth = await requireMLRO();
  if (auth.error) return auth.error;

  try {
    const firmFilter = auth.user.role !== "platform_admin" && auth.user.firmId
      ? { firmId: auth.user.firmId }
      : {};

    const [
      pendingSARs,
      pendingEDDSignOff,
      openCases,
      recentAuditLogs,
      sarStats,
    ] = await Promise.all([
      db.sAR.findMany({
        where: { ...firmFilter, status: { in: ["draft", "pending_mlro"] } },
        orderBy: { createdAt: "asc" },
        include: { case: { select: { caseRef: true, riskLevel: true } } },
      }),
      db.case.findMany({
        where: { ...firmFilter, status: "pending_mlro", mlroSignOffRequired: true },
        orderBy: { updatedAt: "asc" },
        include: {
          profile: { select: { id: true, firstName: true, lastName: true, nationality: true } },
          actions: { orderBy: { performedAt: "desc" }, take: 1 },
        },
      }),
      db.case.findMany({
        where: { ...firmFilter, status: { in: ["open", "pending_edd", "pending_mlro", "pending_sar"] } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          profile: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      db.auditLog.findMany({
        where: firmFilter.firmId ? { userId: { in: await getFirmUserIds(firmFilter.firmId) } } : {},
        orderBy: { timestamp: "desc" },
        take: 20,
        select: { id: true, action: true, performedBy: true, resource: true, timestamp: true, hashChain: true },
      }),
      db.sAR.groupBy({
        by: ["status"],
        where: firmFilter,
        _count: { status: true },
      }),
    ]);

    return NextResponse.json({
      mlroUser: {
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        firmId: auth.user.firmId,
        firmName: auth.user.firmName,
      },
      workQueue: {
        pendingSARs,
        pendingEDDSignOff,
        totalPending: pendingSARs.length + pendingEDDSignOff.length,
      },
      openCases,
      recentAuditLogs,
      sarStats: Object.fromEntries(sarStats.map(s => [s.status, s._count.status])),
    });
  } catch (error) {
    console.error("MLRO GET error:", error);
    return NextResponse.json({ error: "Failed to fetch MLRO workspace" }, { status: 500 });
  }
}

// MLRO sign-off action — unified endpoint for EDD sign-off and SAR decisions
export async function POST(request: Request) {
  const auth = await requireMLRO();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { actionType, targetId, decision, notes } = body;

    if (!actionType || !targetId) {
      return NextResponse.json({ error: "actionType and targetId are required" }, { status: 400 });
    }

    if (actionType === "verify_audit_chain") {
      const result = await verifyAuditChain();
      return NextResponse.json({ auditChainVerification: result });
    }

    return NextResponse.json({ error: `Unknown actionType: ${actionType}` }, { status: 400 });
  } catch (error) {
    console.error("MLRO POST error:", error);
    return NextResponse.json({ error: "Failed to process MLRO action" }, { status: 500 });
  }
}

async function getFirmUserIds(firmId: string): Promise<string[]> {
  const users = await db.user.findMany({ where: { firmId }, select: { id: true } });
  return users.map(u => u.id);
}
