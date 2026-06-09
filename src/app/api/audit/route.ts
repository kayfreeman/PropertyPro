import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    const [auditLogs, total] = await Promise.all([
      db.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { timestamp: "desc" },
        include: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      db.auditLog.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        profileId: log.profileId,
        action: log.action,
        performedBy: log.performedBy,
        resource: log.resource,
        resourceId: log.resourceId,
        details: log.details,
        ipAddress: log.ipAddress,
        timestamp: log.timestamp,
        profile: log.profile
          ? {
              id: log.profile.id,
              name: `${log.profile.firstName} ${log.profile.lastName}`,
              email: log.profile.email,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Audit GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
