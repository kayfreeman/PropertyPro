import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const identities = await db.identityProfile.findMany({
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
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      nationality,
      consentGiven,
      gdprCompliant,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "firstName, lastName, and email are required" },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existing = await db.identityProfile.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A profile with this email already exists" },
        { status: 409 }
      );
    }

    const profile = await db.identityProfile.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        dateOfBirth: dateOfBirth || null,
        nationality: nationality || null,
        trustLevel: 0,
        trustScore: 0,
        status: "pending",
        consentGiven: consentGiven ?? false,
        gdprCompliant: gdprCompliant ?? false,
      },
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
        performedBy: "api",
        resource: "IdentityProfile",
        resourceId: profile.id,
        details: JSON.stringify({ source: "api_registration" }),
      },
    });

    return NextResponse.json({ identity: profile }, { status: 201 });
  } catch (error) {
    console.error("Identities POST error:", error);
    return NextResponse.json(
      { error: "Failed to create identity profile" },
      { status: 500 }
    );
  }
}
