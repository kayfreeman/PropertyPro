import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { ROLE_LIST, type UserRole } from '@/lib/rbac';

// GET /api/users/[id] — Get single user details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
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
        partnerId: true,
        lastLoginAt: true,
        lastLoginIp: true,
        loginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
        partner: {
          select: { id: true, name: true, partnerType: true },
        },
        _count: {
          select: {
            auditLogs: true,
            notifications: true,
            consentRecords: true,
            profiles: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PATCH /api/users/[id] — Update user fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, role, department, jobTitle, phone, mfaEnabled, isActive, partnerId, resetPassword } = body;

    // Check user exists
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate role if provided
    if (role !== undefined && !ROLE_LIST.includes(role as UserRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${ROLE_LIST.join(', ')}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.avatar = name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (phone !== undefined) updateData.phone = phone;
    if (mfaEnabled !== undefined) updateData.mfaEnabled = mfaEnabled;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (partnerId !== undefined) updateData.partnerId = partnerId || null;

    // Reset password if requested
    let newPassword: string | null = null;
    if (resetPassword) {
      const generatePassword = () => {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };
      newPassword = generatePassword();
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(newPassword, salt);
      updateData.loginAttempts = 0;
      updateData.lockedUntil = null;
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
        partnerId: true,
        updatedAt: true,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: id,
        action: resetPassword ? 'USER_PASSWORD_RESET' : 'USER_UPDATED',
        resource: 'User',
        resourceId: id,
        details: JSON.stringify({
          updatedFields: Object.keys(updateData).filter(k => k !== 'passwordHash'),
          passwordReset: !!resetPassword,
        }),
      },
    });

    const response: Record<string, unknown> = { user };
    if (newPassword) {
      response.password = newPassword;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id] — Deactivate user (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check user exists
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Soft delete: set isActive to false
    const user = await db.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: id,
        action: 'USER_DEACTIVATED',
        resource: 'User',
        resourceId: id,
        details: JSON.stringify({ deactivatedAt: new Date().toISOString() }),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
