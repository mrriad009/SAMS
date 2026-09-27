import { randomBytes } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { classSessions, sessionQrTokens, studentCourses, students } from '../models/schema.js';
import { AppError } from '../utils/response.js';
import { submitAttendance } from './attendance.service.js';

function extractToken(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new AppError('QR token is required', 400);

  try {
    const url = new URL(trimmed);
    const token = url.searchParams.get('token');
    if (token) return token;
  } catch {
    // Plain token, not a URL.
  }

  const match = trimmed.match(/[?&]token=([^&\s]+)/);
  return match ? decodeURIComponent(match[1]) : trimmed;
}

export async function createSessionQr(sessionId: string, createdBy: string, minutes = 15) {
  const [session] = await db.select().from(classSessions).where(eq(classSessions.id, sessionId)).limit(1);
  if (!session) throw new AppError('Session not found', 404);

  const windowMinutes = Math.min(30, Math.max(5, Math.round(minutes) || 15));
  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + windowMinutes * 60 * 1000);

  const [row] = await db
    .insert(sessionQrTokens)
    .values({ sessionId, token, expiresAt, createdBy })
    .returning();

  return {
    token: row.token,
    expiresAt: row.expiresAt,
    sessionId: row.sessionId,
    windowMinutes,
  };
}

export async function checkInWithQr(userId: string, rawToken: string) {
  const token = extractToken(rawToken);
  const [qr] = await db.select().from(sessionQrTokens).where(eq(sessionQrTokens.token, token)).limit(1);
  if (!qr) throw new AppError('This QR code is not valid', 404);
  if (qr.expiresAt.getTime() < Date.now()) throw new AppError('This QR code has expired', 400);

  const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
  if (!student) throw new AppError('Student profile not found', 404);

  const [session] = await db.select().from(classSessions).where(eq(classSessions.id, qr.sessionId)).limit(1);
  if (!session) throw new AppError('Class session not found', 404);

  const [enrollment] = await db
    .select()
    .from(studentCourses)
    .where(and(eq(studentCourses.studentId, student.id), eq(studentCourses.courseId, session.courseId)))
    .limit(1);
  if (!enrollment) throw new AppError('You are not enrolled in this class', 403);

  await submitAttendance(
    session.id,
    [{ studentId: student.id, status: 'present', markSource: 'qr', remarks: 'QR check-in' }],
    userId
  );

  return {
    sessionId: session.id,
    courseId: session.courseId,
    date: session.date,
    status: 'present' as const,
    markSource: 'qr' as const,
  };
}
