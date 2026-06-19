import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import { canSeeSAR } from '@/lib/rbac';
import type { UserRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    // Always scope to the authenticated user's own notifications
    const where: Record<string, unknown> = { userId: auth.user.id };
    if (unreadOnly) where.read = false;

    // Tipping-off filter: client/agent roles cannot see SAR-related notifications
    if (!canSeeSAR(auth.user.role as UserRole)) {
      where.isSarRelated = false;
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await db.notification.count({
      where: { userId: auth.user.id, read: false, ...(!canSeeSAR(auth.user.role as UserRole) ? { isSarRelated: false } : {}) },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: auth.user.id, read: false },
        data: { read: true, readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      // Verify the notification belongs to the current user
      const notification = await db.notification.findUnique({ where: { id: notificationId } });
      if (!notification || notification.userId !== auth.user.id) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
      await db.notification.update({
        where: { id: notificationId },
        data: { read: true, readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
