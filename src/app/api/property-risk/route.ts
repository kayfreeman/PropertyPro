import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { scorePropertyRisk, requiresPropertyEDD, type EPCRating } from "@/lib/property-risk";
import { lookupEPC, type EPCRecord } from "@/lib/mocks/epc-register";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, "risk:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { propertyId, postcode, transactionAmount, transactionType } = body;

    const property = propertyId
      ? await db.property.findUnique({ where: { id: propertyId } })
      : null;

    if (propertyId && !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Look up EPC rating if postcode provided or use property's existing rating
    let epcRecord: EPCRecord | null = null;
    const lookupPostcode = (postcode ?? property?.postcode) as string | undefined;
    if (lookupPostcode) {
      epcRecord = await lookupEPC(lookupPostcode, property?.address ?? undefined);
      // Persist EPC rating back to property if not already set
      if (property && !property.epcRating && epcRecord) {
        await db.property.update({
          where: { id: propertyId },
          data: { epcRating: epcRecord.currentEnergyRating },
        });
      }
    }

    const riskInput = {
      epcRating: (epcRecord?.currentEnergyRating ?? property?.epcRating ?? undefined) as EPCRating | undefined,
      hmoLicensed: property?.hmoLicensed ?? false,
      propertyType: property?.propertyType,
      ownershipComplex: property?.ownershipComplex ?? false,
      lastSalePrice: property?.lastSalePrice ?? null,
      transactionAmount: transactionAmount ? parseFloat(String(transactionAmount)) : null,
      transactionType: (transactionType ?? property?.transactionType) as string | null | undefined,
    };

    const result = scorePropertyRisk(riskInput);
    const eddRequired = requiresPropertyEDD(result);

    await writeAuditLog({
      userId: auth.user.id,
      action: "PROPERTY_RISK_SCORED",
      performedBy: auth.user.id,
      resource: "Property",
      resourceId: propertyId || "adhoc",
      details: {
        postcode: lookupPostcode,
        propertyRisk: result.propertyRisk,
        eddRequired,
        riskFactors: result.riskFactors,
      },
    });

    return NextResponse.json({
      propertyRisk: result,
      epcRecord,
      eddRequired,
      recommendation: eddRequired
        ? "Enhanced Due Diligence required due to property risk factors"
        : "Standard CDD sufficient for this property",
    });
  } catch (error) {
    console.error("Property risk error:", error);
    return NextResponse.json({ error: "Failed to score property risk" }, { status: 500 });
  }
}
