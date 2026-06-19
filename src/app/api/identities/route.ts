import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDataScope } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const CreateIdentitySchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Valid email address required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().length(2).optional(),
  trustLevel: z.number().int().min(0).max(5).optional(),
  trustScore: z.number().min(0).max(100).optional(),
  status: z.enum(["pending", "verified", "suspended", "rejected"]).optional(),
  consentGiven: z.boolean().optional(),
  gdprCompliant: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const userId = auth.user.id;
    const scope = getDataScope(auth.user.role as Parameters<typeof getDataScope>[0]);

    // partner_user cannot see identity profiles
    if (scope === "partner_only") {
      return NextResponse.json({ identities: [], total: 0 });
    }

    // Tenant users can only see their own profile(s)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: any = {};
    if (scope === "own") {
      if (!userId) {
        // No userId provided for tenant role — return empty
        return NextResponse.json({ identities: [], total: 0 });
      }
      where = { userId };
    }

    const identities = await db.identityProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        credentials: {
          orderBy: { createdAt: "desc" },
        },
        evidence: {
          orderBy: { createdAt: "desc" },
        },
        verifications: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            complianceChecks: true,
            riskScores: true,
            propertyApps: true,
            auditLogs: true,
          },
        },
      },
    });

    return NextResponse.json({ identities, total: identities.length });
  } catch (error) {
    console.error("Identities GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch identities" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = CreateIdentitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { firstName, lastName, email, phone, dateOfBirth, nationality, trustLevel, trustScore, status, consentGiven, gdprCompliant } = parsed.data;

    const data = {
      firstName,
      lastName,
      email,
      phone: phone || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      nationality: nationality || null,
      trustLevel: trustLevel ?? 0,
      trustScore: trustScore ?? 0,
      status: status ?? "pending",
      consentGiven: consentGiven ?? false,
      gdprCompliant: gdprCompliant ?? false,
    };

    const scope = getDataScope(auth.user.role as Parameters<typeof getDataScope>[0]);

    // Tenant self-onboarding: link the profile to the signed-in user so it
    // surfaces on their "My Profile" view on every login. Upsert by user (or
    // adopt an existing same-email profile) so re-running onboarding updates
    // rather than failing on the unique email.
    if (scope === "own" && auth.user.id) {
      const existing =
        (await db.identityProfile.findFirst({ where: { userId: auth.user.id } })) ??
        (await db.identityProfile.findUnique({ where: { email } }));

      const profile = existing
        ? await db.identityProfile.update({
            where: { id: existing.id },
            data: { ...data, userId: auth.user.id },
            include: { credentials: true, evidence: true, verifications: true },
          })
        : await db.identityProfile.create({
            data: { ...data, userId: auth.user.id },
            include: { credentials: true, evidence: true, verifications: true },
          });

      await db.auditLog.create({
        data: {
          profileId: profile.id,
          action: existing ? "PROFILE_UPDATED" : "PROFILE_CREATED",
          performedBy: auth.user.id,
          resource: "IdentityProfile",
          resourceId: profile.id,
          details: JSON.stringify({ source: "self_onboarding", linkedUserId: auth.user.id }),
        },
      });

      if (consentGiven) {
        await db.consentRecord.create({
          data: {
            profileId: profile.id,
            consentType: "identity_verification",
            granted: true,
            purpose: "Identity verification and compliance screening under UK MLR 2017",
            legalBasis: "consent",
            expiresAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return NextResponse.json({ identity: profile }, { status: existing ? 200 : 201 });
    }

    // Non-tenant (e.g. agent onboarding an applicant): create unlinked profile.
    const dup = await db.identityProfile.findUnique({ where: { email } });
    if (dup) {
      return NextResponse.json(
        { error: "A profile with this email already exists" },
        { status: 409 }
      );
    }

    const profile = await db.identityProfile.create({
      data,
      include: {
        credentials: true,
        evidence: true,
        verifications: true,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        profileId: profile.id,
        action: "PROFILE_CREATED",
        performedBy: auth.user.id ?? "api",
        resource: "IdentityProfile",
        resourceId: profile.id,
        details: JSON.stringify({ source: "agent_onboarding" }),
      },
    });

    // Record GDPR consent if given (UK GDPR Art.7 — consent must be traceable)
    if (consentGiven) {
      await db.consentRecord.create({
        data: {
          profileId: profile.id,
          consentType: "identity_verification",
          granted: true,
          purpose: "Identity verification and compliance screening under UK MLR 2017",
          legalBasis: "consent",
          expiresAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3-year retention
        },
      });
    }

    return NextResponse.json({ identity: profile }, { status: 201 });
  } catch (error) {
    console.error("Identities POST error:", error);
    return NextResponse.json(
      { error: "Failed to create identity profile" },
      { status: 500 }
    );
  }
}
