import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDataScope } from "@/lib/rbac";
import { requireSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const userId = auth.user.id;
    const scope = getDataScope(auth.user.role as Parameters<typeof getDataScope>[0]);

    // Tenants can't see partners
    if (scope === "own") {
      return NextResponse.json({ partners: [], total: 0, summary: { byPartnerType: [], referralsByStatus: {}, referralsByType: {} } });
    }

    // Partner users with no userId: return empty data (data isolation)
    if (scope === "partner_only" && !userId) {
      return NextResponse.json({ partners: [], total: 0, summary: { byPartnerType: [], referralsByStatus: {}, referralsByType: {} } });
    }

    // Partner users: only see the partner they belong to
    let partnerWhere: Record<string, unknown> = {};
    if (scope === "partner_only" && userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { partnerId: true },
      });
      if (!user?.partnerId) {
        return NextResponse.json({ partners: [], total: 0, summary: { byPartnerType: [], referralsByStatus: {}, referralsByType: {} } });
      }
      partnerWhere = { id: user.partnerId };
    }

    const partners = await db.partner.findMany({
      where: partnerWhere,
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
      where: partnerWhere,
      _count: { partnerType: true },
      _avg: { trustRating: true },
    });

    // For partner_user, scope referral summaries to their partner
    const referralWhere = scope === "partner_only" && userId
      ? (() => {
          const user = partners.length > 0 ? { partnerId: partners[0].id } : {};
          return user;
        })()
      : undefined;

    const referralStatusBreakdown = await db.partnerReferral.groupBy({
      by: ["status"],
      where: referralWhere,
      _count: { status: true },
    });

    const referralTypeBreakdown = await db.partnerReferral.groupBy({
      by: ["referralType"],
      where: referralWhere,
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
