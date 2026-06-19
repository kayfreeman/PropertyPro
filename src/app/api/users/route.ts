import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import { hasPermission } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';
import type { UserRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  if (!hasPermission(auth.user.role as UserRole, 'users:view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const roleFilter = searchParams.get('role');

    // Firm-scoped: platform_admin sees all firms, others see their firm only
    const firmFilter = auth.user.role === 'platform_admin' ? {} :
      auth.user.firmId ? { firmId: auth.user.firmId } : { id: 'none' };

    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, name: true, role: true, avatar: true,
          department: true, jobTitle: true, phone: true,
          mfaEnabled: true, lastLoginAt: true, isActive: true,
          createdAt: true, updatedAt: true, firmId: true,
          _count: { select: { auditLogs: true, notifications: true } },
        },
      });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      // Users can only see their own profile, or admins can see all
      if (auth.user.id !== userId && !hasPermission(auth.user.role as UserRole, 'users:manage')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json(user);
    }

    const where = { ...firmFilter, ...(roleFilter ? { role: roleFilter } : {}) };
    const users = await db.user.findMany({
      where,
      select: {
        id: true, email: true, name: true, role: true, avatar: true,
        department: true, jobTitle: true, isActive: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const roleBreakdown: Record<string, number> = {};
    users.forEach(u => { roleBreakdown[u.role] = (roleBreakdown[u.role] || 0) + 1; });

    return NextResponse.json({
      users,
      summary: { total: users.length, active: users.filter(u => u.isActive).length, roleBreakdown },
    });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, name, phone, jobTitle, department, mfaEnabled, isActive, role } = body;

    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    // Only allow self-update for non-privileged fields; admin-only for role/isActive changes
    const isSelf = auth.user.id === id;
    const isAdmin = hasPermission(auth.user.role as UserRole, 'users:manage');

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only admins can change role or isActive status
    if ((role !== undefined || isActive !== undefined) && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: role and isActive changes require admin privileges' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (jobTitle !== undefined && (isSelf || isAdmin)) updateData.jobTitle = jobTitle;
    if (department !== undefined && isAdmin) updateData.department = department;
    if (mfaEnabled !== undefined && isSelf) updateData.mfaEnabled = mfaEnabled;
    if (isActive !== undefined && isAdmin) updateData.isActive = isActive;
    if (role !== undefined && isAdmin) updateData.role = role;

    if (name) {
      updateData.avatar = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, name: true, role: true, avatar: true,
        department: true, jobTitle: true, phone: true, mfaEnabled: true, isActive: true, updatedAt: true,
      },
    });

    await writeAuditLog({
      userId: id,
      action: 'USER_PROFILE_UPDATED',
      performedBy: auth.user.id,
      resource: 'User',
      resourceId: id,
      details: { updatedFields: Object.keys(updateData), performedBySelf: isSelf },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Users PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
