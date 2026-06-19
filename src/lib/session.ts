import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  firmId: string | null;
  firmName: string | null;
  avatar: string;
  department?: string;
  jobTitle?: string;
  mfaEnabled: boolean;
};

export async function requireSession(): Promise<
  { user: SessionUser; error?: never } | { user?: never; error: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }),
    };
  }

  return { user: session.user as SessionUser };
}

export async function requireRole(
  allowedRoles: string[]
): Promise<{ user: SessionUser; error?: never } | { user?: never; error: NextResponse }> {
  const result = await requireSession();
  if (result.error) return result;

  if (!allowedRoles.includes(result.user.role)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return result;
}

export async function requireMLRO() {
  return requireRole(['mlro', 'platform_admin']);
}

export async function requireComplianceOrAbove() {
  return requireRole(['mlro', 'platform_admin', 'compliance_officer']);
}

export async function getOptionalSession() {
  const session = await getServerSession(authOptions);
  return session?.user ? (session.user as SessionUser) : null;
}
