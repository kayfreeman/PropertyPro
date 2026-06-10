import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDataScope, type UserRole } from '@/lib/rbac';

// GET /api/property-applications — List property applications (scoped by role)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role') as string | null;
    const status = searchParams.get('status');
    const applicationType = searchParams.get('applicationType');

    const scope = getDataScope((role as Parameters<typeof getDataScope>[0]) ?? 'tenant');

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

// POST /api/property-applications — Create a new property application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      propertyId,
      profileId,
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

    // Validation
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }
    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }
    if (!applicationType || !['tenancy', 'purchase', 'rental'].includes(applicationType)) {
      return NextResponse.json({ error: 'Valid application type is required (tenancy, purchase, rental)' }, { status: 400 });
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
