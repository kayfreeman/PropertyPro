import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const partners = await db.partner.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        referrals: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { referrals: true },
        },
      },
    });

    // Enrich referrals with profile info
    const referralProfileIds = partners
      .flatMap((p) => p.referrals)
      .map((r) => r.profileId)
      .filter((id): id is string => id !== null);

    const referralProfiles = referralProfileIds.length > 0
      ? await db.identityProfile.findMany({
          where: { id: { in: referralProfileIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        })
      : [];

    const profileMap = new Map(referralProfiles.map((p) => [p.id, p]));

    const enrichedPartners = partners.map((partner) => ({
      ...partner,
      referrals: partner.referrals.map((referral) => ({
        ...referral,
        profile: referral.profileId
          ? profileMap.get(referral.profileId) || null
          : null,
      })),
    }));

    // Partner summary
    const partnerTypeBreakdown = await db.partner.groupBy({
      by: ["partnerType"],
      _count: { partnerType: true },
      _avg: { trustRating: true },
    });

    const referralStatusBreakdown = await db.partnerReferral.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const referralTypeBreakdown = await db.partnerReferral.groupBy({
      by: ["referralType"],
      _count: { referralType: true },
    });

    return NextResponse.json({
      partners: enrichedPartners,
      total: partners.length,
      summary: {
        byPartnerType: partnerTypeBreakdown.map((pt) => ({
          type: pt.partnerType,
          count: pt._count.partnerType,
          avgTrustRating: Math.round((pt._avg.trustRating ?? 0) * 10) / 10,
        })),
        referralsByStatus: Object.fromEntries(
          referralStatusBreakdown.map((r) => [r.status, r._count.status])
        ),
        referralsByType: Object.fromEntries(
          referralTypeBreakdown.map((r) => [r.referralType, r._count.referralType])
        ),
      },
    });
  } catch (error) {
    console.error("Partners GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}
