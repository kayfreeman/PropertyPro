import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: List RTR processes with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const profileId = searchParams.get('profileId');
    const propertyId = searchParams.get('propertyId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (profileId) where.profileId = profileId;
    if (propertyId) where.propertyId = propertyId;

    const processes = await db.rightToRentProcess.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.rightToRentProcess.count({ where });

    // Compute summary breakdowns
    const allProcesses = await db.rightToRentProcess.findMany();
    const byStatus: Record<string, number> = {};
    const byComplianceResult: Record<string, number> = {};
    const byAlertStatus: Record<string, number> = {};
    let withCertificate = 0;
    let monitoringActive = 0;

    for (const p of allProcesses) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      if (p.complianceResult) {
        byComplianceResult[p.complianceResult] = (byComplianceResult[p.complianceResult] || 0) + 1;
      }
      if (p.alertStatus) {
        byAlertStatus[p.alertStatus] = (byAlertStatus[p.alertStatus] || 0) + 1;
      }
      if (p.certificateIssued) withCertificate++;
      if (p.monitoringActive) monitoringActive++;
    }

    return NextResponse.json({
      processes,
      total,
      summary: {
        byStatus,
        byComplianceResult,
        byAlertStatus,
        withCertificate,
        monitoringActive,
        totalProcessed: allProcesses.length,
      },
    });
  } catch (error) {
    console.error('RTR Process GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Right to Rent processes' },
      { status: 500 }
    );
  }
}

// POST: Create new RTR process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.initiatedBy) {
      return NextResponse.json(
        { error: 'initiatedBy is required' },
        { status: 400 }
      );
    }

    const process = await db.rightToRentProcess.create({
      data: {
        profileId: body.profileId || null,
        agentId: body.agentId || null,
        propertyId: body.propertyId || null,
        currentStep: 1,
        status: 'initiated',
        initiatedBy: body.initiatedBy,
        checkReason: body.checkReason || null,
        visaType: body.visaType || null,
      },
    });

    return NextResponse.json({ process }, { status: 201 });
  } catch (error) {
    console.error('RTR Process POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create Right to Rent process' },
      { status: 500 }
    );
  }
}

// PATCH: Update RTR process step/status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Process id is required' },
        { status: 400 }
      );
    }

    const existing = await db.rightToRentProcess.findUnique({
      where: { id: body.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Right to Rent process not found' },
        { status: 404 }
      );
    }

    // Build update data from allowed fields
    const updateData: Record<string, unknown> = {};

    // Core fields
    if (body.currentStep !== undefined) updateData.currentStep = body.currentStep;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.profileId !== undefined) updateData.profileId = body.profileId;
    if (body.propertyId !== undefined) updateData.propertyId = body.propertyId;
    if (body.agentId !== undefined) updateData.agentId = body.agentId;
    if (body.checkReason !== undefined) updateData.checkReason = body.checkReason;

    // Step 2 fields
    if (body.visaType !== undefined) updateData.visaType = body.visaType;
    if (body.documentAuthentic !== undefined) updateData.documentAuthentic = body.documentAuthentic;
    if (body.tamperingCheck !== undefined) updateData.tamperingCheck = body.tamperingCheck;
    if (body.ocrConfidence !== undefined) updateData.ocrConfidence = body.ocrConfidence;

    // Step 3 fields
    if (body.visaGrantValid !== undefined) updateData.visaGrantValid = body.visaGrantValid;
    if (body.ukResidenceData !== undefined) updateData.ukResidenceData = body.ukResidenceData;
    if (body.immigrationPermissions !== undefined) updateData.immigrationPermissions = body.immigrationPermissions;
    if (body.homeOfficeCheckDate !== undefined) updateData.homeOfficeCheckDate = body.homeOfficeCheckDate;

    // Step 4 fields
    if (body.permanentRight !== undefined) updateData.permanentRight = body.permanentRight;
    if (body.timeLimitedStatus !== undefined) updateData.timeLimitedStatus = body.timeLimitedStatus;
    if (body.expiryDate !== undefined) updateData.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
    if (body.restrictions !== undefined) updateData.restrictions = body.restrictions;

    // Step 5 fields
    if (body.complianceResult !== undefined) updateData.complianceResult = body.complianceResult;
    if (body.rulesEngineResult !== undefined) updateData.rulesEngineResult = body.rulesEngineResult;
    if (body.statutoryGuidelineMet !== undefined) updateData.statutoryGuidelineMet = body.statutoryGuidelineMet;

    // Step 6 fields
    if (body.certificateIssued !== undefined) updateData.certificateIssued = body.certificateIssued;
    if (body.certificateToken !== undefined) updateData.certificateToken = body.certificateToken;
    if (body.evidenceTrailRef !== undefined) updateData.evidenceTrailRef = body.evidenceTrailRef;
    if (body.issuedAt !== undefined) updateData.issuedAt = body.issuedAt ? new Date(body.issuedAt) : null;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    // Step 7 fields
    if (body.monitoringActive !== undefined) updateData.monitoringActive = body.monitoringActive;
    if (body.daysToExpiry !== undefined) updateData.daysToExpiry = body.daysToExpiry;
    if (body.lastAlertSent !== undefined) updateData.lastAlertSent = body.lastAlertSent ? new Date(body.lastAlertSent) : null;
    if (body.alertStatus !== undefined) updateData.alertStatus = body.alertStatus;

    const updated = await db.rightToRentProcess.update({
      where: { id: body.id },
      data: updateData,
    });

    return NextResponse.json({ process: updated });
  } catch (error) {
    console.error('RTR Process PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update Right to Rent process' },
      { status: 500 }
    );
  }
}
