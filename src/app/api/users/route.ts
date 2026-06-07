import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/users — Get current user profile or list users (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const role = searchParams.get('role');

    if (userId) {
      // Get specific user
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          department: true,
          jobTitle: true,
          phone: true,
          mfaEnabled: true,
          lastLoginAt: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              auditLogs: true,
              notifications: true,
              consentRecords: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(user);
    }

    // List users with optional role filter
    const where = role ? { role } : {};
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        department: true,
        jobTitle: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Summary
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const roleBreakdown: Record<string, number> = {};
    users.forEach(u => {
      roleBreakdown[u.role] = (roleBreakdown[u.role] || 0) + 1;
    });

    return NextResponse.json({
      users,
      summary: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers, roleBreakdown },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PATCH /api/users — Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, phone, jobTitle, department, mfaEnabled, isActive, role } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (department !== undefined) updateData.department = department;
    if (mfaEnabled !== undefined) updateData.mfaEnabled = mfaEnabled;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined) updateData.role = role;

    // Update avatar if name changed
    if (name) {
      updateData.avatar = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        department: true,
        jobTitle: true,
        phone: true,
        mfaEnabled: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: id,
        action: 'USER_PROFILE_UPDATED',
        performedBy: id,
        resource: 'User',
        resourceId: id,
        details: JSON.stringify({ updatedFields: Object.keys(updateData) }),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
