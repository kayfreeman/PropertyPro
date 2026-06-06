import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const properties = await db.property.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        applications: {
          orderBy: { submittedAt: "desc" },
          include: {
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                nationality: true,
                trustLevel: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Property summary
    const totalProperties = properties.length;
    const complianceStatusBreakdown = await db.property.groupBy({
      by: ["complianceStatus"],
      _count: { complianceStatus: true },
    });
    const propertyTypeBreakdown = await db.property.groupBy({
      by: ["propertyType"],
      _count: { propertyType: true },
    });
    const applicationStatusBreakdown = await db.propertyApplication.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    return NextResponse.json({
      properties,
      total: totalProperties,
      summary: {
        byComplianceStatus: Object.fromEntries(
          complianceStatusBreakdown.map((c) => [
            c.complianceStatus,
            c._count.complianceStatus,
          ])
        ),
        byPropertyType: Object.fromEntries(
          propertyTypeBreakdown.map((p) => [
            p.propertyType,
            p._count.propertyType,
          ])
        ),
        applicationsByStatus: Object.fromEntries(
          applicationStatusBreakdown.map((a) => [a.status, a._count.status])
        ),
      },
    });
  } catch (error) {
    console.error("Properties GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
