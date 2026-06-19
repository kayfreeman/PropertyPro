import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import type { UserRole } from "@/lib/rbac";

export async function GET(request: Request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, "audit:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Firm-scoped: platform_admin sees all, others see their firm only
    const firmFilter = auth.user.role === "platform_admin" ? {} :
      auth.user.firmId ? { userId: { in: await getFirmUserIds(auth.user.firmId) } } : { id: "none" };

    const [auditLogs, total] = await Promise.all([
      db.auditLog.findMany({
        skip,
        take: limit,
        where: firmFilter,
        orderBy: { timestamp: "desc" },
        include: {
          profile: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      db.auditLog.count({ where: firmFilter }),
    ]);

    return NextResponse.json({
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        profileId: log.profileId,
        caseId: log.caseId,
        action: log.action,
        performedBy: log.performedBy,
        resource: log.resource,
        resourceId: log.resourceId,
        details: log.details,
        ipAddress: log.ipAddress,
        hashChain: log.hashChain,
        timestamp: log.timestamp,
        profile: log.profile
          ? { id: log.profile.id, name: `${log.profile.firstName} ${log.profile.lastName}`, email: log.profile.email }
          : null,
      })),
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Audit GET error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

async function getFirmUserIds(firmId: string): Promise<string[]> {
  const users = await db.user.findMany({ where: { firmId }, select: { id: true } });
  return users.map(u => u.id);
}
