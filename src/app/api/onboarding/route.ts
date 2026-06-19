import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateOnboardingSchema = z.object({
  applicantEmail: z.string().email("Valid email required"),
  applicantName: z.string().min(1, "Applicant name is required").max(200),
  nationality: z.string().length(2).optional(),
  registrationMethod: z.enum(["email", "google", "microsoft"]).optional(),
  mfaEnforced: z.boolean().optional(),
  profileId: z.string().optional(),
});

// GET /api/onboarding — List onboarding processes with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const currentStep = searchParams.get('currentStep');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (currentStep) where.currentStep = parseInt(currentStep);

    const processes = await db.onboardingProcess.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.onboardingProcess.count({ where });

    // Compute summary stats
    const allProcesses = await db.onboardingProcess.findMany();
    const summary = {
      total: allProcesses.length,
      draft: allProcesses.filter(p => p.status === 'draft').length,
      in_progress: allProcesses.filter(p => p.status === 'in_progress').length,
      pending_review: allProcesses.filter(p => p.status === 'pending_review').length,
      certified: allProcesses.filter(p => p.status === 'certified').length,
      rejected: allProcesses.filter(p => p.status === 'rejected').length,
      avgConfidenceScore: allProcesses.length > 0
        ? Math.round(allProcesses.filter(p => p.overallConfidenceScore !== null).reduce((acc, p) => acc + (p.overallConfidenceScore || 0), 0) / Math.max(allProcesses.filter(p => p.overallConfidenceScore !== null).length, 1))
        : 0,
      autoCertified: allProcesses.filter(p => p.gatewayResult === 'auto_certified').length,
      manualReview: allProcesses.filter(p => p.gatewayResult === 'manual_review').length,
    };

    return NextResponse.json({
      processes,
      total,
      summary,
    });
  } catch (error) {
    console.error('Error fetching onboarding processes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding processes' },
      { status: 500 }
    );
  }
}

// POST /api/onboarding — Create new onboarding process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { applicantEmail, applicantName, nationality, registrationMethod, mfaEnforced, profileId } = parsed.data;

    // Check for existing process with same email
    const existing = await db.onboardingProcess.findFirst({
      where: { applicantEmail },
    });

    if (existing && existing.status !== 'rejected' && existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'An active onboarding process already exists for this email', existingId: existing.id },
        { status: 409 }
      );
    }

    const process = await db.onboardingProcess.create({
      data: {
        profileId: profileId || null,
        applicantEmail,
        applicantName,
        nationality: nationality || null,
        registrationMethod: registrationMethod || 'email',
        mfaEnforced: mfaEnforced || false,
        currentStep: 1,
        status: 'draft',
      },
    });

    return NextResponse.json({ process }, { status: 201 });
  } catch (error) {
    console.error('Error creating onboarding process:', error);
    return NextResponse.json(
      { error: 'Failed to create onboarding process' },
      { status: 500 }
    );
  }
}

// PATCH /api/onboarding — Update onboarding process step/status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, currentStep, status, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Process id is required' },
        { status: 400 }
      );
    }

    const existing = await db.onboardingProcess.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Onboarding process not found' },
        { status: 404 }
      );
    }

    // Build update data object with only allowed fields
    const allowedFields: string[] = [
      'profileId',
      'nationality',
      'registrationMethod',
      'mfaEnforced',
      'passportUploaded',
      'visaUploaded',
      'financialFilesUploaded',
      'selfieCaptured',
      'livenessScore',
      'faceMatchScore',
      'deepfakeScore',
      'biometricConfidence',
      'financialMonthsAnalyzed',
      'incomeStability',
      'spendingCoherence',
      'professionMatch',
      'sourceCountryDb',
      'sourceCountryVerified',
      'homeOfficeVerified',
      'professionalRegistryVerified',
      'biometricScore',
      'behaviouralScore',
      'jurisdictionalScore',
      'overallConfidenceScore',
      'gatewayPassed',
      'gatewayResult',
      'identityRisk',
      'amlRisk',
      'financialRisk',
      'tenancyRisk',
      'credentialIssued',
      'credentialToken',
      'agentReviewed',
      'agentDecision',
      'reviewedBy',
    ];

    const updateData: Record<string, unknown> = {};
    if (currentStep !== undefined) updateData.currentStep = currentStep;
    if (status !== undefined) updateData.status = status;

    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        updateData[key] = updateFields[key];
      }
    }

    const process = await db.onboardingProcess.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ process });
  } catch (error) {
    console.error('Error updating onboarding process:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding process' },
      { status: 500 }
    );
  }
}
