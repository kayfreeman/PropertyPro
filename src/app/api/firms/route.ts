import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@/lib/rbac";

const STAFF_ROLES = ["platform_admin", "mlro", "compliance_officer", "property_manager", "agent", "auditor"];

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  // Tenants/guarantors/landlords are not firm staff — no access
  if (!STAFF_ROLES.includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Non-admins can only see their own firm
    if (auth.user.role !== "platform_admin") {
      if (!auth.user.firmId) {
        return NextResponse.json({ firm: null });
      }
      const firm = await db.firm.findUnique({
        where: { id: auth.user.firmId },
        select: { id: true, name: true, firmType: true, riskAppetite: true, hmrcRegistration: true, amlPolicyVersion: true, isActive: true, createdAt: true },
      });
      return NextResponse.json({ firm });
    }

    // Platform admin can list all firms
    const firms = await db.firm.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, cases: true } },
      },
    });
    return NextResponse.json({ firms, total: firms.length });
  } catch (error) {
    console.error("Firms GET error:", error);
    return NextResponse.json({ error: "Failed to fetch firms" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, "firm:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, registrationNumber, firmType, hmrcRegistration, riskAppetite } = body;

    if (!name) return NextResponse.json({ error: "Firm name is required" }, { status: 400 });

    const firm = await db.firm.create({
      data: {
        name,
        registrationNumber: registrationNumber || null,
        firmType: firmType || "estate_agency",
        hmrcRegistration: hmrcRegistration || null,
        riskAppetite: riskAppetite || "standard",
      },
    });

    await writeAuditLog({
      userId: auth.user.id,
      action: "FIRM_CREATED",
      performedBy: auth.user.id,
      resource: "Firm",
      resourceId: firm.id,
      details: { firmName: name, firmType: firm.firmType },
    });

    return NextResponse.json({ firm }, { status: 201 });
  } catch (error) {
    console.error("Firms POST error:", error);
    return NextResponse.json({ error: "Failed to create firm" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, "firm:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) return NextResponse.json({ error: "Firm id is required" }, { status: 400 });

    // Non-admins can only update their own firm
    if (auth.user.role !== "platform_admin" && auth.user.firmId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowed = ["name", "riskAppetite", "hmrcRegistration", "amlPolicyVersion", "mlroId", "isActive"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) data[key] = fields[key];
    }

    const firm = await db.firm.update({ where: { id }, data });

    await writeAuditLog({
      userId: auth.user.id,
      action: "FIRM_UPDATED",
      performedBy: auth.user.id,
      resource: "Firm",
      resourceId: id,
      details: { updatedFields: Object.keys(data) },
    });

    return NextResponse.json({ firm });
  } catch (error) {
    console.error("Firms PATCH error:", error);
    return NextResponse.json({ error: "Failed to update firm" }, { status: 500 });
  }
}
