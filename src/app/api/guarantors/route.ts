import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import { writeAuditLog } from '@/lib/audit';
import { z } from 'zod';

const GuarantorSchema = z.object({
  profileId: z.string().min(1),
  applicationId: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  housingTypes: z.array(z.string()).min(1, 'At least one housing type required'),
  passportRef: z.string().optional(),
  proofOfAddressRef: z.string().optional(),
  incomeProofRef: z.string().optional(),
  consentGiven: z.boolean(),
});

// GET /api/guarantors — list guarantor submissions for the authenticated user's profile
export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    // Tenants can only see their own guarantors
    if (auth.user.role === 'tenant') {
      const profile = await db.identityProfile.findFirst({
        where: { userId: auth.user.id },
        select: { id: true },
      });
      if (!profile) return NextResponse.json({ guarantors: [] });

      const guarantors = await db.guarantorSubmission.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ guarantors });
    }

    // Staff can query by profileId
    const where = profileId ? { profileId } : undefined;
    const guarantors = await db.guarantorSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { profile: { select: { firstName: true, lastName: true, email: true } } },
    });
    return NextResponse.json({ guarantors, total: guarantors.length });
  } catch (error) {
    console.error('Guarantors GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch guarantors' }, { status: 500 });
  }
}

// POST /api/guarantors — submit a new guarantor
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = GuarantorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { profileId, applicationId, firstName, lastName, email, phone, housingTypes, passportRef, proofOfAddressRef, incomeProofRef, consentGiven } = parsed.data;

    // Tenants may only submit for their own profile
    if (auth.user.role === 'tenant') {
      const profile = await db.identityProfile.findFirst({
        where: { userId: auth.user.id },
        select: { id: true },
      });
      if (!profile || profile.id !== profileId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Verify profile exists
    const profile = await db.identityProfile.findUnique({ where: { id: profileId } });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const guarantor = await db.guarantorSubmission.create({
      data: {
        profileId,
        applicationId: applicationId ?? null,
        firstName,
        lastName,
        email,
        phone: phone ?? null,
        housingTypes: JSON.stringify(housingTypes),
        passportRef: passportRef ?? null,
        proofOfAddressRef: proofOfAddressRef ?? null,
        incomeProofRef: incomeProofRef ?? null,
        consentGiven,
        consentTimestamp: consentGiven ? new Date() : null,
        status: 'submitted',
      },
    });

    await writeAuditLog({
      userId: auth.user.id,
      action: 'GUARANTOR_SUBMITTED',
      performedBy: auth.user.id,
      resource: 'GuarantorSubmission',
      resourceId: guarantor.id,
      details: { profileId, housingTypes, consentGiven },
    });

    return NextResponse.json({ guarantor }, { status: 201 });
  } catch (error) {
    console.error('Guarantors POST error:', error);
    return NextResponse.json({ error: 'Failed to submit guarantor' }, { status: 500 });
  }
}

// PATCH /api/guarantors — update guarantor review status (staff only)
export async function PATCH(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (auth.user.role === 'tenant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status, notes } = body as { id: string; status: string; notes?: string };

    if (!id) return NextResponse.json({ error: 'Guarantor ID is required' }, { status: 400 });

    const guarantor = await db.guarantorSubmission.update({
      where: { id },
      data: {
        status,
        notes: notes ?? null,
        reviewedBy: auth.user.id,
        reviewedAt: new Date(),
      },
    });

    await writeAuditLog({
      userId: auth.user.id,
      action: 'GUARANTOR_REVIEWED',
      performedBy: auth.user.id,
      resource: 'GuarantorSubmission',
      resourceId: id,
      details: { status, notes },
    });

    return NextResponse.json({ guarantor });
  } catch (error) {
    console.error('Guarantors PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update guarantor' }, { status: 500 });
  }
}
