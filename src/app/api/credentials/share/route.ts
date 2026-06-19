import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import { hasPermission, getDataScope, type UserRole } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';

// Credential-sharing: an authorised holder (or staff with identity access) can
// issue a secure, time-limited, consented share of a VERIFIED credential. The
// share exposes only a masked attestation — never full PII — and every share is
// written to the tamper-evident audit trail.

const SCOPE_LABELS: Record<string, string> = {
  identity_verification: 'Identity Verification',
  trust_level: 'Trust Level & Score',
  compliance_status: 'Compliance Status',
  right_to_rent: 'Right to Rent Eligibility',
};

function maskName(first: string, last: string): string {
  const f = first?.trim() || '';
  const l = last?.trim() || '';
  return `${f} ${l ? `${l[0]}.` : ''}`.trim();
}

// POST — create a secure credential share
export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  const role = auth.user.role as UserRole;

  try {
    const body = await request.json();
    const { profileId, recipientEmail, recipientOrg, scope, expiryDays, consent } = body as {
      profileId?: string; recipientEmail?: string; recipientOrg?: string;
      scope?: string[]; expiryDays?: number; consent?: boolean;
    };

    if (!consent) {
      return NextResponse.json({ error: 'Consent is required to share a credential.' }, { status: 400 });
    }
    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return NextResponse.json({ error: 'A valid recipient email is required.' }, { status: 400 });
    }
    const scopeList = (Array.isArray(scope) ? scope : []).filter((s) => s in SCOPE_LABELS);
    if (scopeList.length === 0) scopeList.push('identity_verification');
    const days = Math.min(Math.max(Number(expiryDays) || 7, 1), 90);

    // ── Resolve which credential is being shared (access control) ────────────
    const dataScope = getDataScope(role);
    let resolvedProfileId: string | undefined;
    if (dataScope === 'own') {
      // Holders share their own credential only.
      const own = await db.identityProfile.findFirst({ where: { userId: auth.user.id }, select: { id: true } });
      if (!own) {
        return NextResponse.json({ error: 'You do not have a verifiable credential to share. Complete identity verification first.', code: 'NO_CREDENTIAL' }, { status: 403 });
      }
      resolvedProfileId = own.id;
    } else if (hasPermission(role, 'identity:view') && profileId) {
      // Staff with identity access may share a specific applicant's credential.
      resolvedProfileId = profileId;
    } else {
      const own = await db.identityProfile.findFirst({ where: { userId: auth.user.id }, select: { id: true } });
      if (own) resolvedProfileId = own.id;
      else return NextResponse.json({ error: 'Select a verified applicant credential to share.', code: 'NO_TARGET' }, { status: 400 });
    }

    const profile = await db.identityProfile.findUnique({ where: { id: resolvedProfileId } });
    if (!profile) {
      return NextResponse.json({ error: 'Credential profile not found.' }, { status: 404 });
    }
    // Only approved (verified) credentials may be shared.
    if (profile.status !== 'verified') {
      return NextResponse.json({ error: 'Only approved (verified) credentials can be shared.', code: 'NOT_VERIFIED' }, { status: 403 });
    }

    const token = crypto.randomBytes(18).toString('base64url');
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const credentialRef = `VC-${profile.id.slice(-8).toUpperCase()}`;

    // ── Masked credential attestation (only the consented scope) ─────────────
    const credential: Record<string, unknown> = {
      reference: credentialRef,
      holder: maskName(profile.firstName, profile.lastName),
      verificationStatus: 'Verified',
      issuedBy: 'PropComply AI + VerifyMe Global',
    };
    if (scopeList.includes('trust_level')) {
      credential.trustLevel = `L${profile.trustLevel} / 5`;
      credential.trustScore = `${profile.trustScore} / 100`;
    }
    if (scopeList.includes('compliance_status')) {
      credential.compliance = 'Cleared — UK MLR 2017 CDD';
    }
    if (scopeList.includes('right_to_rent')) {
      credential.rightToRent = profile.trustLevel >= 2 ? 'Eligible (Immigration Act 2014)' : 'Not yet eligible';
    }

    const origin = request.headers.get('origin') ?? new URL(request.url).origin;
    const shareUrl = `${origin}/api/credentials/share?token=${token}`;

    // ── Audit trail (token stored as resourceId for verification lookup) ─────
    await writeAuditLog({
      profileId: resolvedProfileId,
      userId: auth.user.id,
      action: 'CREDENTIAL_SHARED',
      performedBy: auth.user.id,
      resource: 'IdentityCredential',
      resourceId: token,
      details: {
        token,
        recipientEmail,
        recipientOrg: recipientOrg ?? null,
        scope: scopeList,
        expiresAt: expiresAt.toISOString(),
        sharedBy: auth.user.email,
        credentialRef,
        credential,
      },
    });

    // ── Consent record (UK GDPR Art. 6(1)(a)) ────────────────────────────────
    await db.consentRecord.create({
      data: {
        profileId: resolvedProfileId,
        userId: auth.user.id,
        consentType: 'credential_sharing',
        granted: true,
        purpose: `Share verification credential with ${recipientEmail}${recipientOrg ? ` (${recipientOrg})` : ''}`,
        legalBasis: 'UK GDPR Art. 6(1)(a) — Consent',
        expiresAt,
      },
    });

    return NextResponse.json({
      token,
      shareUrl,
      expiresAt: expiresAt.toISOString(),
      recipientEmail,
      recipientOrg: recipientOrg ?? null,
      scope: scopeList,
      scopeLabels: scopeList.map((s) => SCOPE_LABELS[s]),
      credential,
    }, { status: 201 });
  } catch (error) {
    console.error('Credential share POST error:', error);
    return NextResponse.json({ error: 'Failed to share credential' }, { status: 500 });
  }
}

// GET ?token= — verify a shared credential (token-gated; for external recipients).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }
  try {
    const log = await db.auditLog.findFirst({
      where: { action: 'CREDENTIAL_SHARED', resourceId: token },
      orderBy: { timestamp: 'desc' },
    });
    if (!log || !log.details) {
      return NextResponse.json({ valid: false, error: 'Credential share not found' }, { status: 404 });
    }
    const details = JSON.parse(log.details) as { expiresAt?: string; recipientEmail?: string; credential?: unknown };
    const expired = details.expiresAt ? new Date(details.expiresAt) < new Date() : false;
    return NextResponse.json({
      valid: !expired,
      expired,
      sharedAt: log.timestamp,
      expiresAt: details.expiresAt ?? null,
      recipientEmail: details.recipientEmail ?? null,
      credential: expired ? null : details.credential ?? null,
    });
  } catch (error) {
    console.error('Credential share GET error:', error);
    return NextResponse.json({ error: 'Failed to verify credential' }, { status: 500 });
  }
}
