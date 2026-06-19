import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDataScope, type UserRole } from '@/lib/rbac';
import { requireSession } from '@/lib/session';

// GET /api/property-applications — List property applications (scoped by role)
export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const userId = auth.user.id;
    const status = searchParams.get('status');
    const applicationType = searchParams.get('applicationType');

    const scope = getDataScope(auth.user.role as Parameters<typeof getDataScope>[0]);

    // For tenant: find their profile first
    let profileId: string | null = null;
    if (scope === 'own' && userId) {
      const profile = await db.identityProfile.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (!profile) {
        return NextResponse.json({ applications: [], total: 0 });
      }
      profileId = profile.id;
    }

    const where: Record<string, unknown> = {};
    if (scope === 'own' && profileId) {
      where.profileId = profileId;
    }
    if (status) {
      where.status = status;
    }
    if (applicationType) {
      where.applicationType = applicationType;
    }

    const applications = await db.propertyApplication.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { submittedAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            postcode: true,
            propertyType: true,
            complianceStatus: true,
          },
        },
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            nationality: true,
            trustLevel: true,
            trustScore: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      applications,
      total: applications.length,
    });
  } catch (error) {
    console.error('Property Applications GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property applications' },
      { status: 500 }
    );
  }
}

// Maps a non-verified identity status to a clear, user-facing prerequisite message
function identityPrerequisiteMessage(status: string | undefined): string {
  switch (status) {
    case 'pending':
    case 'in_progress':
      return 'Your identity verification is still in progress. Complete onboarding before applying for a property.';
    case 'rejected':
    case 'failed':
      return 'Your identity verification was not successful. Please resolve the issues and re-verify before applying.';
    case 'expired':
      return 'Your identity verification has expired. Please re-verify your identity before applying.';
    case 'suspended':
      return 'Your profile is currently suspended. Contact support before applying for a property.';
    default:
      return 'You must complete Identity & Trust verification before applying for a property.';
  }
}

// POST /api/property-applications — Create a new property application
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      propertyId,
      applicationType,
      complianceClear,
      riskClear,
      rightToRent,
      guarantorReplaced,
      depositAmount,
      monthlyAmount,
      startDate,
      endDate,
    } = body;

    const scope = getDataScope(auth.user.role as UserRole);

    // Validation
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }
    if (!applicationType || !['tenancy', 'purchase', 'rental'].includes(applicationType)) {
      return NextResponse.json({ error: 'Valid application type is required (tenancy, purchase, rental)' }, { status: 400 });
    }

    // Resolve the applicant profile. Tenants may only apply as themselves — the
    // profile is taken from their own user link, never trusted from the client.
    let profileId: string | undefined;
    if (scope === 'own') {
      const ownProfile = await db.identityProfile.findFirst({ where: { userId: auth.user.id } });
      if (!ownProfile) {
        return NextResponse.json(
          { error: 'You must complete Identity & Trust verification before applying for a property.', code: 'IDENTITY_REQUIRED' },
          { status: 403 }
        );
      }
      profileId = ownProfile.id;
    } else {
      profileId = body.profileId;
      if (!profileId) {
        return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
      }
    }

    // Verify property exists
    const property = await db.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Verify profile exists
    const profile = await db.identityProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // AC1 — Right to Rent eligibility gate: identity must be successfully verified.
    // Block submission when verification is incomplete, pending, failed or expired.
    if (profile.status !== 'verified') {
      return NextResponse.json(
        {
          error: identityPrerequisiteMessage(profile.status),
          code: 'IDENTITY_NOT_VERIFIED',
          identityStatus: profile.status,
        },
        { status: 403 }
      );
    }

    // Create application
    const application = await db.propertyApplication.create({
      data: {
        propertyId,
        profileId,
        applicationType,
        status: 'submitted',
        complianceClear: complianceClear ?? false,
        riskClear: riskClear ?? false,
        rightToRent: rightToRent || 'pending',
        guarantorReplaced: guarantorReplaced ?? false,
        depositAmount: depositAmount ? parseFloat(String(depositAmount)) : null,
        monthlyAmount: monthlyAmount ? parseFloat(String(monthlyAmount)) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        submittedAt: new Date(),
      },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            postcode: true,
            propertyType: true,
          },
        },
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            trustLevel: true,
            trustScore: true,
          },
        },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        profileId,
        action: 'PROPERTY_APPLICATION_SUBMITTED',
        performedBy: profileId,
        resource: 'property_application',
        resourceId: application.id,
        details: JSON.stringify({
          propertyId,
          applicationType,
          depositAmount,
          monthlyAmount,
        }),
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Property Applications POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create property application' },
      { status: 500 }
    );
  }
}
