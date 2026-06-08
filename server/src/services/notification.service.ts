import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import { notifications } from '../models/schema.js';
import { AppError } from '../utils/response.js';

export async function getUserNotifications(userId: string, unreadOnly = false) {
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));
}

export async function markAsRead(id: string, userId: string) {
  const [notification] = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .limit(1);

  if (!notification) throw new AppError('Notification not found', 404);

  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id))
    .returning();

  return updated;
}

export async function markAllAsRead(userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function getUnreadCount(userId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return result?.count || 0;
}

export async function createNotification(
  userId: string,
  data: {
    title: string;
    message: string;
    type: 'low_attendance' | 'announcement' | 'session_reminder' | 'general';
    referenceId?: string;
    referenceType?: string;
  }
) {
  const [notification] = await db
    .insert(notifications)
    .values({ userId, ...data })
    .returning();

  return notification;
}

export async function createNotificationForUsers(
  userIds: string[],
  data: {
    title: string;
    message: string;
    type: 'low_attendance' | 'announcement' | 'session_reminder' | 'general';
    referenceId?: string;
    referenceType?: string;
  }
) {
  if (userIds.length === 0) return [];

  const values = userIds.map((userId) => ({ userId, ...data }));
  return db.insert(notifications).values(values).returning();
}
