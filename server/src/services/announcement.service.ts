import { eq, and, or, desc } from 'drizzle-orm';
import { db } from '../config/db.js';
import { announcements, users, students } from '../models/schema.js';
import { AppError } from '../utils/response.js';
import { createNotificationForUsers } from './notification.service.js';
export async function listAnnouncements(filters?: { authorId?: string }) {
  const conditions = [];
  if (filters?.authorId) conditions.push(eq(announcements.authorId, filters.authorId));

  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      targetAudience: announcements.targetAudience,
      department: announcements.department,
      section: announcements.section,
      isPinned: announcements.isPinned,
      createdAt: announcements.createdAt,
      updatedAt: announcements.updatedAt,
      authorName: users.name,
      authorId: announcements.authorId,
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.authorId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
}

export async function getStudentAnnouncements(userId: string) {
  const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
  if (!student) throw new AppError('Student not found', 404);

  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      targetAudience: announcements.targetAudience,
      department: announcements.department,
      section: announcements.section,
      isPinned: announcements.isPinned,
      createdAt: announcements.createdAt,
      authorName: users.name,
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.authorId, users.id))
    .where(
      or(
        eq(announcements.targetAudience, 'all'),
        and(
          eq(announcements.targetAudience, 'department'),
          eq(announcements.department, student.department)
        ),
        and(
          eq(announcements.targetAudience, 'section'),
          eq(announcements.department, student.department),
          eq(announcements.section, student.section)
        )
      )
    )
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  authorId: string;
  targetAudience: 'all' | 'department' | 'section';
  department?: string;
  section?: string;
  isPinned?: boolean;
}) {
  const [announcement] = await db.insert(announcements).values(data).returning();

  let targetUserIds: string[] = [];
  if (data.targetAudience === 'all') {
    const allStudents = await db.select({ userId: students.userId }).from(students);
    targetUserIds = allStudents.map((s) => s.userId);
  } else if (data.targetAudience === 'department' && data.department) {
    const deptStudents = await db
      .select({ userId: students.userId })
      .from(students)
      .where(eq(students.department, data.department));
    targetUserIds = deptStudents.map((s) => s.userId);
  } else if (data.targetAudience === 'section' && data.department && data.section) {
    const sectionStudents = await db
      .select({ userId: students.userId })
      .from(students)
      .where(
        and(eq(students.department, data.department), eq(students.section, data.section))
      );
    targetUserIds = sectionStudents.map((s) => s.userId);
  }

  if (targetUserIds.length > 0) {
    await createNotificationForUsers(targetUserIds, {
      title: 'New Announcement',
      message: data.title,
      type: 'announcement',
      referenceId: announcement.id,
      referenceType: 'announcement',
    });
  }

  return announcement;
}

export async function updateAnnouncement(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    targetAudience: 'all' | 'department' | 'section';
    department: string;
    section: string;
    isPinned: boolean;
  }>
) {
  const [existing] = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  if (!existing) throw new AppError('Announcement not found', 404);

  const [updated] = await db
    .update(announcements)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(announcements.id, id))
    .returning();

  return updated;
}

export async function deleteAnnouncement(id: string) {
  const [existing] = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  if (!existing) throw new AppError('Announcement not found', 404);
  await db.delete(announcements).where(eq(announcements.id, id));
}
